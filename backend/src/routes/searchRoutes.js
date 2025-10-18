const express = require('express');
const {
  searchProducts,
  getSearchSuggestions,
  getSearchFilters,
  getSearchAnalytics
} = require('../controllers/searchController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public search routes
router.get('/products', searchProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/filters', getSearchFilters);

// Admin search analytics
router.get('/analytics', protect, authorize('admin'), getSearchAnalytics);

module.exports = router;
