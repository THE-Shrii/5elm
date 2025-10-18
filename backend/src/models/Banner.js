const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtitle cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    public_id: String,
    url: {
      type: String,
      required: function() {
        return this.type !== 'top-bar' && this.type !== 'announcement';
      }
    }
  },
  type: {
    type: String,
    enum: ['hero', 'promotional', 'announcement', 'seasonal', 'top-bar'],
    default: 'promotional'
  },
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom', 'sidebar', 'top-bar'],
    default: 'top'
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true,
    maxlength: [50, 'Button text cannot exceed 50 characters']
  },
  // For announcement/top-bar banners
  announcementItems: [{
    icon: {
      type: String,
      enum: ['Star', 'Phone', 'Mail', 'Truck', 'Shield', 'Heart', 'Gift', 'Clock', 'Award', 'CheckCircle', 'Users'],
      default: 'Star'
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    link: {
      type: String,
      trim: true
    }
  }],
  animationType: {
    type: String,
    enum: ['scroll', 'fade', 'slide', 'bounce', 'none'],
    default: 'scroll'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new-customers', 'returning-customers', 'vip'],
    default: 'all'
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  displayPages: [{
    type: String,
    enum: ['home', 'products', 'categories', 'cart', 'all'],
    default: 'all'
  }],
  clickCount: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
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

// Virtual for CTR calculation
bannerSchema.virtual('ctr').get(function() {
  return this.impressions > 0 ? ((this.clickCount / this.impressions) * 100).toFixed(2) : 0;
});

// Index for efficient queries
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
bannerSchema.index({ position: 1, priority: -1 });
bannerSchema.index({ displayPages: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
