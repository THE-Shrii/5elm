const mongoose = require('mongoose');

const featuredProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  section: {
    type: String,
    enum: ['homepage_featured', 'bestsellers', 'new_arrivals', 'trending', 'sale'],
    required: true
  },
  customTitle: {
    type: String // Override product name if needed
  },
  customDescription: {
    type: String // Override product description
  },
  customImage: {
    type: String // Override product image
  },
  customPrice: {
    type: Number // Override product price for promotions
  },
  badge: {
    text: String,
    color: { type: String, default: '#10B981' },
    backgroundColor: { type: String, default: '#ECFDF5' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  displaySettings: {
    showBadge: { type: Boolean, default: false },
    showOriginalPrice: { type: Boolean, default: true },
    showRating: { type: Boolean, default: true },
    showQuickAdd: { type: Boolean, default: true }
  },
  scheduledStart: Date,
  scheduledEnd: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
featuredProductSchema.index({ section: 1, isActive: 1, order: 1 });
featuredProductSchema.index({ scheduledStart: 1, scheduledEnd: 1 });

module.exports = mongoose.model('FeaturedProduct', featuredProductSchema);
