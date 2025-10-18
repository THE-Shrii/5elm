const mongoose = require('mongoose');

const websiteContentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: [
      'hero_banner',
      'featured_products',
      'about_section',
      'testimonials',
      'newsletter',
      'footer',
      'navigation',
      'announcement_bar',
      'beauty_journey'
    ]
  },
  key: {
    type: String,
    required: true
  },
  content: {
    title: String,
    subtitle: String,
    description: String,
    buttonText: String,
    buttonLink: String,
    image: String,
    images: [String],
    stats: [{
      label: String,
      value: String,
      icon: String
    }],
    items: [{
      title: String,
      description: String,
      image: String,
      link: String,
      price: Number,
      originalPrice: Number,
      isActive: Boolean
    }],
    socialMedia: {
      handle: String,
      followers: String,
      engagement: String,
      description: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create compound index for section and key
websiteContentSchema.index({ section: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('WebsiteContent', websiteContentSchema);
