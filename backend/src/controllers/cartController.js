const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    // Check Redis cache first
    const redisClient = getRedisClient();
    const cacheKey = `cart:${req.user.id}`;
    
    if (redisClient) {
      try {
        const cachedCart = await redisClient.get(cacheKey);
        if (cachedCart) {
          return res.status(200).json({
            success: true,
            data: JSON.parse(cachedCart),
            cached: true
          });
        }
      } catch (cacheError) {
        console.log('Cart cache error:', cacheError.message);
      }
    }

    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price images inventory.stock status visibility slug brand',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      });

    if (!cart) {
      cart = await Cart.create({ 
        user: req.user.id,
        items: [],
        totals: { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 }
      });
    }

    // Validate cart items and update if needed
    cart = await validateAndUpdateCart(cart);

    // Cache the cart for 30 minutes
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(cart));
      } catch (cacheError) {
        console.log('Cart cache set error:', cacheError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is available
    if (product.status !== 'active' || product.visibility !== 'public') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for purchase'
      });
    }

    // Check stock availability
    const availableStock = product.inventory.stock;
    if (product.inventory.trackQuantity && availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items available in stock`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    let price = product.price;
    
    // Add variant price if applicable
    if (variant && product.variants && product.variants.length > 0) {
      const productVariant = product.variants.find(v => 
        v.name === variant.name && v.value === variant.value
      );
      if (productVariant) {
        price = product.price; // Base price
        variant.price = productVariant.price; // Additional variant price
      }
    }

    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check total stock for updated quantity
      if (product.inventory.trackQuantity && availableStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more items. Only ${availableStock - cart.items[existingItemIndex].quantity} more available`
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = price;
      cart.items[existingItemIndex].variant = variant;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        variant,
        price,
        addedAt: new Date()
      });
    }

    // Save cart (triggers calculateTotals)
    await cart.save();

    // Update cache
    await updateCartCache(req.user.id, cart);

    // Populate for response
    await cart.populate({
      path: 'items.product',
      select: 'name price images inventory.stock status slug brand'
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Validate stock for new quantity
    const product = await Product.findById(cart.items[itemIndex].product);
    if (product.inventory.trackQuantity && product.inventory.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.inventory.stock} items available in stock`
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Update cache
    await updateCartCache(req.user.id, cart);

    // Populate for response
    await cart.populate({
      path: 'items.product',
      select: 'name price images inventory.stock status'
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();

    // Update cache
    await updateCartCache(req.user.id, cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.appliedCoupon = undefined;
    await cart.save();

    // Clear cache
    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.del(`cart:${req.user.id}`);
      } catch (cacheError) {
        console.log('Cart cache clear error:', cacheError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update shipping method
// @route   PUT /api/v1/cart/shipping
// @access  Private
const updateShippingMethod = async (req, res, next) => {
  try {
    const { method } = req.body;
    
    if (!['standard', 'express', 'overnight'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping method. Choose from: standard, express, overnight'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.shippingMethod = method;
    await cart.save();

    // Update cache
    await updateCartCache(req.user.id, cart);

    res.status(200).json({
      success: true,
      message: 'Shipping method updated successfully',
      data: cart
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/v1/cart/coupon
// @access  Private
const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    
    // For now, just return a placeholder response
    // This will be implemented when you add coupon system
    res.status(200).json({
      success: true,
      message: 'Coupon system coming soon',
      data: { couponCode, discount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/v1/cart/coupon
// @access  Private
const removeCoupon = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Coupon removed',
      data: { discount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cart summary for checkout
// @route   GET /api/v1/cart/summary
// @access  Private
const getCartSummary = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price images slug'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const summary = {
      itemsCount: cart.itemsCount,
      uniqueItemsCount: cart.uniqueItemsCount,
      totals: cart.totals,
      shippingMethod: cart.shippingMethod,
      estimatedDelivery: cart.estimatedDelivery,
      appliedCoupon: cart.appliedCoupon,
      items: cart.items.map(item => ({
        _id: item._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant,
        subtotal: (item.price + (item.variant?.price || 0)) * item.quantity,
        image: item.product.images[0]?.url
      }))
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to validate and update cart
const validateAndUpdateCart = async (cart) => {
  let hasChanges = false;
  const validItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product).select('status visibility inventory.stock price');
    
    if (!product || product.status !== 'active' || product.visibility !== 'public') {
      hasChanges = true;
      continue; // Remove unavailable products
    }

    // Check stock and adjust quantity if needed
    if (product.inventory.trackQuantity && item.quantity > product.inventory.stock) {
      if (product.inventory.stock > 0) {
        item.quantity = product.inventory.stock;
        hasChanges = true;
      } else {
        hasChanges = true;
        continue; // Remove out of stock items
      }
    }

    // Update price if changed
    if (item.price !== product.price) {
      item.price = product.price;
      hasChanges = true;
    }

    item.isAvailable = true;
    validItems.push(item);
  }

  if (hasChanges) {
    cart.items = validItems;
    await cart.save();
  }

  return cart;
};

// Helper function to update cart cache
const updateCartCache = async (userId, cart) => {
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      await redisClient.setEx(`cart:${userId}`, 1800, JSON.stringify(cart));
    } catch (cacheError) {
      console.log('Cart cache update error:', cacheError.message);
    }
  }
};

// CORRECT EXPORT WITH ALL FUNCTIONS
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  updateShippingMethod,
  applyCoupon,         
  removeCoupon,        
  getCartSummary
};
