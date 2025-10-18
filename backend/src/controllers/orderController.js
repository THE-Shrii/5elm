const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');
const { sendOrderConfirmationEmail, sendOrderShippedEmail } = require('./emailController');

// Create a new order
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
    const userId = req.user.id; // Changed from req.user._id to match our auth middleware

    // Get user's cart with populated products
    const cart = await Cart.findOne({ user: userId }) // Changed from userId to user
      .populate('items.product', 'name price inventory.stock');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.'
      });
    }

    // Check inventory availability
    for (let item of cart.items) {
      const product = item.product;
      if (product.inventory.trackQuantity && item.quantity > product.inventory.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.inventory.stock} available.`
        });
      }
    }

    // Generate order number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderNumber = `5ELM${timestamp}${random}`;

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant,
      subtotal: (item.price + (item.variant?.price || 0)) * item.quantity
    }));

    // Create order with proper schema structure
    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      totals: cart.totals, // Use the cart's calculated totals
      shippingAddress: shippingAddress || {
        fullName: req.body.fullName || 'Customer',
        phoneNumber: req.body.phone || '',
        addressLine1: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        postalCode: req.body.postalCode || '',
        country: 'India'
      },
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod || 'cod',
        status: 'pending'
      },
      shipping: {
        method: cart.shippingMethod || 'standard',
        estimatedDelivery: cart.estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      appliedCoupon: cart.appliedCoupon,
      notes,
      timeline: [{
        status: 'pending',
        message: 'Order created',
        timestamp: new Date()
      }]
    });

    await order.save();

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(order).catch(err => {
      console.error('Email sending failed:', err.message);
    });

    // Update product inventory and analytics
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 
          'inventory.stock': -item.quantity,
          'analytics.purchases': item.quantity,
          'analytics.revenue': (item.price + (item.variant?.price || 0)) * item.quantity
        }
      });
    }

    // Clear the cart
    cart.items = [];
    cart.appliedCoupon = undefined;
    await cart.save();

    // Clear cart cache
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.del(`cart:${userId}`);
      } catch (cacheError) {
        console.log('Cart cache clear error:', cacheError.message);
      }
    }

    // Populate order for response
    await order.populate('items.product', 'name images slug');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order // Changed from 'order' to 'data' for consistency
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders for a user
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name images slug')
      .sort({ createdAt: -1 })
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
      data: orders // Changed from 'orders' to 'data' for consistency
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific order
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id)
      .populate('items.product', 'name images slug category')
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    await order.save();

    // Restore inventory
    for (let item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.stock': item.quantity }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    next(error);
  }
};

// Get order statistics
const getOrderStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totals.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalSpent = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        statusBreakdown: stats
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getOrderStats
};
