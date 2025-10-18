const { sql, connectSQLServer } = require('../config/sqlserver');
const asyncHandler = require('../middleware/asyncHandler');

// @desc Redeem a landing page coupon
// @route POST /api/v1/coupons/redeem
// @access Public
const redeemLandingCoupon = asyncHandler(async (req, res) => {
  const { email, couponCode, orderTotal } = req.body;

  if (!email || !couponCode || !orderTotal) {
    return res.status(400).json({
      success: false,
      message: 'Email, coupon code, and order total are required.',
    });
  }

  const pool = await connectSQLServer();

  // 1️⃣ Check if coupon exists
  const couponResult = await pool
    .request()
    .input('CouponCode', sql.VarChar, couponCode)
    .query(`SELECT TOP 1 * FROM LandingSubscriptions WHERE CouponCode = @CouponCode`);

  if (couponResult.recordset.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Invalid coupon code.',
    });
  }

  const coupon = couponResult.recordset[0];

  // 2️⃣ Check if the coupon belongs to this email
  if (coupon.Email.toLowerCase() !== email.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: 'This coupon is not associated with your email address.',
    });
  }

  // 3️⃣ Check if already redeemed
  const redemptionCheck = await pool
    .request()
    .input('CouponCode', sql.VarChar, couponCode)
    .input('Email', sql.VarChar, email)
    .query(`
      SELECT TOP 1 * FROM CouponRedemptions 
      WHERE CouponCode = @CouponCode AND Email = @Email
    `);

  if (redemptionCheck.recordset.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'This coupon has already been used.',
    });
  }

  // 4️⃣ Validate minimum order amount (₹500)
  if (parseFloat(orderTotal) < 500) {
    return res.status(400).json({
      success: false,
      message: 'Minimum order amount of ₹500 required to use this coupon.',
    });
  }

  // 5️⃣ Calculate 10% discount (example)
  const discount = parseFloat(orderTotal) * 0.10;
  const newTotal = parseFloat(orderTotal) - discount;

  // 6️⃣ Save redemption record
  await pool
    .request()
    .input('CouponCode', sql.VarChar, couponCode)
    .input('Email', sql.VarChar, email)
    .input('OrderTotal', sql.Decimal(10, 2), orderTotal)
    .input('DiscountApplied', sql.Decimal(10, 2), discount)
    .query(`
      INSERT INTO CouponRedemptions (CouponCode, Email, OrderTotal, DiscountApplied)
      VALUES (@CouponCode, @Email, @OrderTotal, @DiscountApplied)
    `);

  console.log(`✅ Coupon ${couponCode} redeemed by ${email}`);

  return res.status(200).json({
    success: true,
    message: 'Coupon applied successfully!',
    data: {
      email,
      couponCode,
      discount,
      newTotal,
    },
  });
});

module.exports = { redeemLandingCoupon };
