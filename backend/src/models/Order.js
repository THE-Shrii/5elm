const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  // Define items inline instead of separate schema
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    name: { 
      type: String, 
      required: [true, 'Product name is required'] 
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    variant: {
      name: String,
      value: String,
      price: { type: Number, default: 0 }
    },
    subtotal: { 
      type: Number, 
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    }
  }],
  
  // Pricing
  totals: {
    subtotal: { 
      type: Number, 
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    tax: { 
      type: Number, 
      required: [true, 'Tax amount is required'],
      min: [0, 'Tax cannot be negative']
    },
    shipping: { 
      type: Number, 
      required: [true, 'Shipping cost is required'],
      min: [0, 'Shipping cost cannot be negative']
    },
    discount: { 
      type: Number, 
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: { 
      type: Number, 
      required: [true, 'Total amount is required'],
      min: [0, 'Total cannot be negative']
    }
  },
  
  // Addresses
  shippingAddress: {
    fullName: { 
      type: String, 
      required: [true, 'Full name is required'],
      trim: true
    },
    phoneNumber: { 
      type: String, 
      required: [true, 'Phone number is required'],
      trim: true
    },
    addressLine1: { 
      type: String, 
      required: [true, 'Address line 1 is required'],
      trim: true
    },
    addressLine2: { 
      type: String,
      trim: true
    },
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true
    },
    state: { 
      type: String, 
      required: [true, 'State is required'],
      trim: true
    },
    postalCode: { 
      type: String, 
      required: [true, 'Postal code is required'],
      trim: true
    },
    country: { 
      type: String, 
      default: 'India',
      trim: true
    }
  },
  
  billingAddress: {
    fullName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  
  // Order Status
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      message: 'Invalid order status'
    },
    default: 'pending'
  },
  
  // Payment
// Add/update the payment section in your Order schema
payment: {
  method: {
    type: String,
    enum: ['cod', 'razorpay', 'stripe'],
    default: 'cod'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  transactionId: String,
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date,
  refundAmount: { type: Number, default: 0 }
},

  
  // Shipping
  shipping: {
    method: {
      type: String,
      enum: {
        values: ['standard', 'express', 'overnight'],
        message: 'Invalid shipping method'
      },
      default: 'standard'
    },
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  
  // Applied Discounts
// In your Order model, update the appliedCoupon schema:
appliedCoupon: {
  code: {
    type: String,
    uppercase: true
  },
  name: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'shipping'] // Add 'shipping' here
  },
  discount: Number,
  savings: Number,
  appliedAt: { type: Date, default: Date.now }
},

  
  // Order Timeline
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    message: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Additional Info
  notes: { type: String, trim: true },
  cancellationReason: { type: String, trim: true },
  refundAmount: { type: Number, default: 0, min: 0 },
  
  // Dates
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation for items array
orderSchema.path('items').validate(function(items) {
  return items && items.length > 0;
}, 'Order must have at least one item');

// Pre-save middleware for order number generation (FIXED)
orderSchema.pre('save', function(next) {
  console.log('Pre-save middleware triggered. isNew:', this.isNew, 'orderNumber:', this.orderNumber);
  
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `5ELM${timestamp}${random}`;
    console.log('Generated orderNumber:', this.orderNumber);
  }
  next();
});

// Pre-save middleware for status timeline
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      message: `Order ${this.status}`,
      timestamp: new Date()
    });
    
    // Set status dates
    switch (this.status) {
      case 'confirmed':
        this.confirmedAt = new Date();
        break;
      case 'shipped':
        this.shippedAt = new Date();
        break;
      case 'delivered':
        this.deliveredAt = new Date();
        break;
      case 'cancelled':
        this.cancelledAt = new Date();
        break;
    }
  }
  next();
});

// Virtual for days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });



module.exports = mongoose.model('Order', orderSchema);
