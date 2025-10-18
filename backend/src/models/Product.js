const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Color", "Size"
  value: { type: String, required: true }, // e.g., "Red", "Large"
  price: { type: Number, default: 0 }, // Additional price for this variant
  stock: { type: Number, default: 0 },
  sku: { 
    type: String, 
    sparse: true  // This allows multiple null values
  },
  images: [{
    public_id: String,
    url: String,
    alt: String
  }]
});


const specificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  group: String // e.g., "Technical", "Physical", "Features"
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  images: [{
    public_id: String,
    url: { type: String, required: true },
    alt: String,
    isMain: { type: Boolean, default: false }
  }],
  variants: [variantSchema],
  specifications: [specificationSchema],
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    trackQuantity: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 10 },
    reserved: { type: Number, default: 0 } // For pending orders
  },
  shipping: {
    weight: { type: Number, min: 0 }, // in kg
    dimensions: {
      length: { type: Number, min: 0 }, // in cm
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'heavy', 'fragile', 'express'],
      default: 'standard'
    },
    freeShipping: { type: Boolean, default: false },
    processingTime: { type: Number, default: 1 } // days
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Ayurvedic-specific fields for 5ELM
  ayurvedic: {
    ingredients: [{
      name: { type: String, required: true },
      sanskrit: String,
      percentage: String,
      benefits: [String],
      description: String
    }],
    doshas: [{
      type: String,
      enum: ['vata', 'pitta', 'kapha'],
      lowercase: true
    }],
    skinTypes: [{
      type: String,
      enum: ['normal', 'dry', 'oily', 'combination', 'sensitive', 'acne-prone', 'mature', 'all-types'],
      lowercase: true
    }],
    conditions: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    benefits: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    usage: {
      timeOfDay: [{
        type: String,
        enum: ['morning', 'evening', 'night', 'anytime'],
        lowercase: true
      }],
      frequency: String,
      applicationMethod: String
    },
    certifications: [{
      type: String,
      enum: ['organic', 'vegan', 'cruelty-free', 'ayurvedic-certified', 'gmp-certified', 'iso-certified'],
      lowercase: true
    }]
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  isFeatured: { type: Boolean, default: false },
  isDigital: { type: Boolean, default: false },
  
  // Reviews and Ratings
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: String,
    images: [{ public_id: String, url: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  
  // Sales Analytics
  analytics: {
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    lastViewed: Date,
    trending: { type: Boolean, default: false }
  },
  
  // Vendor Info (for marketplace)
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  publishedAt: Date,
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
  
  // Auto-generate SKU if not provided
  if (!this.sku && this.isNew) {
    this.sku = '5ELM-' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  
  this.lastModified = new Date();
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  const approvedReviews = this.reviews.filter(review => review.status === 'approved');
  
  if (approvedReviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    this.ratings.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    return;
  }

  const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = Math.round((total / approvedReviews.length) * 10) / 10;
  this.ratings.count = approvedReviews.length;

  // Update distribution
  this.ratings.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  approvedReviews.forEach(review => {
    this.ratings.distribution[review.rating]++;
  });
};

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         this.visibility === 'public' && 
         (this.inventory.stock > 0 || this.inventory.allowBackorder);
});

// Virtual for low stock warning
productSchema.virtual('isLowStock').get(function() {
  return this.inventory.trackQuantity && 
         this.inventory.stock <= this.inventory.lowStockThreshold && 
         this.inventory.stock > 0;
});

// Virtual for out of stock
productSchema.virtual('isOutOfStock').get(function() {
  return this.inventory.trackQuantity && 
         this.inventory.stock <= 0 && 
         !this.inventory.allowBackorder;
});

// Indexes for better performance
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  'ayurvedic.ingredients.name': 'text',
  'ayurvedic.conditions': 'text',
  'ayurvedic.benefits': 'text',
  brand: 'text'
});
productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ 'analytics.views': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ status: 1, visibility: 1 });
// Ayurvedic-specific indexes
productSchema.index({ 'ayurvedic.doshas': 1 });
productSchema.index({ 'ayurvedic.skinTypes': 1 });
productSchema.index({ 'ayurvedic.conditions': 1 });
productSchema.index({ 'ayurvedic.certifications': 1 });

module.exports = mongoose.model('Product', productSchema);
