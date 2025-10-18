const express = require('express');
const { redeemLandingCoupon } = require('../controllers/couponRedeemController');

const router = express.Router();

router.post('/redeem', redeemLandingCoupon);

module.exports = router;
