const SocialMedia = require('../models/SocialMedia');
const WebsiteContent = require('../models/WebsiteContent');
const FeaturedProduct = require('../models/FeaturedProduct');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all website content sections
// @route   GET /api/v1/admin/content
// @access  Private/Admin
const getAllContent = asyncHandler(async (req, res, next) => {
  const { section, isActive } = req.query;
  
  const query = {};
  if (section) query.section = section;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const content = await WebsiteContent.find(query)
    .populate('lastUpdatedBy', 'firstName lastName')
    .sort({ section: 1, order: 1 });

  res.status(200).json({
    success: true,
    count: content.length,
    data: content
  });
});

// @desc    Create or update website content
// @route   POST /api/v1/admin/content
// @access  Private/Admin
const createOrUpdateContent = asyncHandler(async (req, res, next) => {
  req.body.lastUpdatedBy = req.user._id;

  const { section, key } = req.body;

  let content = await WebsiteContent.findOne({ section, key });

  if (content) {
    // Update existing content
    content = await WebsiteContent.findByIdAndUpdate(
      content._id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lastUpdatedBy', 'firstName lastName');
  } else {
    // Create new content
    content = await WebsiteContent.create(req.body);
    await content.populate('lastUpdatedBy', 'firstName lastName');
  }

  res.status(201).json({
    success: true,
    data: content
  });
});

// @desc    Delete website content
// @route   DELETE /api/v1/admin/content/:id
// @access  Private/Admin
const deleteContent = asyncHandler(async (req, res, next) => {
  const content = await WebsiteContent.findById(req.params.id);

  if (!content) {
    return next(new ErrorResponse('Content not found', 404));
  }

  await content.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get social media profiles
// @route   GET /api/v1/admin/social-media
// @access  Private/Admin
const getSocialMediaProfiles = asyncHandler(async (req, res, next) => {
  const profiles = await SocialMedia.find({})
    .sort({ order: 1, platform: 1 });

  res.status(200).json({
    success: true,
    count: profiles.length,
    data: profiles
  });
});

// @desc    Create social media profile
// @route   POST /api/v1/admin/social-media
// @access  Private/Admin
const createSocialMediaProfile = asyncHandler(async (req, res, next) => {
  const profile = await SocialMedia.create(req.body);

  res.status(201).json({
    success: true,
    data: profile
  });
});

// @desc    Update social media profile
// @route   PUT /api/v1/admin/social-media/:id
// @access  Private/Admin
const updateSocialMediaProfile = asyncHandler(async (req, res, next) => {
  let profile = await SocialMedia.findById(req.params.id);

  if (!profile) {
    return next(new ErrorResponse('Social media profile not found', 404));
  }

  profile = await SocialMedia.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Add post to social media profile
// @route   POST /api/v1/admin/social-media/:id/posts
// @access  Private/Admin
const addSocialMediaPost = asyncHandler(async (req, res, next) => {
  const profile = await SocialMedia.findById(req.params.id);

  if (!profile) {
    return next(new ErrorResponse('Social media profile not found', 404));
  }

  profile.posts.push({
    ...req.body,
    id: new Date().getTime().toString()
  });

  await profile.save();

  res.status(201).json({
    success: true,
    data: profile
  });
});

// @desc    Get featured products by section
// @route   GET /api/v1/admin/featured-products
// @access  Private/Admin
const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const { section, isActive } = req.query;
  
  const query = {};
  if (section) query.section = section;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const featuredProducts = await FeaturedProduct.find(query)
    .populate('product', 'name images price originalPrice category rating')
    .populate('createdBy', 'firstName lastName')
    .sort({ section: 1, order: 1 });

  res.status(200).json({
    success: true,
    count: featuredProducts.length,
    data: featuredProducts
  });
});

// @desc    Create featured product
// @route   POST /api/v1/admin/featured-products
// @access  Private/Admin
const createFeaturedProduct = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const featuredProduct = await FeaturedProduct.create(req.body);
  await featuredProduct.populate([
    { path: 'product', select: 'name images price originalPrice category rating' },
    { path: 'createdBy', select: 'firstName lastName' }
  ]);

  res.status(201).json({
    success: true,
    data: featuredProduct
  });
});

// @desc    Update featured product
// @route   PUT /api/v1/admin/featured-products/:id
// @access  Private/Admin
const updateFeaturedProduct = asyncHandler(async (req, res, next) => {
  let featuredProduct = await FeaturedProduct.findById(req.params.id);

  if (!featuredProduct) {
    return next(new ErrorResponse('Featured product not found', 404));
  }

  featuredProduct = await FeaturedProduct.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'product', select: 'name images price originalPrice category rating' },
    { path: 'createdBy', select: 'firstName lastName' }
  ]);

  res.status(200).json({
    success: true,
    data: featuredProduct
  });
});

// @desc    Delete featured product
// @route   DELETE /api/v1/admin/featured-products/:id
// @access  Private/Admin
const deleteFeaturedProduct = asyncHandler(async (req, res, next) => {
  const featuredProduct = await FeaturedProduct.findById(req.params.id);

  if (!featuredProduct) {
    return next(new ErrorResponse('Featured product not found', 404));
  }

  await featuredProduct.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Bulk update featured products order
// @route   PUT /api/v1/admin/featured-products/reorder
// @access  Private/Admin
const reorderFeaturedProducts = asyncHandler(async (req, res, next) => {
  const { items } = req.body; // Array of { id, order }

  const updatePromises = items.map(item =>
    FeaturedProduct.findByIdAndUpdate(item.id, { order: item.order })
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    success: true,
    message: 'Products reordered successfully'
  });
});

// @desc    Get all products for selection
// @route   GET /api/v1/admin/products-list
// @access  Private/Admin
const getProductsList = asyncHandler(async (req, res, next) => {
  const { search, category, page = 1, limit = 20 } = req.query;
  
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;

  const products = await Product.find(query)
    .select('name images price originalPrice category rating averageRating reviewCount isActive')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

module.exports = {
  getAllContent,
  createOrUpdateContent,
  deleteContent,
  getSocialMediaProfiles,
  createSocialMediaProfile,
  updateSocialMediaProfile,
  addSocialMediaPost,
  getFeaturedProducts,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  reorderFeaturedProducts,
  getProductsList
};
