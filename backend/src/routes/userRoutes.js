const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes - we'll build these next
router.get('/profile', protect, (req, res) => {
  res.json({ success: true, message: 'User routes working', user: req.user });
});

module.exports = router;
