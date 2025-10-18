const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const mongoose = require('mongoose');
// @desc    Get all available coupons for user
// @route   GET /api/v1/coupons/available
// @access  Private
const getAvailableCoupons = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's cart to check eligibility
    const cart = await Cart.findOne({ user: userId });
    const cartTotal = cart?.totals?.subtotal || 0;

    const now = new Date();
    
    // Direct query - no static method needed
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      minimumOrderValue: { $lte: cartTotal },
      // Only include coupons that haven't reached their usage limit
      $expr: {
        $or: [
          { $eq: ['$usageLimit', null] },
          { $lt: ['$usedCount', '$usageLimit'] }
        ]
      }
    })
    .select('code name description type value maxDiscount minimumOrderValue endDate usageLimit usedCount')
    .sort({ value: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });

  } catch (error) {
    console.error('Available coupons error:', error);
    next(error);
  }
};


// @desc    Validate and apply coupon to cart
// @route   POST /api/v1/coupons/apply
// @access  Private
const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;

    // Find coupon
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase(),
      isActive: true 
    }).populate('applicableProducts applicableCategories excludedProducts excludedCategories');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply coupon to empty cart'
      });
    }

    // Validate coupon eligibility
    const validation = await validateCouponEligibility(coupon, userId, cart);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Calculate discount
    const discountResult = calculateDiscount(coupon, cart);
    
    // Apply coupon to cart
    cart.appliedCoupon = {
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      discount: discountResult.discount,
      savings: discountResult.savings
    };

    await cart.save(); // This will trigger totals recalculation

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: cart.appliedCoupon,
        newTotal: cart.totals.total,
        savings: discountResult.savings
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/v1/coupons/remove
// @access  Private
const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    if (!cart.appliedCoupon) {
      return res.status(400).json({
        success: false,
        message: 'No coupon applied to cart'
      });
    }

    const removedCoupon = cart.appliedCoupon;
    cart.appliedCoupon = undefined;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      data: {
        removedCoupon,
        newTotal: cart.totals.total
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin only)
// @route   POST /api/v1/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user.id
    };

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    next(error);
  }
};

// @desc    Get all coupons (Admin only)
// @route   GET /api/v1/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isActive, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (typeof isActive === 'string') filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { code: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: coupons.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: coupons
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin only)
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin only)
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get coupon analytics (Admin only)
// @route   GET /api/v1/coupons/:id/analytics
// @access  Private/Admin
const getCouponAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Get detailed analytics from orders
    const analyticsData = await mongoose.connection.collection('orders').aggregate([
      { $match: { 'appliedCoupon.code': coupon.code } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totals.total' },
          totalSavings: { $sum: '$appliedCoupon.savings' },
          averageOrderValue: { $avg: '$totals.total' },
          averageSavings: { $avg: '$appliedCoupon.savings' }
        }
      }
    ]).toArray();

    const analytics = analyticsData[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalSavings: 0,
      averageOrderValue: 0,
      averageSavings: 0
    };

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value,
          usedCount: coupon.usedCount,
          remainingUses: coupon.remainingUses,
          usagePercentage: coupon.usagePercentage
        },
        analytics
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to validate coupon eligibility
const validateCouponEligibility = async (coupon, userId, cart) => {
  const now = new Date();

  // Check if coupon is currently valid
  if (!coupon.isCurrentlyValid) {
    if (!coupon.isActive) return { isValid: false, message: 'Coupon is not active' };
    if (coupon.startDate > now) return { isValid: false, message: 'Coupon is not yet active' };
    if (coupon.endDate < now) return { isValid: false, message: 'Coupon has expired' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { isValid: false, message: 'Coupon usage limit reached' };
    }
  }

  // Check minimum/maximum order value
  if (cart.totals.subtotal < coupon.minimumOrderValue) {
    return { 
      isValid: false, 
      message: `Minimum order value of ₹${coupon.minimumOrderValue} required` 
    };
  }

  if (coupon.maximumOrderValue && cart.totals.subtotal > coupon.maximumOrderValue) {
    return { 
      isValid: false, 
      message: `Maximum order value of ₹${coupon.maximumOrderValue} exceeded` 
    };
  }

  // Check user restrictions
  if (coupon.excludedUsers.includes(userId)) {
    return { isValid: false, message: 'You are not eligible for this coupon' };
  }

  if (coupon.applicableUsers.length > 0 && !coupon.applicableUsers.includes(userId)) {
    return { isValid: false, message: 'This coupon is not available for your account' };
  }

  // Check if user has already used this coupon
  const userUsageCount = await mongoose.connection.collection('orders').countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    'appliedCoupon.code': coupon.code
  });

  if (userUsageCount >= coupon.usageLimitPerUser) {
    return { isValid: false, message: 'You have already used this coupon' };
  }

  // Check new users only restriction
  if (coupon.newUsersOnly) {
    const userOrderCount = await mongoose.connection.collection('orders').countDocuments({
      user: new mongoose.Types.ObjectId(userId)
    });
    if (userOrderCount > 0) {
      return { isValid: false, message: 'This coupon is only for new users' };
    }
  }

  return { isValid: true };
};

// Helper function to calculate discount
const calculateDiscount = (coupon, cart) => {
  let discount = 0;
  let savings = 0;

  switch (coupon.type) {
    case 'percentage':
      savings = (cart.totals.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        savings = Math.min(savings, coupon.maxDiscount);
      }
      discount = coupon.value;
      break;

    case 'fixed':
      savings = Math.min(coupon.value, cart.totals.subtotal);
      discount = savings;
      break;

    case 'shipping':
      savings = cart.totals.shipping;
      discount = 100; // 100% shipping discount
      break;

    case 'bogo':
      // BOGO logic - simplified for now
      savings = calculateBOGODiscount(coupon, cart);
      discount = savings;
      break;

    default:
      savings = 0;
      discount = 0;
  }

  return { discount, savings: Math.round(savings * 100) / 100 };
};

// Helper function for BOGO discount calculation
const calculateBOGODiscount = (coupon, cart) => {
  // Simplified BOGO - can be enhanced based on specific business rules
  const { buyQuantity, getQuantity, getDiscount } = coupon.bogoConfig;
  let totalSavings = 0;

  for (const item of cart.items) {
    const eligibleQuantity = Math.floor(item.quantity / buyQuantity) * getQuantity;
    const itemSavings = (item.price * eligibleQuantity * getDiscount) / 100;
    totalSavings += itemSavings;
  }

  return totalSavings;
};

module.exports = {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponAnalytics
};
