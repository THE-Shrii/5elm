const express = require('express');
const {
  getAvailableCoupons,
  applyCoupon,
  removeCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponAnalytics
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Public/User routes
router.use(protect);
router.get('/available', getAvailableCoupons);
router.post('/apply', applyCoupon);
router.delete('/remove', removeCoupon);

// Admin routes
router.use(authorize('admin'));
router.get('/', getAllCoupons);
router.post('/', createCoupon);
router.get('/:id/analytics', validateObjectId('id'), handleValidationErrors, getCouponAnalytics);
router.put('/:id', validateObjectId('id'), handleValidationErrors, updateCoupon);
router.delete('/:id', validateObjectId('id'), handleValidationErrors, deleteCoupon);

module.exports = router;
