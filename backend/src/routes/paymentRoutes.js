const express = require('express');
const {
  createPaymentOrder,     // ✅ Make sure this matches your controller
  verifyPayment,          // ✅ Make sure this matches your controller
  handlePaymentFailure,   // ✅ Make sure this matches your controller
  getMyPayments,          // ✅ Make sure this matches your controller
  processRefund,          // ✅ Make sure this matches your controller
  getPaymentAnalytics     // ✅ Make sure this matches your controller
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Protected routes
router.use(protect);

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     summary: Create a payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID for which payment is being created
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 default: "INR"
 *                 description: Payment currency
 *               paymentMethod:
 *                 type: string
 *                 enum: [razorpay, stripe]
 *                 description: Payment gateway to use
 *             required:
 *               - orderId
 *               - amount
 *               - paymentMethod
 *           example:
 *             orderId: "507f1f77bcf86cd799439011"
 *             amount: 299.99
 *             currency: "INR"
 *             paymentMethod: "razorpay"
 *     responses:
 *       200:
 *         description: Payment order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment order created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentOrderId:
 *                       type: string
 *                       example: "order_MNqJdvlnyEOtnw"
 *                     amount:
 *                       type: number
 *                       example: 29999
 *                     currency:
 *                       type: string
 *                       example: "INR"
 *                     key:
 *                       type: string
 *                       example: "rzp_test_1234567890"
 *       400:
 *         description: Validation error or invalid order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Order not found or already paid"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// User payment routes
router.post('/create-order', createPaymentOrder);        // Line ~19 - Check this function exists

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify payment after successful transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 description: Razorpay order ID
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Razorpay payment ID
 *               razorpay_signature:
 *                 type: string
 *                 description: Razorpay signature for verification
 *               orderId:
 *                 type: string
 *                 description: Internal order ID
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *               - orderId
 *           example:
 *             razorpay_order_id: "order_MNqJdvlnyEOtnw"
 *             razorpay_payment_id: "pay_MNqJdvlnyEOtnx"
 *             razorpay_signature: "signature_hash_here"
 *             orderId: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     orderId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     status:
 *                       type: string
 *                       example: "completed"
 *       400:
 *         description: Payment verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Payment verification failed"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify', verifyPayment);

/**
 * @swagger
 * /payments/failure:
 *   post:
 *     summary: Handle payment failure
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID for failed payment
 *               paymentId:
 *                 type: string
 *                 description: Payment ID (if available)
 *               error:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     description: Error code from payment gateway
 *                   description:
 *                     type: string
 *                     description: Error description
 *             required:
 *               - orderId
 *           example:
 *             orderId: "507f1f77bcf86cd799439011"
 *             paymentId: "pay_MNqJdvlnyEOtnx"
 *             error:
 *               code: "PAYMENT_FAILED"
 *               description: "Payment was declined by the bank"
 *     responses:
 *       200:
 *         description: Payment failure handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment failure recorded"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     status:
 *                       type: string
 *                       example: "failed"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/failure', handlePaymentFailure);

/**
 * @swagger
 * /payments/my-payments:
 *   get:
 *     summary: Get user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of payments per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter payments by status
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment history retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439012"
 *                       orderId:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       amount:
 *                         type: number
 *                         example: 299.99
 *                       currency:
 *                         type: string
 *                         example: "INR"
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       paymentMethod:
 *                         type: string
 *                         example: "razorpay"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-12-01T10:30:00Z"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-payments', getMyPayments);

// Admin routes
router.use(authorize('admin'));

/**
 * @swagger
 * /payments/{paymentId}/refund:
 *   post:
 *     summary: Process payment refund (Admin only)
 *     tags: [Payments]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to refund
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Refund amount (optional, defaults to full amount)
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *             required:
 *               - reason
 *           example:
 *             amount: 150.00
 *             reason: "Product defective"
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Refund processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     refundId:
 *                       type: string
 *                       example: "rfnd_MNqJdvlnyEOtnw"
 *                     amount:
 *                       type: number
 *                       example: 150.00
 *                     status:
 *                       type: string
 *                       example: "processed"
 *       400:
 *         description: Invalid payment ID or refund not possible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Payment cannot be refunded"
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Payment not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:paymentId/refund', validateObjectId('paymentId'), handleValidationErrors, processRefund);

/**
 * @swagger
 * /payments/analytics:
 *   get:
 *     summary: Get payment analytics (Admin only)
 *     tags: [Payments]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2023-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2023-12-31"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Group analytics by time period
 *     responses:
 *       200:
 *         description: Payment analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 125999.99
 *                     totalTransactions:
 *                       type: integer
 *                       example: 1250
 *                     averageTransactionValue:
 *                       type: number
 *                       example: 100.80
 *                     paymentMethodBreakdown:
 *                       type: object
 *                       properties:
 *                         razorpay:
 *                           type: number
 *                           example: 85000.00
 *                         stripe:
 *                           type: number
 *                           example: 30000.00
 *                         cod:
 *                           type: number
 *                           example: 10999.99
 *                     statusBreakdown:
 *                       type: object
 *                       properties:
 *                         completed:
 *                           type: integer
 *                           example: 1180
 *                         pending:
 *                           type: integer
 *                           example: 25
 *                         failed:
 *                           type: integer
 *                           example: 35
 *                         refunded:
 *                           type: integer
 *                           example: 10
 *                     timeSeriesData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2023-12"
 *                           revenue:
 *                             type: number
 *                             example: 15999.99
 *                           transactions:
 *                             type: integer
 *                             example: 150
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics', getPaymentAnalytics);

module.exports = router;
