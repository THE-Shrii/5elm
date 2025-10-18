const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // Basic Coupon Information
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain letters and numbers']
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true,
    maxlength: [100, 'Coupon name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Discount Configuration
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'shipping'],
    required: [true, 'Coupon type is required']
  },
  value: {
    type: Number,
    required: [true, 'Coupon value is required'],
    min: [0, 'Coupon value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },

  // Usage Restrictions
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  maximumOrderValue: {
    type: Number,
    min: [0, 'Maximum order value cannot be negative']
  },

  // Usage Limits
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
    min: [1, 'Usage limit must be at least 1']
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
    min: [1, 'Usage limit per user must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },

  // Time Restrictions
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },

  // Product/Category Restrictions
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // User Restrictions
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  excludedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  newUsersOnly: {
    type: Boolean,
    default: false
  },

  // BOGO Configuration (for Buy One Get One offers)
  bogoConfig: {
    buyQuantity: {
      type: Number,
      min: [1, 'Buy quantity must be at least 1']
    },
    getQuantity: {
      type: Number,
      min: [1, 'Get quantity must be at least 1']
    },
    getDiscount: {
      type: Number,
      min: [0, 'Get discount cannot be negative'],
      max: [100, 'Get discount cannot exceed 100%']
    }
  },

  // Status and Control
  isActive: {
    type: Boolean,
    default: true
  },
  isAutoApply: {
    type: Boolean,
    default: false
  },

  // Analytics
  analytics: {
    totalUses: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    totalOrderValue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },

  // Admin Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ createdAt: -1 });

// Virtual for checking if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit === null) return 'Unlimited';
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Virtual for usage percentage
couponSchema.virtual('usagePercentage').get(function() {
  if (this.usageLimit === null) return 0;
  return (this.usedCount / this.usageLimit) * 100;
});

// Pre-save validation
couponSchema.pre('save', function(next) {
  // Validate date range
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  // Validate BOGO configuration
  if (this.type === 'bogo' && !this.bogoConfig.buyQuantity) {
    return next(new Error('BOGO coupons must have buy quantity specified'));
  }

  // Validate percentage discounts
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  // Update analytics averages
  if (this.analytics.totalUses > 0) {
    this.analytics.averageOrderValue = this.analytics.totalOrderValue / this.analytics.totalUses;
  }

  next();
});

// Static method to find valid coupons for a user and cart
couponSchema.statics.findValidCoupons = async function(userId, cartTotal, productIds = []) {
  const now = new Date();
  
  // Return the query object (don't await here - let the controller chain methods)
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ],
    minimumOrderValue: { $lte: cartTotal },
    $or: [
      { maximumOrderValue: { $exists: false } },
      { maximumOrderValue: null },
      { maximumOrderValue: { $gte: cartTotal } }
    ],
    $and: [
      {
        $or: [
          { applicableUsers: { $size: 0 } },
          { applicableUsers: userId }
        ]
      },
      { excludedUsers: { $ne: userId } }
    ]
  });
};

module.exports = mongoose.model('Coupon', couponSchema);
