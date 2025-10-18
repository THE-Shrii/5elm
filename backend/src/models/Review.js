const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required for verified reviews']
  },
  
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  
  // Review Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    caption: {
      type: String,
      maxlength: [200, 'Image caption cannot exceed 200 characters']
    }
  }],
  
  // Review Status & Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved' // Auto-approve for now, can change to 'pending'
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  
  // Helpful Voting
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: {
      type: Boolean,
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review Analytics
  analytics: {
    helpfulCount: {
      type: Number,
      default: 0
    },
    unhelpfulCount: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  
  // Purchase Verification
  verified: {
    type: Boolean,
    default: true // Since we require order, all reviews are verified
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  
  // Review Metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  
  // Reporting & Flagging
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'],
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Report description cannot exceed 500 characters']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ 'analytics.helpfulCount': -1 });

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Virtual for helpful score
reviewSchema.virtual('helpfulScore').get(function() {
  const total = this.analytics.helpfulCount + this.analytics.unhelpfulCount;
  if (total === 0) return 0;
  return (this.analytics.helpfulCount / total) * 100;
});

// Virtual for review age
reviewSchema.virtual('daysSinceReview').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update analytics
reviewSchema.pre('save', function(next) {
  if (this.isModified('helpfulVotes')) {
    this.analytics.helpfulCount = this.helpfulVotes.filter(vote => vote.isHelpful).length;
    this.analytics.unhelpfulCount = this.helpfulVotes.filter(vote => !vote.isHelpful).length;
  }
  
  if (this.isModified('reports')) {
    this.analytics.reportCount = this.reports.length;
    
    // Auto-flag if too many reports
    if (this.analytics.reportCount >= 3 && this.status === 'approved') {
      this.status = 'flagged';
    }
  }
  
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
