const { sendEmail } = require('../config/email');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const emailData = {
      firstName: user.firstName,
      email: user.email,
      shopUrl: `${process.env.FRONTEND_URL}/products` || 'https://5elm.com/products'
    };

    await sendEmail({
      to: user.email,
      subject: '🎉 Welcome to 5ELM - Your Premium Shopping Destination!',
      template: 'welcome',
      data: emailData
    });

    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

// @desc    Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    // Populate order with user and product details
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name images' }
    ]);

    const emailData = {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      paymentMethod: order.payment.method.toUpperCase(),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        subtotal: item.subtotal.toLocaleString('en-IN'),
        variant: item.variant
      })),
      total: order.totals.total.toLocaleString('en-IN'),
      shippingAddress: order.shippingAddress,
      trackingUrl: `${process.env.FRONTEND_URL}/orders/${order._id}` || `https://5elm.com/orders/${order._id}`
    };

    await sendEmail({
      to: order.user.email,
      subject: `Order Confirmation - ${order.orderNumber} | 5ELM`,
      template: 'order-confirmation',
      data: emailData
    });

    console.log(`Order confirmation email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
};

// @desc    Send order shipped email
const sendOrderShippedEmail = async (order) => {
  try {
    await order.populate('user', 'firstName lastName email');

    const emailData = {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      trackingNumber: order.shipping.trackingNumber || 'Will be updated soon',
      carrier: order.shipping.carrier || 'Standard Shipping',
      estimatedDelivery: order.shipping.estimatedDelivery 
        ? order.shipping.estimatedDelivery.toLocaleDateString('en-IN')
        : 'Within 5-7 business days',
      trackingUrl: order.shipping.trackingNumber 
        ? `https://track.example.com/${order.shipping.trackingNumber}`
        : `${process.env.FRONTEND_URL}/orders/${order._id}`
    };

    await sendEmail({
      to: order.user.email,
      subject: `📦 Your Order ${order.orderNumber} is on the Way! | 5ELM`,
      template: 'order-shipped',
      data: emailData
    });

    console.log(`Order shipped email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
  }
};

// @desc    Send order delivered email
const sendOrderDeliveredEmail = async (order) => {
  try {
    await order.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'items.product', select: 'name' }
    ]);

    const emailData = {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      deliveredDate: order.deliveredAt.toLocaleDateString('en-IN'),
      items: order.items.map(item => ({ name: item.name })),
      reviewUrl: `${process.env.FRONTEND_URL}/orders/${order._id}/review` || `https://5elm.com/orders/${order._id}/review`
    };

    await sendEmail({
      to: order.user.email,
      subject: `✅ Order ${order.orderNumber} Delivered! | 5ELM`,
      template: 'order-delivered',
      data: emailData
    });

    console.log(`Order delivered email sent for ${order.orderNumber}`);
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
  }
};

// @desc    Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}` || `https://5elm.com/reset-password/${resetToken}`;

    const emailData = {
      firstName: user.firstName,
      resetUrl,
      expiresIn: '10 minutes'
    };

    await sendEmail({
      to: user.email,
      subject: '🔐 Password Reset Request | 5ELM',
      template: 'password-reset',
      data: emailData
    });

    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendPasswordResetEmail
};
