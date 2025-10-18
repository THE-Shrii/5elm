const express = require('express');
const {
  getDashboardAnalytics,
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  updateProduct,
  deleteProduct,
  updateUserStatus
} = require('../controllers/adminController');
const {
  getComprehensiveDashboard,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/enhancedAdminController');
const {
  getComprehensiveAnalytics,
  getRealtimeStats
} = require('../controllers/analyticsController');
const {
  getAllContent,
  createOrUpdateContent,
  deleteContent,
  getSocialMediaProfiles,
  createSocialMediaProfile,
  updateSocialMediaProfile,
  addSocialMediaPost,
  getFeaturedProducts,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  reorderFeaturedProducts,
  getProductsList
} = require('../controllers/contentController');
const { enhancedAdminAuth } = require('../middleware/enhancedAdminAuth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All admin routes require enhanced admin authentication
router.use(enhancedAdminAuth);

/**
 * @swagger
 * /admin/dashboard-analytics:
 *   get:
 *     summary: Get comprehensive dashboard analytics (Admin only)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
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
 *                   example: "Dashboard analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 125999.99
 *                     totalOrders:
 *                       type: integer
 *                       example: 1250
 *                     totalUsers:
 *                       type: integer
 *                       example: 5420
 *                     totalProducts:
 *                       type: integer
 *                       example: 342
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             $ref: '#/components/schemas/Product'
 *                           salesCount:
 *                             type: integer
 *                             example: 45
 *                     salesTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2023-12-01"
 *                           revenue:
 *                             type: number
 *                             example: 2599.99
 *                           orders:
 *                             type: integer
 *                             example: 25
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
// Enhanced dashboard analytics
router.get('/dashboard-analytics', getComprehensiveDashboard);

/**
 * @swagger
 * /admin/analytics/comprehensive:
 *   get:
 *     summary: Get comprehensive analytics (Admin only)
 *     tags: [Admin - Analytics]
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
 *         description: Comprehensive analytics retrieved successfully
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
 *                   example: "Comprehensive analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 125999.99
 *                         growth:
 *                           type: number
 *                           example: 15.5
 *                         timeSeries:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               period:
 *                                 type: string
 *                                 example: "2023-12"
 *                               value:
 *                                 type: number
 *                                 example: 15999.99
 *                     orders:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1250
 *                         growth:
 *                           type: number
 *                           example: 8.2
 *                         statusBreakdown:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: integer
 *                               example: 25
 *                             processing:
 *                               type: integer
 *                               example: 45
 *                             shipped:
 *                               type: integer
 *                               example: 180
 *                             delivered:
 *                               type: integer
 *                               example: 980
 *                             cancelled:
 *                               type: integer
 *                               example: 20
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5420
 *                         newUsers:
 *                           type: integer
 *                           example: 342
 *                         activeUsers:
 *                           type: integer
 *                           example: 1250
 *                     products:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 342
 *                         topSelling:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               product:
 *                                 $ref: '#/components/schemas/Product'
 *                               salesCount:
 *                                 type: integer
 *                                 example: 45
 *                               revenue:
 *                                 type: number
 *                                 example: 2999.99
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
router.get('/analytics/comprehensive', getComprehensiveAnalytics);

/**
 * @swagger
 * /admin/analytics/realtime:
 *   get:
 *     summary: Get real-time statistics (Admin only)
 *     tags: [Admin - Analytics]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Real-time statistics retrieved successfully
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
 *                   example: "Real-time statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeUsers:
 *                       type: integer
 *                       example: 125
 *                     onlineVisitors:
 *                       type: integer
 *                       example: 45
 *                     todayOrders:
 *                       type: integer
 *                       example: 23
 *                     todayRevenue:
 *                       type: number
 *                       example: 2599.99
 *                     pendingOrders:
 *                       type: integer
 *                       example: 8
 *                     lowStockProducts:
 *                       type: integer
 *                       example: 12
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "order"
 *                           message:
 *                             type: string
 *                             example: "New order #1234 received"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-12-01T10:30:00Z"
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
router.get('/analytics/realtime', getRealtimeStats);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get basic dashboard analytics (Admin only)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Basic dashboard analytics retrieved successfully
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
 *                   example: "Dashboard analytics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 125999.99
 *                     totalOrders:
 *                       type: integer
 *                       example: 1250
 *                     totalUsers:
 *                       type: integer
 *                       example: 5420
 *                     totalProducts:
 *                       type: integer
 *                       example: 342
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
router.get('/dashboard', getDashboardAnalytics);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - adminAuth: []
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
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter users by status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     tags: [Admin - Users]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: New user status
 *               reason:
 *                 type: string
 *                 description: Reason for status change (required for suspension)
 *             required:
 *               - status
 *           example:
 *             status: "suspended"
 *             reason: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: "User status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid status value"
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/users/:id/status', validateObjectId('id'), handleValidationErrors, updateUserStatus);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products for admin management (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - adminAuth: []
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
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, out_of_stock]
 *         description: Filter products by status
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get('/products', getAllProducts);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *               category:
 *                 type: string
 *                 description: Product category
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Stock quantity
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Product image URLs
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Product status
 *           example:
 *             name: "Updated Premium Headphones"
 *             description: "High-quality wireless headphones with noise cancellation"
 *             price: 349.99
 *             category: "Electronics"
 *             stock: 50
 *             images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *             status: "active"
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid product ID or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Price must be a positive number"
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Product not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/products/:id', validateObjectId('id'), handleValidationErrors, updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: "Product deleted successfully"
 *       400:
 *         description: Invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid product ID format"
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Product not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/products/:id', validateObjectId('id'), handleValidationErrors, deleteProduct);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin - Orders]
 *     security:
 *       - adminAuth: []
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
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search orders by order ID or customer name
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders until this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                   example: "Orders retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
router.get('/orders', getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Admin - Orders]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: New order status
 *               trackingNumber:
 *                 type: string
 *                 description: Tracking number (required when status is 'shipped')
 *               notes:
 *                 type: string
 *                 description: Additional notes about the status change
 *             required:
 *               - status
 *           example:
 *             status: "shipped"
 *             trackingNumber: "TRK123456789"
 *             notes: "Package shipped via FedEx"
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                   example: "Order status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Tracking number is required when status is shipped"
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Order not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/orders/:id/status', validateObjectId('id'), handleValidationErrors, updateOrderStatus);

/**
 * @swagger
 * /admin/banners:
 *   get:
 *     summary: Get all banners (Admin only)
 *     tags: [Admin - Banner Management]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
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
 *                   example: "Banners retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *                       title:
 *                         type: string
 *                         example: "Summer Sale"
 *                       description:
 *                         type: string
 *                         example: "Up to 50% off on summer collection"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://example.com/banner.jpg"
 *                       linkUrl:
 *                         type: string
 *                         example: "/products/summer-collection"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       position:
 *                         type: integer
 *                         example: 1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
 *   post:
 *     summary: Create a new banner (Admin only)
 *     tags: [Admin - Banner Management]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Winter Sale"
 *               description:
 *                 type: string
 *                 example: "Exclusive winter collection with up to 60% off"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/winter-banner.jpg"
 *               linkUrl:
 *                 type: string
 *                 example: "/products/winter-collection"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               position:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/banners', getAllBanners);
router.post('/banners', createBanner);

/**
 * @swagger
 * /admin/banners/{id}:
 *   put:
 *     summary: Update a banner (Admin only)
 *     tags: [Admin - Banner Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Winter Sale"
 *               description:
 *                 type: string
 *                 example: "Updated description for winter collection"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/updated-banner.jpg"
 *               linkUrl:
 *                 type: string
 *                 example: "/products/updated-winter-collection"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               position:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data or banner ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Banner not found
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
 *   delete:
 *     summary: Delete a banner (Admin only)
 *     tags: [Admin - Banner Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid banner ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Banner not found
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
router.put('/banners/:id', validateObjectId('id'), handleValidationErrors, updateBanner);
router.delete('/banners/:id', validateObjectId('id'), handleValidationErrors, deleteBanner);

/**
 * @swagger
 * /admin/offers:
 *   get:
 *     summary: Get all offers (Admin only)
 *     tags: [Admin - Offer Management]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
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
 *                   example: "Offers retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *                       title:
 *                         type: string
 *                         example: "Black Friday Deal"
 *                       description:
 *                         type: string
 *                         example: "Massive discounts on all categories"
 *                       discountType:
 *                         type: string
 *                         enum: [percentage, fixed]
 *                         example: "percentage"
 *                       discountValue:
 *                         type: number
 *                         example: 25
 *                       minOrderAmount:
 *                         type: number
 *                         example: 100
 *                       maxDiscountAmount:
 *                         type: number
 *                         example: 500
 *                       validFrom:
 *                         type: string
 *                         format: date-time
 *                       validUntil:
 *                         type: string
 *                         format: date-time
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       usageLimit:
 *                         type: integer
 *                         example: 1000
 *                       usedCount:
 *                         type: integer
 *                         example: 245
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
 *   post:
 *     summary: Create a new offer (Admin only)
 *     tags: [Admin - Offer Management]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - discountType
 *               - discountValue
 *               - validFrom
 *               - validUntil
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Year Special"
 *               description:
 *                 type: string
 *                 example: "Start the year with amazing deals"
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: "percentage"
 *               discountValue:
 *                 type: number
 *                 example: 30
 *               minOrderAmount:
 *                 type: number
 *                 example: 150
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 300
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-31T23:59:59Z"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               usageLimit:
 *                 type: integer
 *                 example: 500
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/offers', getAllOffers);
router.post('/offers', createOffer);

/**
 * @swagger
 * /admin/offers/{id}:
 *   put:
 *     summary: Update an offer (Admin only)
 *     tags: [Admin - Offer Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated New Year Special"
 *               description:
 *                 type: string
 *                 example: "Extended new year deals"
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: "fixed"
 *               discountValue:
 *                 type: number
 *                 example: 50
 *               minOrderAmount:
 *                 type: number
 *                 example: 200
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 400
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               usageLimit:
 *                 type: integer
 *                 example: 750
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data or offer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Offer not found
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
 *   delete:
 *     summary: Delete an offer (Admin only)
 *     tags: [Admin - Offer Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid offer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Offer not found
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
router.put('/offers/:id', validateObjectId('id'), handleValidationErrors, updateOffer);
router.delete('/offers/:id', validateObjectId('id'), handleValidationErrors, deleteOffer);

/**
 * @swagger
 * /admin/content:
 *   get:
 *     summary: Get all content (Admin only)
 *     tags: [Admin - Content Management]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Content retrieved successfully
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
 *                   example: "Content retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *                       type:
 *                         type: string
 *                         enum: [page, section, widget]
 *                         example: "page"
 *                       title:
 *                         type: string
 *                         example: "About Us"
 *                       slug:
 *                         type: string
 *                         example: "about-us"
 *                       content:
 *                         type: string
 *                         example: "Our company story and mission..."
 *                       metaTitle:
 *                         type: string
 *                         example: "About Our Company"
 *                       metaDescription:
 *                         type: string
 *                         example: "Learn about our company's history and values"
 *                       isPublished:
 *                         type: boolean
 *                         example: true
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
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
 *   post:
 *     summary: Create or update content (Admin only)
 *     tags: [Admin - Content Management]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [page, section, widget]
 *                 example: "page"
 *               title:
 *                 type: string
 *                 example: "Privacy Policy"
 *               slug:
 *                 type: string
 *                 example: "privacy-policy"
 *               content:
 *                 type: string
 *                 example: "Our privacy policy details..."
 *               metaTitle:
 *                 type: string
 *                 example: "Privacy Policy - Our Store"
 *               metaDescription:
 *                 type: string
 *                 example: "Read our comprehensive privacy policy"
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Content created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/content', getAllContent);
router.post('/content', createOrUpdateContent);

/**
 * @swagger
 * /admin/content/{id}:
 *   delete:
 *     summary: Delete content (Admin only)
 *     tags: [Admin - Content Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid content ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
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
router.delete('/content/:id', validateObjectId('id'), handleValidationErrors, deleteContent);

/**
 * @swagger
 * /admin/social-media:
 *   get:
 *     summary: Get all social media profiles (Admin only)
 *     tags: [Admin - Social Media Management]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Social media profiles retrieved successfully
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
 *                   example: "Social media profiles retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *                       platform:
 *                         type: string
 *                         enum: [facebook, instagram, twitter, linkedin, youtube]
 *                         example: "instagram"
 *                       username:
 *                         type: string
 *                         example: "ourstore_official"
 *                       profileUrl:
 *                         type: string
 *                         example: "https://instagram.com/ourstore_official"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       followerCount:
 *                         type: integer
 *                         example: 15420
 *                       posts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             content:
 *                               type: string
 *                               example: "Check out our new collection!"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://example.com/post-image.jpg"
 *                             postUrl:
 *                               type: string
 *                               example: "https://instagram.com/p/ABC123"
 *                             postedAt:
 *                               type: string
 *                               format: date-time
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
 *   post:
 *     summary: Create a social media profile (Admin only)
 *     tags: [Admin - Social Media Management]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - username
 *               - profileUrl
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [facebook, instagram, twitter, linkedin, youtube]
 *                 example: "twitter"
 *               username:
 *                 type: string
 *                 example: "ourstore_tweets"
 *               profileUrl:
 *                 type: string
 *                 example: "https://twitter.com/ourstore_tweets"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               followerCount:
 *                 type: integer
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Social media profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/social-media', getSocialMediaProfiles);
router.post('/social-media', createSocialMediaProfile);

/**
 * @swagger
 * /admin/social-media/{id}:
 *   put:
 *     summary: Update a social media profile (Admin only)
 *     tags: [Admin - Social Media Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Social media profile ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [facebook, instagram, twitter, linkedin, youtube]
 *                 example: "facebook"
 *               username:
 *                 type: string
 *                 example: "ourstore.official"
 *               profileUrl:
 *                 type: string
 *                 example: "https://facebook.com/ourstore.official"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               followerCount:
 *                 type: integer
 *                 example: 25000
 *     responses:
 *       200:
 *         description: Social media profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data or profile ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Social media profile not found
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
router.put('/social-media/:id', validateObjectId('id'), handleValidationErrors, updateSocialMediaProfile);

/**
 * @swagger
 * /admin/social-media/{id}/posts:
 *   post:
 *     summary: Add a post to social media profile (Admin only)
 *     tags: [Admin - Social Media Management]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Social media profile ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Exciting new product launch coming soon! Stay tuned!"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/launch-teaser.jpg"
 *               postUrl:
 *                 type: string
 *                 example: "https://instagram.com/p/XYZ789"
 *     responses:
 *       201:
 *         description: Post added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data or profile ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Social media profile not found
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
router.post('/social-media/:id/posts', validateObjectId('id'), handleValidationErrors, addSocialMediaPost);

/**
 * @swagger
 * /admin/featured-products:
 *   get:
 *     summary: Get all featured products (Admin only)
 *     tags: [Admin - Featured Products]
 *     security:
 *       - adminAuth: []
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
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
 *                   example: "Featured products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       position:
 *                         type: integer
 *                         example: 1
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       featuredFrom:
 *                         type: string
 *                         format: date-time
 *                       featuredUntil:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 *   post:
 *     summary: Create a featured product (Admin only)
 *     tags: [Admin - Featured Products]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *               position:
 *                 type: integer
 *                 example: 2
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               featuredFrom:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 *               featuredUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Featured product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/featured-products', getFeaturedProducts);
router.post('/featured-products', createFeaturedProduct);

/**
 * @swagger
 * /admin/featured-products/{id}:
 *   put:
 *     summary: Update a featured product (Admin only)
 *     tags: [Admin - Featured Products]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Featured product ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *               position:
 *                 type: integer
 *                 example: 3
 *               isActive:
 *                 type: boolean
 *                 example: false
 *               featuredFrom:
 *                 type: string
 *                 format: date-time
 *               featuredUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Featured product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data or featured product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Featured product not found
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
 *   delete:
 *     summary: Delete a featured product (Admin only)
 *     tags: [Admin - Featured Products]
 *     security:
 *       - adminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Featured product ID
 *         example: "64a7b8c9d1e2f3a4b5c6d7e8"
 *     responses:
 *       200:
 *         description: Featured product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid featured product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Featured product not found
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
router.put('/featured-products/:id', validateObjectId('id'), handleValidationErrors, updateFeaturedProduct);
router.delete('/featured-products/:id', validateObjectId('id'), handleValidationErrors, deleteFeaturedProduct);

/**
 * @swagger
 * /admin/featured-products/reorder:
 *   put:
 *     summary: Reorder featured products (Admin only)
 *     tags: [Admin - Featured Products]
 *     security:
 *       - adminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featuredProductIds
 *             properties:
 *               featuredProductIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a7b8c9d1e2f3a4b5c6d7e8", "64a7b8c9d1e2f3a4b5c6d7e9", "64a7b8c9d1e2f3a4b5c6d7f0"]
 *                 description: Array of featured product IDs in the desired order
 *     responses:
 *       200:
 *         description: Featured products reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.put('/featured-products/reorder', reorderFeaturedProducts);

/**
 * @swagger
 * /admin/products-list:
 *   get:
 *     summary: Get products list for admin management (Admin only)
 *     tags: [Admin - Product Management]
 *     security:
 *       - adminAuth: []
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
 *           default: 20
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, out_of_stock]
 *         description: Filter by product status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt, stock]
 *           default: createdAt
 *         description: Sort products by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Products list retrieved successfully
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
 *                   example: "Products list retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.get('/products-list', getProductsList);

module.exports = router;
