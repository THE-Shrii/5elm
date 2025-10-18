const express = require('express');
const {
  uploadProductImages,
  uploadUserAvatar,
  uploadReviewImages,
  getMyUploads,
  deleteUpload,
  getAllUploads
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');
const { 
  uploadProductImages: productMulter,
  uploadUserAvatar: avatarMulter,
  uploadReviewImages: reviewMulter
} = require('../config/cloudinary');

const router = express.Router();

// Protected routes
router.use(protect);

// User uploads
router.post('/avatar', avatarMulter.single('avatar'), uploadUserAvatar);
router.post('/reviews/:reviewId', 
  validateObjectId('reviewId'), 
  handleValidationErrors,
  reviewMulter.array('images', 5), 
  uploadReviewImages
);
router.get('/my-uploads', getMyUploads);
router.delete('/:id', validateObjectId('id'), handleValidationErrors, deleteUpload);

// Admin routes
router.use(authorize('admin'));
router.post('/products/:productId',
  validateObjectId('productId'),
  handleValidationErrors,
  productMulter.array('images', 10),
  uploadProductImages
);
router.get('/', getAllUploads);

module.exports = router;
