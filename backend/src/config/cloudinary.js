const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage for different upload types
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `5elm/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }
  });
};

// Storage configurations for different upload types
const productImageStorage = createCloudinaryStorage('products');
const userAvatarStorage = createCloudinaryStorage('users/avatars', ['jpg', 'jpeg', 'png']);
const reviewImageStorage = createCloudinaryStorage('reviews');

// Multer configurations
const createMulterUpload = (storage, maxFiles = 1) => {
  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: maxFiles
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });
};

// Upload configurations
const uploadProductImages = createMulterUpload(productImageStorage, 10); // Max 10 images per product
const uploadUserAvatar = createMulterUpload(userAvatarStorage, 1);
const uploadReviewImages = createMulterUpload(reviewImageStorage, 5); // Max 5 images per review

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 800,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, quality },
      { fetch_format: format }
    ]
  });
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadUserAvatar,
  uploadReviewImages,
  deleteFromCloudinary,
  getOptimizedImageUrl
};
