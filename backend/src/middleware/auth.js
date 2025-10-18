const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is blacklisted (for logout functionality)
      const redisClient = getRedisClient();
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token is no longer valid'
          });
        }
      }

      // Get user from database
      const currentUser = await User.findById(decoded.id).select('+role');
      
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists'
        });
      }

      // Check if user is active
      if (!currentUser.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Check if user account is locked
      if (currentUser.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      // Grant access to protected route
      req.user = currentUser;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
// Make sure your authorize function looks like this:
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check:'); // Debug log
    console.log('User role:', req.user.role); // Debug log
    console.log('Required roles:', roles); // Debug log
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};


// Optional authentication (for features like guest cart)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        if (currentUser && currentUser.isActive) {
          req.user = currentUser;
        }
      } catch (error) {
        // Continue without user if token is invalid
      }
    }

    next();
  } catch (error) {
    next();
  }
};
