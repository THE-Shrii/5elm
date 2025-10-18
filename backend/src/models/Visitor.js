const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  
  // Landing page specific fields
  source: {
    type: String,
    enum: ['landing_page', 'social_media', 'referral', 'other'],
    default: 'landing_page'
  },
  interests: [{
    type: String,
    trim: true
  }],
  
  // Coupon information
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponSent: {
    type: Boolean,
    default: false
  },
  couponSentAt: {
    type: Date
  },
  
  // Email tracking
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  welcomeEmailSentAt: {
    type: Date
  },
  emailOpens: {
    type: Number,
    default: 0
  },
  lastEmailOpenedAt: {
    type: Date
  },
  
  // Status and preferences
  isSubscribed: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active'
  },
  
  // Additional metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referralSource: {
    type: String,
    trim: true
  },
  
  // Notes for admin
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
visitorSchema.index({ email: 1 });
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ couponSent: 1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ source: 1 });

// Virtual for subscription status
visitorSchema.virtual('isActiveSubscriber').get(function() {
  return this.isSubscribed && this.status === 'active';
});

// Pre-save middleware to validate email uniqueness
visitorSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const existingVisitor = await this.constructor.findOne({ email: this.email });
    if (existingVisitor && !existingVisitor._id.equals(this._id)) {
      throw new Error('Email already registered');
    }
  }
  next();
});

module.exports = mongoose.model('Visitor', visitorSchema);