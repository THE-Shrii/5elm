const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { getRedisClient } = require('../config/redis');

// Enhanced rate limiter with user-based limits (Updated API)
const createUserRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests from this user',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      type: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      if (req.user && req.user.id) {
        return `user_${req.user.id}`;
      }
      return `ip_${req.ip}`;
    },
    skip: (req) => {
      // Skip rate limiting for admins in development
      if (process.env.NODE_ENV === 'development' && req.user?.role === 'admin') {
        return true;
      }
      return false;
    },
    skipSuccessfulRequests,
    skipFailedRequests,
    // FIXED: Use handler instead of deprecated onLimitReached
    handler: async (req, res) => {
      // Log rate limit exceeded events
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.logActivity({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action: 'security_violation',
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'failure',
          statusCode: 429,
          description: `Rate limit exceeded: ${maxRequests} requests in ${windowMs}ms`,
          riskLevel: 'medium',
          isSecurityEvent: true,
          isSuspicious: true
        });
      } catch (error) {
        console.error('Failed to log rate limit event:', error);
      }

      // Send rate limit response
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        type: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// Strict rate limiting for authentication endpoints
const authRateLimit = createUserRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true
});

// Rate limiting for general API endpoints
const apiRateLimit = createUserRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes per user
  message: 'Too many API requests. Please slow down.'
});

// Rate limiting for payment endpoints
const paymentRateLimit = createUserRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts. Please wait before trying again.',
  skipSuccessfulRequests: false
});

// Rate limiting for file uploads
const uploadRateLimit = createUserRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
  message: 'Upload limit exceeded. Please wait before uploading more files.'
});

// FIXED: Updated slow down middleware with new API
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: () => 500, // FIXED: Use function format for new API
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  keyGenerator: (req) => {
    return req.user?.id ? `user_${req.user.id}` : `ip_${req.ip}`;
  },
  // Disable the warning
  validate: {
    delayMs: false
  }
});

// Brute force protection for password-related endpoints
const bruteForceProtection = createUserRateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 3, // 3 failed attempts per day
  message: 'Account temporarily locked due to too many failed attempts',
  skipSuccessfulRequests: true
});

module.exports = {
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  uploadRateLimit,
  speedLimiter,
  bruteForceProtection,
  createUserRateLimit
};
