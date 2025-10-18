const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  variant: {
    name: String,
    value: String,
    price: { type: Number, default: 0 }
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totals: {
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.18 }, // 18% GST
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // FIXED: Updated appliedCoupon schema
  appliedCoupon: {
    code: {
      type: String,
      uppercase: true
    },
    name: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo', 'shipping'] // Added 'bogo' and 'shipping'
    },
    discount: Number,
    savings: Number, // Added for actual savings amount
    appliedAt: { type: Date, default: Date.now }
  },
  
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses'
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    default: 'standard'
  },
  estimatedDelivery: Date,
  lastModified: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for items count
cartSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
cartSchema.virtual('uniqueItemsCount').get(function() {
  return this.items.length;
});

// ENHANCED: Method to calculate totals with all coupon types
cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.totals.subtotal = this.items.reduce((total, item) => {
    return total + ((item.price + (item.variant?.price || 0)) * item.quantity);
  }, 0);
  
  // Calculate shipping based on method and subtotal
  this.totals.shipping = this.calculateShipping();
  
  // Calculate tax
  this.totals.tax = Math.round(this.totals.subtotal * this.totals.taxRate * 100) / 100;
  
  // Apply coupon discount - ENHANCED to handle all coupon types
  let discount = 0;
  if (this.appliedCoupon) {
    switch (this.appliedCoupon.type) {
      case 'percentage':
        discount = (this.totals.subtotal * this.appliedCoupon.discount) / 100;
        break;
      case 'fixed':
        discount = Math.min(this.appliedCoupon.discount, this.totals.subtotal);
        break;
      case 'shipping':
        discount = this.totals.shipping; // Free shipping = shipping cost as discount
        break;
      case 'bogo':
        discount = this.appliedCoupon.savings || 0;
        break;
      default:
        discount = this.appliedCoupon.savings || 0;
    }
  }
  
  this.totals.discount = Math.round(discount * 100) / 100;
  
  // Calculate final total
  this.totals.total = this.totals.subtotal + this.totals.tax + this.totals.shipping - this.totals.discount;
  this.totals.total = Math.max(0, Math.round(this.totals.total * 100) / 100);
  
  this.lastModified = new Date();
};

// Method to calculate shipping
cartSchema.methods.calculateShipping = function() {
  const freeShippingThreshold = 2000; // Free shipping above ₹2000
  
  // If shipping coupon is applied, shipping is free
  if (this.appliedCoupon && this.appliedCoupon.type === 'shipping') {
    return 0;
  }
  
  if (this.totals.subtotal >= freeShippingThreshold) {
    return 0;
  }
  
  switch (this.shippingMethod) {
    case 'express':
      return 200;
    case 'overnight':
      return 500;
    case 'standard':
    default:
      return 100;
  }
};

// Method to estimate delivery date
cartSchema.methods.calculateEstimatedDelivery = function() {
  const baseDeliveryDays = {
    standard: 5,
    express: 2,
    overnight: 1
  };
  
  const deliveryDays = baseDeliveryDays[this.shippingMethod] || 5;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
  
  this.estimatedDelivery = estimatedDate;
  return estimatedDate;
};

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.calculateEstimatedDelivery();
  next();
});

// Index for faster queries
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ lastModified: -1 });

module.exports = mongoose.model('Cart', cartSchema);
