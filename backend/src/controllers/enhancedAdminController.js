const Banner = require('../models/Banner');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get comprehensive dashboard analytics
// @route   GET /api/v1/admin/dashboard-analytics
// @access  Private/Admin
const getComprehensiveDashboard = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  // Calculate date ranges
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Total counts
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalCategories = await Category.countDocuments();

  // Revenue analytics
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    { $group: { _id: null, total: { $sum: '$totals.total' } } }
  ]);

  const periodRevenue = await Order.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled', 'refunded'] }
      }
    },
    { $group: { _id: null, total: { $sum: '$totals.total' } } }
  ]);

  // Order status breakdown
  const orderStatusBreakdown = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$totals.total' }
      }
    }
  ]);

  // Top selling products
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        name: '$productInfo.name',
        image: { $arrayElemAt: ['$productInfo.images.url', 0] },
        totalSold: 1,
        revenue: 1
      }
    }
  ]);

  // Recent activities
  const recentOrders = await Order.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber status totals.total createdAt user');

  const recentUsers = await User.find({ role: 'customer' })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('firstName lastName email createdAt isEmailVerified');

  // Sales chart data (daily for the period)
  const dailySales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled', 'refunded'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        sales: { $sum: '$totals.total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo._id',
        name: { $first: '$categoryInfo.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Active offers and banners count
  const activeOffers = await Offer.countDocuments({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  const activeBanners = await Banner.countDocuments({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: { $exists: false } }
    ]
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalRevenue: totalRevenue[0]?.total || 0,
        periodRevenue: periodRevenue[0]?.total || 0,
        activeOffers,
        activeBanners
      },
      orderStatusBreakdown,
      topProducts,
      recentOrders,
      recentUsers,
      dailySales,
      categoryPerformance,
      period
    }
  });
});

// @desc    Get all banners with filtering
// @route   GET /api/v1/admin/banners
// @access  Private/Admin
const getAllBanners = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    type,
    position,
    isActive,
    search
  } = req.query;

  const query = {};
  
  if (type) query.type = type;
  if (position) query.position = position;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const banners = await Banner.find(query)
    .populate('createdBy', 'firstName lastName')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Banner.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      banners,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Create new banner
// @route   POST /api/v1/admin/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  
  const banner = await Banner.create(req.body);
  await banner.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    data: banner
  });
});

// @desc    Update banner
// @route   PUT /api/v1/admin/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res, next) => {
  let banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse('Banner not found', 404));
  }

  banner = await Banner.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName');

  res.status(200).json({
    success: true,
    data: banner
  });
});

// @desc    Delete banner
// @route   DELETE /api/v1/admin/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(new ErrorResponse('Banner not found', 404));
  }

  await banner.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all offers with filtering
// @route   GET /api/v1/admin/offers
// @access  Private/Admin
const getAllOffers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    type,
    isActive,
    search
  } = req.query;

  const query = {};
  
  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const offers = await Offer.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('applicableProducts', 'name images')
    .populate('applicableCategories', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Offer.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      offers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Create new offer
// @route   POST /api/v1/admin/offers
// @access  Private/Admin
const createOffer = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  
  const offer = await Offer.create(req.body);
  await offer.populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { path: 'applicableProducts', select: 'name images' },
    { path: 'applicableCategories', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    data: offer
  });
});

// @desc    Update offer
// @route   PUT /api/v1/admin/offers/:id
// @access  Private/Admin
const updateOffer = asyncHandler(async (req, res, next) => {
  let offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(new ErrorResponse('Offer not found', 404));
  }

  offer = await Offer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    { path: 'createdBy', select: 'firstName lastName' },
    { path: 'applicableProducts', select: 'name images' },
    { path: 'applicableCategories', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    data: offer
  });
});

// @desc    Delete offer
// @route   DELETE /api/v1/admin/offers/:id
// @access  Private/Admin
const deleteOffer = asyncHandler(async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return next(new ErrorResponse('Offer not found', 404));
  }

  await offer.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getComprehensiveDashboard,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
