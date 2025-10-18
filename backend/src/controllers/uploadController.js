const Upload = require('../models/Upload');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const { deleteFromCloudinary, getOptimizedImageUrl } = require('../config/cloudinary');
const sharp = require('sharp');

// @desc    Upload product images
// @route   POST /api/v1/uploads/products/:productId
// @access  Private/Admin
const uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { alt, captions } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Process uploaded files
    const uploadedImages = [];
    const captionArray = Array.isArray(captions) ? captions : [captions];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = captionArray[i] || '';

      // Create upload record
      const upload = await Upload.create({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        publicId: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        format: file.path.split('.').pop(),
        uploadType: 'product',
        uploadedBy: req.user.id,
        associatedWith: {
          model: 'Product',
          id: productId
        },
        alt: alt || `${product.name} image ${i + 1}`,
        caption: caption
      });

      uploadedImages.push(upload);

      // Add image to product
      product.images.push({
        url: upload.urls.medium,
        alt: upload.alt,
        caption: upload.caption,
        uploadId: upload._id
      });
    }

    await product.save();

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        uploads: uploadedImages,
        product: {
          id: product._id,
          name: product.name,
          totalImages: product.images.length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Upload user avatar
// @route   POST /api/v1/uploads/avatar
// @access  Private
const uploadUserAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar image uploaded'
      });
    }

    const file = req.file;

    // Delete old avatar if exists
    const user = await User.findById(userId);
    if (user.avatar && user.avatar.uploadId) {
      try {
        const oldUpload = await Upload.findById(user.avatar.uploadId);
        if (oldUpload) {
          await deleteFromCloudinary(oldUpload.publicId);
          await Upload.findByIdAndDelete(oldUpload._id);
        }
      } catch (deleteError) {
        console.log('Error deleting old avatar:', deleteError.message);
      }
    }

    // Create upload record
    const upload = await Upload.create({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      publicId: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      format: file.path.split('.').pop(),
      uploadType: 'avatar',
      uploadedBy: userId,
      associatedWith: {
        model: 'User',
        id: userId
      },
      alt: `${user.firstName} ${user.lastName} avatar`
    });

    // Update user avatar
    user.avatar = {
      url: upload.urls.medium,
      alt: upload.alt,
      uploadId: upload._id
    };
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        upload,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Upload review images
// @route   POST /api/v1/uploads/reviews/:reviewId
// @access  Private
const uploadReviewImages = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { captions } = req.body;

    // Check if review exists and belongs to user
    const review = await Review.findOne({
      _id: reviewId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not authorized'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Process uploaded files
    const uploadedImages = [];
    const captionArray = Array.isArray(captions) ? captions : [captions];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = captionArray[i] || '';

      // Create upload record
      const upload = await Upload.create({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        publicId: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        format: file.path.split('.').pop(),
        uploadType: 'review',
        uploadedBy: req.user.id,
        associatedWith: {
          model: 'Review',
          id: reviewId
        },
        alt: `Review image for ${review.title}`,
        caption: caption
      });

      uploadedImages.push(upload);

      // Add image to review
      review.images.push({
        url: upload.urls.medium,
        alt: upload.alt,
        caption: upload.caption,
        uploadId: upload._id
      });
    }

    await review.save();

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} review image(s) uploaded successfully`,
      data: {
        uploads: uploadedImages,
        review: {
          id: review._id,
          title: review.title,
          totalImages: review.images.length
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's uploads
// @route   GET /api/v1/uploads/my-uploads
// @access  Private
const getMyUploads = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      uploadType, 
      associatedModel 
    } = req.query;

    const filter = { uploadedBy: req.user.id, isActive: true };
    
    if (uploadType) filter.uploadType = uploadType;
    if (associatedModel) filter['associatedWith.model'] = associatedModel;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const uploads = await Upload.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('associatedWith.id', 'name title');

    const total = await Upload.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: uploads.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: uploads
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete upload
// @route   DELETE /api/v1/uploads/:id
// @access  Private
const deleteUpload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const upload = await Upload.findOne({
      _id: id,
      uploadedBy: req.user.id
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found or not authorized'
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(upload.publicId);

    // Remove from associated records
    if (upload.associatedWith.model === 'Product') {
      await Product.findByIdAndUpdate(
        upload.associatedWith.id,
        { $pull: { images: { uploadId: upload._id } } }
      );
    } else if (upload.associatedWith.model === 'User') {
      await User.findByIdAndUpdate(
        upload.associatedWith.id,
        { $unset: { avatar: 1 } }
      );
    } else if (upload.associatedWith.model === 'Review') {
      await Review.findByIdAndUpdate(
        upload.associatedWith.id,
        { $pull: { images: { uploadId: upload._id } } }
      );
    }

    // Delete upload record
    await Upload.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Upload deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all uploads (Admin only)
// @route   GET /api/v1/uploads
// @access  Private/Admin
const getAllUploads = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      uploadType, 
      associatedModel,
      uploadedBy 
    } = req.query;

    const filter = { isActive: true };
    
    if (uploadType) filter.uploadType = uploadType;
    if (associatedModel) filter['associatedWith.model'] = associatedModel;
    if (uploadedBy) filter.uploadedBy = uploadedBy;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const uploads = await Upload.find(filter)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('associatedWith.id', 'name title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Upload.countDocuments(filter);

    // Get upload statistics
    const stats = await Upload.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$uploadType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: uploads.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      stats,
      data: uploads
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProductImages,
  uploadUserAvatar,
  uploadReviewImages,
  getMyUploads,
  deleteUpload,
  getAllUploads
};
