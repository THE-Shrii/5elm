const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Offer name is required'],
    trim: true,
    maxlength: [100, 'Offer name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'bundle', 'shipping'],
    required: [true, 'Offer type is required']
  },
  value: {
    type: Number,
    required: [true, 'Offer value is required'],
    min: [0, 'Offer value cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order value cannot be negative']
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  userGroups: [{
    type: String,
    enum: ['all', 'new', 'returning', 'vip', 'inactive']
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    total: {
      type: Number,
      default: null // null means unlimited
    },
    perUser: {
      type: Number,
      default: 1
    }
  },
  currentUsage: {
    total: {
      type: Number,
      default: 0
    },
    users: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      count: {
        type: Number,
        default: 0
      }
    }]
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stackable: {
    type: Boolean,
    default: false
  },
  autoApply: {
    type: Boolean,
    default: false
  },
  badge: {
    text: String,
    color: {
      type: String,
      default: '#ff4444'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    }
  },
  conditions: {
    dayOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    timeRange: {
      start: String, // HH:MM format
      end: String    // HH:MM format
    },
    deviceType: [{
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    }],
    firstTimeUser: Boolean,
    customerBirthday: Boolean
  },
  analytics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for conversion rate
offerSchema.virtual('conversionRate').get(function() {
  return this.analytics.clicks > 0 ? 
    ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2) : 0;
});

// Virtual for click-through rate
offerSchema.virtual('ctr').get(function() {
  return this.analytics.impressions > 0 ? 
    ((this.analytics.clicks / this.analytics.impressions) * 100).toFixed(2) : 0;
});

// Check if offer is currently active
offerSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit.total === null || this.currentUsage.total < this.usageLimit.total);
});

// Indexes for efficient queries
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ applicableProducts: 1 });
offerSchema.index({ applicableCategories: 1 });
offerSchema.index({ priority: -1 });
offerSchema.index({ autoApply: 1 });

module.exports = mongoose.model('Offer', offerSchema);
