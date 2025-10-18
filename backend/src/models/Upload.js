const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  // File Information
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true,
    unique: true
  },
  
  // File Details
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  
  // Upload Context
  uploadType: {
    type: String,
    enum: ['product', 'avatar', 'review', 'general'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Associated Records
  associatedWith: {
    model: {
      type: String,
      enum: ['Product', 'User', 'Review']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Image Properties
  dimensions: {
    width: Number,
    height: Number
  },
  
  // URLs for different sizes
  urls: {
    original: String,
    large: String,    // 1200x1200
    medium: String,   // 800x800
    small: String,    // 400x400
    thumbnail: String // 150x150
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isOptimized: {
    type: Boolean,
    default: false
  },
  tags: [String],
  alt: {
    type: String,
    trim: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ uploadType: 1, isActive: 1 });
uploadSchema.index({ 'associatedWith.model': 1, 'associatedWith.id': 1 });
uploadSchema.index({ publicId: 1 });

// Virtual for file size in human readable format
uploadSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to generate URLs for different sizes
uploadSchema.methods.generateUrls = function() {
  const { getOptimizedImageUrl } = require('../config/cloudinary');
  
  this.urls = {
    original: this.path,
    large: getOptimizedImageUrl(this.publicId, { width: 1200, height: 1200 }),
    medium: getOptimizedImageUrl(this.publicId, { width: 800, height: 800 }),
    small: getOptimizedImageUrl(this.publicId, { width: 400, height: 400 }),
    thumbnail: getOptimizedImageUrl(this.publicId, { width: 150, height: 150 })
  };
  
  this.isOptimized = true;
  return this.urls;
};

// Pre-save middleware to generate URLs
uploadSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('publicId')) {
    this.generateUrls();
  }
  next();
});

module.exports = mongoose.model('Upload', uploadSchema);
