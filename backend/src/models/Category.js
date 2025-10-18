const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true // This allows multiple null values
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create slug from name - Fixed version
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    if (this.name) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim(); // Remove leading/trailing spaces
      
      // Remove leading/trailing hyphens
      this.slug = this.slug.replace(/^-+|-+$/g, '');
      
      // If slug is empty after processing, create a default one
      if (!this.slug) {
        this.slug = 'category-' + Date.now();
      }
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
