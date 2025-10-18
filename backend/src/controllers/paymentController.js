const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { 
  createRazorpayOrder, 
  verifyPaymentSignature, 
  fetchPayment,
  createRefund 
} = require('../config/razorpay');
const { v4: uuidv4 } = require('uuid');

// @desc    Create payment order
// @route   POST /api/v1/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, notes } = req.body;
    const userId = req.user.id;

    // Get the order
    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already paid or cancelled
    if (['paid', 'cancelled'].includes(order.payment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot create payment for ${order.payment.status} order`
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ 
      order: orderId,
      status: { $in: ['created', 'attempted'] }
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment order already exists',
        data: {
          razorpayOrderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          orderId: order.orderNumber
        }
      });
    }

    // Create Razorpay order
    const receipt = `5ELM_${order.orderNumber}_${Date.now()}`;
    const amount = order.totals.total;

    const razorpayOrder = await createRazorpayOrder(
      amount,
      'INR',
      receipt,
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: userId,
        ...notes
      }
    );

    // Create payment record
    const payment = await Payment.create({
      razorpayOrderId: razorpayOrder.id,
      order: orderId,
      user: userId,
      amount: amount,
      currency: 'INR',
      status: 'created',
      notes: {
        orderNumber: order.orderNumber,
        ...notes
      },
      analytics: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        paymentFlow: 'checkout'
      }
    });

    // Update order payment status
    order.payment.razorpayOrderId = razorpayOrder.id;
    order.payment.status = 'pending';
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        currency: 'INR',
        orderId: order.orderNumber,
        key: process.env.RAZORPAY_KEY_ID,
        name: '5ELM',
        description: `Payment for Order ${order.orderNumber}`,
        image: 'https://your-domain.com/logo.png', // Replace with your logo
        prefill: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          contact: req.user.phone || ''
        },
        notes: {
          orderNumber: order.orderNumber,
          customerId: userId
        },
        theme: {
          color: '#3399cc'
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment
// @route   POST /api/v1/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user.id
    }).populate('order');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await fetchPayment(razorpay_payment_id);

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    payment.method = razorpayPayment.method;
    payment.bank = razorpayPayment.bank;
    payment.wallet = razorpayPayment.wallet;
    payment.vpa = razorpayPayment.vpa;
    payment.cardNetwork = razorpayPayment.card?.network;
    payment.cardType = razorpayPayment.card?.type;
    payment.fee = razorpayPayment.fee ? razorpayPayment.fee / 100 : 0;
    payment.tax = razorpayPayment.tax ? razorpayPayment.tax / 100 : 0;
    payment.isVerified = true;
    payment.verifiedAt = new Date();
    payment.capturedAt = new Date(razorpayPayment.created_at * 1000);

    await payment.save();

    // Update order status
    const order = payment.order;
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    order.payment.method = 'razorpay';
    order.payment.transactionId = razorpay_payment_id;
    order.status = 'confirmed';
    
    // Add to order timeline
    order.timeline.push({
      status: 'confirmed',
      message: 'Payment confirmed and order processed',
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment._id,
        orderId: order.orderNumber,
        amount: payment.amount,
        status: payment.status,
        method: payment.method
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Handle payment failure
// @route   POST /api/v1/payments/failure
// @access  Private
const handlePaymentFailure = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      error
    } = req.body;

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user.id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment with failure details
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.errorCode = error.code;
    payment.errorDescription = error.description;
    payment.errorSource = error.source;
    payment.errorStep = error.step;
    payment.errorReason = error.reason;
    payment.analytics.attemptCount += 1;

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded',
      data: {
        paymentId: payment._id,
        canRetry: payment.analytics.attemptCount < 3
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/v1/payments/my-payments
// @access  Private
const getMyPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    const filter = { user: req.user.id };
    
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber totals.total status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: payments
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Process refund
// @route   POST /api/v1/payments/:paymentId/refund
// @access  Private/Admin
const processRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, notes } = req.body;

    // Find payment
    const payment = await Payment.findById(paymentId).populate('order');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund successful payments'
      });
    }

    // Calculate refund amount
    const refundAmount = amount || (payment.amount - payment.totalRefunded);
    
    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund amount'
      });
    }

    if (refundAmount > (payment.amount - payment.totalRefunded)) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds available balance'
      });
    }

    // Create refund with Razorpay
    const razorpayRefund = await createRefund(
      payment.razorpayPaymentId,
      refundAmount,
      { reason, ...notes }
    );

    // Add refund to payment
    await payment.addRefund({
      refundId: razorpayRefund.id,
      amount: refundAmount,
      status: 'processed',
      reason: reason,
      notes: notes,
      processedAt: new Date()
    });

    // Update order if fully refunded
    if (payment.refundStatus === 'full') {
      const order = payment.order;
      order.status = 'refunded';
      order.timeline.push({
        status: 'refunded',
        message: `Full refund processed: ₹${refundAmount}`,
        timestamp: new Date()
      });
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: razorpayRefund.id,
        amount: refundAmount,
        status: 'processed',
        paymentStatus: payment.status,
        remainingAmount: payment.amount - payment.totalRefunded - refundAmount
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get payment analytics (Admin only)
// @route   GET /api/v1/payments/analytics
// @access  Private/Admin
const getPaymentAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case '1d':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Simple analytics without Payment model dependency for now
    res.status(200).json({
      success: true,
      period,
      dateRange: {
        startDate,
        endDate
      },
      data: {
        overview: {
          totalPayments: 0,
          totalAmount: 0,
          successfulPayments: 0,
          successfulAmount: 0,
          failedPayments: 0,
          averageAmount: 0
        },
        methodBreakdown: [],
        successRate: 0
      }
    });

  } catch (error) {
    next(error);
  }
};

// Export all functions - MAKE SURE ALL FUNCTIONS ARE DEFINED ABOVE
module.exports = {
  createPaymentOrder,      
  verifyPayment,          
  handlePaymentFailure,   
  getMyPayments,          
  processRefund,          
  getPaymentAnalytics     
};
