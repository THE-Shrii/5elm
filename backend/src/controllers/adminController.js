const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

// @desc    Get admin dashboard analytics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // Date ranges for comparison
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Revenue analytics
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);

    const weeklyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeek }, status: { $ne: 'cancelled' } } },
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

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber status totals.total createdAt');

    // Top selling products
    const topProducts = await Order.aggregate([
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

    // Monthly sales chart data
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(today.getFullYear(), 0, 1) }, // This year
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totals.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // User registration trend
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      'inventory.trackQuantity': true,
      $expr: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
    })
      .select('name inventory.stock inventory.lowStockThreshold images')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          weeklyRevenue: weeklyRevenue[0]?.total || 0
        },
        orderStatusBreakdown,
        recentOrders,
        topProducts,
        monthlySales,
        userGrowth,
        lowStockProducts,
        performance: {
          averageOrderValue: totalRevenue[0]?.total / totalOrders || 0,
          conversionRate: totalOrders / totalUsers * 100 || 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get user statistics
    for (let user of users) {
      const orderCount = await Order.countDocuments({ user: user._id });
      const totalSpent = await Order.aggregate([
        { $match: { user: user._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]);
      
      user._doc.orderCount = orderCount;
      user._doc.totalSpent = totalSpent[0]?.total || 0;
    }

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: users
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for admin
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'shippingAddress.fullName': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: orders
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/v1/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, carrier } = req.body;
    const { id } = req.params;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.status = status;
    
    // Add tracking info if provided
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (carrier) order.shipping.carrier = carrier;
    
    // Add to timeline
    order.timeline.push({
      status,
      message: `Order ${status} by admin`,
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get all products for admin
// @route   GET /api/v1/admin/products
// @access  Private/Admin
const getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    // Add sales data for each product
    for (let product of products) {
      const salesData = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.product': product._id } },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' }
          }
        }
      ]);
      
      product._doc.salesData = salesData[0] || { totalSold: 0, totalRevenue: 0 };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: products
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      id, 
      { ...req.body, lastModified: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has orders
    const hasOrders = await Order.exists({ 'items.product': id });
    if (hasOrders) {
      // Soft delete - change status instead of removing
      product.status = 'deleted';
      await product.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product archived (has existing orders)'
      });
    }

    // Hard delete if no orders
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/v1/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const updateData = {};
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getDashboardAnalytics,
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,        
  updateProduct,        
  deleteProduct,        
  updateUserStatus      
};