const express = require('express');
const {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  voteOnReview,
  reportReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validateReview, validateObjectId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/product/:productId', validateObjectId('productId'), handleValidationErrors, getProductReviews);

// Protected routes
router.use(protect);

router.post('/', validateReview, handleValidationErrors, createReview);
router.get('/my-reviews', getMyReviews);
router.put('/:id', validateObjectId('id'), handleValidationErrors, updateReview);
router.delete('/:id', validateObjectId('id'), handleValidationErrors, deleteReview);
router.post('/:id/vote', validateObjectId('id'), handleValidationErrors, voteOnReview);
router.post('/:id/report', validateObjectId('id'), handleValidationErrors, reportReview);

module.exports = router;
