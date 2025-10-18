const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Offer = require('../models/Offer');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get comprehensive analytics for admin dashboard
// @route   GET /api/v1/admin/analytics/comprehensive
// @access  Private/Admin
const getComprehensiveAnalytics = asyncHandler(async (req, res, next) => {
  const { timeframe = '30d' } = req.query;
  
  // Calculate date ranges
  const now = new Date();
  let startDate, previousStartDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  }

  try {
    // === OVERVIEW METRICS ===
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      currentPeriodUsers,
      previousPeriodUsers,
      currentPeriodOrders,
      previousPeriodOrders,
      currentRevenue,
      previousRevenue,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Category.countDocuments(),
      User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: previousStartDate, $lt: startDate }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ])
    ]);

    // Calculate growth percentages
    const userGrowth = previousPeriodUsers > 0 ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers * 100) : 0;
    const orderGrowth = previousPeriodOrders > 0 ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders * 100) : 0;
    const revenueGrowth = (previousRevenue[0]?.total || 0) > 0 ? (((currentRevenue[0]?.total || 0) - (previousRevenue[0]?.total || 0)) / (previousRevenue[0]?.total || 0) * 100) : 0;

    // === DETAILED ANALYTICS ===
    
    // Daily sales trend
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
          revenue: { $sum: '$totals.total' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          customerCount: { $size: '$customers' },
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      { $sort: { date: 1 } },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: 1,
          orders: 1,
          customers: '$customerCount'
        }
      }
    ]);

    // User registration trend
    const userRegistrations = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          registrations: { $sum: 1 }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      { $sort: { date: 1 } },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          registrations: 1
        }
      }
    ]);

    // Order status breakdown with revenue
    const orderStatusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totals.total' },
          percentage: { $sum: 1 }
        }
      },
      {
        $addFields: {
          percentage: { $multiply: [{ $divide: ['$count', totalOrders] }, 100] }
        }
      }
    ]);

    // Top performing products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
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
          image: { $arrayElemAt: ['$productInfo.images', 0] },
          category: '$productInfo.category',
          price: '$productInfo.price',
          totalSold: 1,
          revenue: 1,
          ordersCount: 1,
          averageOrderValue: { $divide: ['$revenue', '$ordersCount'] }
        }
      }
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
          revenue: { $sum: '$items.subtotal' },
          productCount: { $addToSet: '$items.product' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          uniqueProducts: { $size: '$productCount' },
          averageOrderValue: { $divide: ['$revenue', '$orderCount'] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Customer analytics
    const customerAnalytics = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.totals.total'
              }
            }
          },
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
          },
          averageOrderValue: { $avg: { $divide: ['$totalSpent', '$orderCount'] } },
          averageLifetimeValue: { $avg: '$totalSpent' },
          highValueCustomers: {
            $sum: { $cond: [{ $gt: ['$totalSpent', 1000] }, 1, 0] }
          }
        }
      }
    ]);

    // Recent activities
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(15)
      .select('orderNumber status totals.total createdAt items');

    const recentUsers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(15)
      .select('firstName lastName email createdAt isEmailVerified');

    // Inventory alerts
    const lowStockProducts = await Product.find({
      'inventory.trackQuantity': true,
      $expr: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
    })
      .select('name inventory.stock inventory.lowStockThreshold images category')
      .populate('category', 'name')
      .limit(20);

    const outOfStockProducts = await Product.find({
      'inventory.trackQuantity': true,
      'inventory.stock': { $lte: 0 }
    })
      .select('name inventory.stock images category')
      .populate('category', 'name')
      .limit(20);

    // Geographic analytics (if available)
    const geographicData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'shippingAddress.city': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            city: '$shippingAddress.city',
            state: '$shippingAddress.state'
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totals.total' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          location: { $concat: ['$_id.city', ', ', '$_id.state'] },
          orders: 1,
          revenue: 1
        }
      }
    ]);

    // Monthly comparison
    const monthlyComparison = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getFullYear(), 0, 1) },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totals.total' },
          customers: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          customerCount: { $size: '$customers' },
          monthName: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Revenue by payment method
    const paymentMethodBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totals.total' }
        }
      }
    ]);

    // Active campaigns
    const activeBanners = await Banner.countDocuments({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: { $exists: false } }
      ]
    });

    const activeOffers = await Offer.countDocuments({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
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
          currentPeriodRevenue: currentRevenue[0]?.total || 0,
          currentPeriodUsers,
          currentPeriodOrders,
          userGrowth: Math.round(userGrowth * 100) / 100,
          orderGrowth: Math.round(orderGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0,
          activeBanners,
          activeOffers
        },
        trends: {
          dailySales,
          userRegistrations,
          monthlyComparison
        },
        breakdown: {
          orderStatusBreakdown,
          categoryPerformance,
          paymentMethodBreakdown,
          geographicData
        },
        products: {
          topProducts,
          lowStockProducts,
          outOfStockProducts
        },
        customers: customerAnalytics[0] || {
          totalCustomers: 0,
          repeatCustomers: 0,
          averageOrderValue: 0,
          averageLifetimeValue: 0,
          highValueCustomers: 0
        },
        recent: {
          orders: recentOrders,
          users: recentUsers
        },
        metadata: {
          timeframe,
          generatedAt: new Date(),
          startDate,
          endDate: now
        }
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

// @desc    Get real-time dashboard stats
// @route   GET /api/v1/admin/analytics/realtime
// @access  Private/Admin
const getRealtimeStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  try {
    const [
      todayOrders,
      yesterdayOrders,
      todayRevenue,
      yesterdayRevenue,
      todayUsers,
      yesterdayUsers,
      onlineUsers, // This would need session tracking implementation
      pendingOrders
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: yesterday, $lt: today }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]),
      User.countDocuments({ role: 'customer', createdAt: { $gte: today } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: yesterday, $lt: today } }),
      0, // Placeholder for online users - would need real session tracking
      Order.countDocuments({ status: 'pending' })
    ]);

    const orderGrowth = yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100) : 0;
    const revenueGrowth = (yesterdayRevenue[0]?.total || 0) > 0 ? (((todayRevenue[0]?.total || 0) - (yesterdayRevenue[0]?.total || 0)) / (yesterdayRevenue[0]?.total || 0) * 100) : 0;
    const userGrowth = yesterdayUsers > 0 ? ((todayUsers - yesterdayUsers) / yesterdayUsers * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        today: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0,
          users: todayUsers,
          onlineUsers
        },
        yesterday: {
          orders: yesterdayOrders,
          revenue: yesterdayRevenue[0]?.total || 0,
          users: yesterdayUsers
        },
        growth: {
          orders: Math.round(orderGrowth * 100) / 100,
          revenue: Math.round(revenueGrowth * 100) / 100,
          users: Math.round(userGrowth * 100) / 100
        },
        alerts: {
          pendingOrders,
          lowStock: await Product.countDocuments({
            'inventory.trackQuantity': true,
            $expr: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
          }),
          outOfStock: await Product.countDocuments({
            'inventory.trackQuantity': true,
            'inventory.stock': { $lte: 0 }
          })
        }
      }
    });

  } catch (error) {
    console.error('Realtime Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching realtime stats',
      error: error.message
    });
  }
});

module.exports = {
  getComprehensiveAnalytics,
  getRealtimeStats
};
