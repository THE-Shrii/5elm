const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    });
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products from your delivered orders'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
      purchaseDate: order.createdAt
    });

    // Update product rating statistics
    await updateProductRatingStats(productId);

    // Populate review for response
    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'product', select: 'name images' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      verified = true 
    } = req.query;

    // Build filter
    const filter = { 
      product: productId, 
      status: 'approved' 
    };
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    if (verified === 'true') {
      filter.verified = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Special sorting for helpful reviews
    if (sortBy === 'helpful') {
      sort['analytics.helpfulCount'] = -1;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Calculate overall statistics
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          totalHelpfulVotes: { $sum: '$analytics.helpfulCount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      stats: stats[0] || { averageRating: 0, totalReviews: 0, totalHelpfulVotes: 0 },
      ratingDistribution,
      data: reviews
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/v1/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name images slug')
      .populate('order', 'orderNumber createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: reviews
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: id, user: userId });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Update product rating statistics
    await updateProductRatingStats(review.product);

    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'product', select: 'name images' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: id, user: userId });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    await Review.findByIdAndDelete(id);

    // Update product rating statistics
    await updateProductRatingStats(review.product);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Vote on review helpfulness
// @route   POST /api/v1/reviews/:id/vote
// @access  Private
const voteOnReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already voted
    const existingVoteIndex = review.helpfulVotes.findIndex(
      vote => vote.user.toString() === userId
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      review.helpfulVotes[existingVoteIndex].isHelpful = isHelpful;
      review.helpfulVotes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      review.helpfulVotes.push({
        user: userId,
        isHelpful,
        votedAt: new Date()
      });
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulCount: review.analytics.helpfulCount,
        unhelpfulCount: review.analytics.unhelpfulCount
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Report a review
// @route   POST /api/v1/reviews/:id/report
// @access  Private
const reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reports.find(
      report => report.user.toString() === userId
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Add report
    review.reports.push({
      user: userId,
      reason,
      description,
      reportedAt: new Date()
    });

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to update product rating statistics
const updateProductRatingStats = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const { averageRating, totalReviews, ratingDistribution } = stats[0];
      
      // Calculate rating distribution
      const distribution = {
        1: ratingDistribution.filter(r => r === 1).length,
        2: ratingDistribution.filter(r => r === 2).length,
        3: ratingDistribution.filter(r => r === 3).length,
        4: ratingDistribution.filter(r => r === 4).length,
        5: ratingDistribution.filter(r => r === 5).length
      };

      await Product.findByIdAndUpdate(productId, {
        'reviews.averageRating': Math.round(averageRating * 10) / 10,
        'reviews.totalReviews': totalReviews,
        'reviews.ratingDistribution': distribution
      });
    } else {
      // No reviews, reset stats
      await Product.findByIdAndUpdate(productId, {
        'reviews.averageRating': 0,
        'reviews.totalReviews': 0,
        'reviews.ratingDistribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  } catch (error) {
    console.error('Error updating product rating stats:', error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  voteOnReview,
  reportReview
};
