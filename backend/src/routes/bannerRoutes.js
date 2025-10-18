const express = require('express');
const router = express.Router();
const {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  trackBannerClick,
  trackBannerImpression,
  getTopBarBanner
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/active', getActiveBanners);
router.get('/top-bar', getTopBarBanner);
router.post('/:id/click', trackBannerClick);
router.post('/:id/impression', trackBannerImpression);

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getAllBanners)
  .post(createBanner);

router.route('/:id')
  .get(getBannerById)
  .put(updateBanner)
  .delete(deleteBanner);

router.patch('/:id/toggle', toggleBannerStatus);

module.exports = router;
