const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Wishlist routes working' });
});

module.exports = router;
