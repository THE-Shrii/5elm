const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Rate limiter for admin login attempts
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for admin login
  message: {
    success: false,
    message: 'Too many admin login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced admin authentication middleware
const enhancedAdminAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is blacklisted
      const redisClient = getRedisClient();
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token is no longer valid. Please login again.'
          });
        }
      }

      // Get user from database with password field for additional verification
      const user = await User.findById(decoded.id).select('+password +role');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.'
        });
      }

      // Strict admin email verification
      if (user.email !== '5elminternal@gmail.com') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin credentials required.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Admin account has been deactivated.'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Admin account is temporarily locked.'
        });
      }

      // Ensure user has admin role
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Additional security: Log admin access
      console.log(`🔐 Admin Access: ${user.email} accessed ${req.method} ${req.originalUrl} at ${new Date()}`);
      
      // Store admin session info in Redis for tracking (if Redis is available)
      if (redisClient) {
        const sessionKey = `admin_session_${user._id}_${Date.now()}`;
        await redisClient.setex(sessionKey, 3600, JSON.stringify({
          userId: user._id,
          email: user.email,
          accessTime: new Date(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: `${req.method} ${req.originalUrl}`
        }));
      }

      // Grant access
      req.user = user;
      next();

    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

  } catch (error) {
    console.error('Enhanced admin auth error:', error);
    next(error);
  }
};

// Admin-specific login function with enhanced security
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Strict email check - only allow the specific admin email
    if (email !== '5elminternal@gmail.com') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Find admin user
    const user = await User.findOne({ 
      email: '5elminternal@gmail.com',
      role: 'admin'
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked due to security reasons'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 3 failed attempts
      if (user.loginAttempts >= 3) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        
        return res.status(423).json({
          success: false,
          message: 'Admin account locked due to too many failed login attempts. Please contact system administrator.'
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: `Invalid admin credentials. ${3 - user.loginAttempts} attempts remaining.`
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.isLocked = false;
      user.lockUntil = undefined;
      await user.save();
    }

    // Generate JWT token with shorter expiry for admin
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Shorter session for admin security
    );

    // Log successful admin login
    console.log(`🔐 Admin Login Success: ${user.email} logged in from IP: ${req.ip} at ${new Date()}`);

    // Store login session in Redis for tracking
    const redisClient = getRedisClient();
    if (redisClient) {
      const loginKey = `admin_login_${user._id}_${Date.now()}`;
      await redisClient.setex(loginKey, 14400, JSON.stringify({ // 4 hours
        userId: user._id,
        email: user.email,
        loginTime: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    next(error);
  }
};

// Get admin profile with enhanced security
const getAdminProfile = async (req, res, next) => {
  try {
    // Double-check admin credentials
    if (req.user.email !== '5elminternal@gmail.com' || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    
    res.status(200).json({
      success: true,
      user,
      securityInfo: {
        lastLogin: new Date(),
        tokenExpiry: '4 hours',
        securityLevel: 'Enhanced'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin logout with token blacklisting
const adminLogout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Blacklist the token
      const redisClient = getRedisClient();
      if (redisClient) {
        await redisClient.setex(`blacklist_${token}`, 14400, 'blacklisted'); // 4 hours
      }
    }

    console.log(`🔐 Admin Logout: ${req.user.email} logged out at ${new Date()}`);

    res.status(200).json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enhancedAdminAuth,
  adminLogin,
  getAdminProfile,
  adminLogout,
  adminLoginLimiter
};
