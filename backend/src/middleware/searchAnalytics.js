const { logSearch } = require('../config/elasticsearch');

// Middleware to track search queries
const trackSearch = async (req, res, next) => {
  // Store original res.json
  const originalJson = res.json;

  // Override res.json to capture response
  res.json = function(data) {
    // Track the search if it was successful
    if (data.success && req.query.q) {
      const resultCount = data.total || data.count || 0;
      
      // Log search asynchronously (don't block response)
      setImmediate(() => {
        logSearch(
          req.query.q,
          resultCount,
          req.user?.id,
          {
            category: req.query.category,
            brand: req.query.brand,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            minRating: req.query.minRating,
            tags: req.query.tags,
            sortBy: req.query.sortBy
          }
        ).catch(err => {
          console.log('Search analytics logging failed:', err.message);
        });
      });
    }

    // Call original res.json
    return originalJson.call(this, data);
  };

  next();
};

module.exports = { trackSearch };
