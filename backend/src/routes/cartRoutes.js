const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                   example: "Cart retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *             example:
 *               success: true
 *               message: "Cart retrieved successfully"
 *               data:
 *                 items:
 *                   - _id: "507f1f77bcf86cd799439013"
 *                     product:
 *                       _id: "507f1f77bcf86cd799439011"
 *                       name: "Premium Wireless Headphones"
 *                       price: 299.99
 *                       images: ["https://example.com/image1.jpg"]
 *                     quantity: 2
 *                     price: 299.99
 *                     totalPrice: 599.98
 *                 totalAmount: 599.98
 *                 totalItems: 2
 *       401:
 *         description: Unauthorized - Invalid or missing token (returns empty cart for guests)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: {}
 *                       example: []
 *                     totalAmount:
 *                       type: number
 *                       example: 0
 *                     totalItems:
 *                       type: number
 *                       example: 0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/v1/cart - Make this accessible for guests
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      // Return empty cart for unauthenticated users
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          totalAmount: 0,
          totalItems: 0
        }
      });
    }

    // If authenticated, verify token and get user cart
    try {
      // Extract token
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const User = require('../models/User');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(200).json({
          success: true,
          data: { items: [], totalAmount: 0, totalItems: 0 }
        });
      }

      // Get user's cart
      req.user = user;
      return getCart(req, res);
      
    } catch (tokenError) {
      // Invalid token, return empty cart
      return res.status(200).json({
        success: true,
        data: { items: [], totalAmount: 0, totalItems: 0 }
      });
    }
    
  } catch (error) {
    console.error('Cart route error:', error);
    res.status(200).json({
      success: true,
      data: { items: [], totalAmount: 0, totalItems: 0 }
    });
  }
});

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to add to cart
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the product
 *               size:
 *                 type: string
 *                 description: Product size (if applicable)
 *               color:
 *                 type: string
 *                 description: Product color (if applicable)
 *             required:
 *               - productId
 *               - quantity
 *           example:
 *             productId: "507f1f77bcf86cd799439011"
 *             quantity: 2
 *             size: "M"
 *             color: "Black"
 *     responses:
 *       200:
 *         description: Item added to cart successfully
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
 *                   example: "Item added to cart successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Insufficient stock available"
 *       401:
 *         description: Unauthorized - Authentication required
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
// POST /api/v1/cart/add - Require authentication
router.post('/add', protect, addToCart);

/**
 * @swagger
 * /cart/update:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItemId:
 *                 type: string
 *                 description: Cart item ID to update
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity for the item
 *             required:
 *               - cartItemId
 *               - quantity
 *           example:
 *             cartItemId: "507f1f77bcf86cd799439013"
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
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
 *                   example: "Cart item updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Insufficient stock available"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cart item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Cart item not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/v1/cart/update - Require authentication  
router.put('/update', protect, updateCartItem);

/**
 * @swagger
 * /cart/remove/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID to remove
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
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
 *                   example: "Item removed from cart successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cart item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Cart item not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/v1/cart/remove/:id - Require authentication
router.delete('/remove/:id', protect, removeFromCart);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
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
 *                   example: "Cart cleared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: {}
 *                       example: []
 *                     totalAmount:
 *                       type: number
 *                       example: 0
 *                     totalItems:
 *                       type: number
 *                       example: 0
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
// DELETE /api/v1/cart - Require authentication
router.delete('/', protect, clearCart);

module.exports = router;
