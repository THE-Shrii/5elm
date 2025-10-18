const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Middleware to log all API requests
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    // Skip audit logging if MongoDB is not connected or if disabled via env var
    if (process.env.DISABLE_AUDIT_LOGGING === 'true' || mongoose.connection.readyState !== 1) {
      return next();
    }

    const startTime = Date.now();
    const requestId = uuidv4();
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Store original res.json
    const originalJson = res.json;
    const originalSend = res.send;
    
    let responseData = null;
    let responseSize = 0;

    // Override res.json to capture response
    res.json = function(data) {
      responseData = data;
      responseSize = JSON.stringify(data).length;
      return originalJson.call(this, data);
    };

    // Override res.send to capture response
    res.send = function(data) {
      if (!responseData) {
        responseData = data;
        responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      }
      return originalSend.call(this, data);
    };

    // Continue to next middleware
    next();

    // Log after response is sent
    res.on('finish', async () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Determine action based on route and method - FIXED
      const action = determineAction(req.method, req.route?.path || req.path);
      
      // Determine if this is a security-sensitive action
      const securityActions = [
        'login', 'logout', 'register', 'password_change', 'password_reset',
        'admin_access', 'payment_create', 'user_create', 'user_update'
      ];
      const isSecurityEvent = securityActions.includes(action) || 
                              req.path.includes('/admin') ||
                              res.statusCode >= 400;

      try {
        await AuditLog.logActivity({
          userId: req.user?.id || null, // Handle unauthenticated users
          userEmail: req.user?.email || null, // Handle unauthenticated users
          action: action,
          method: req.method,
          endpoint: req.originalUrl,
          resourceType: determineResourceType(req.path),
          resourceId: req.params?.id || null,
          ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
          userAgent: req.get('User-Agent') || 'unknown',
          status: res.statusCode >= 400 ? 'failure' : 'success',
          statusCode: res.statusCode,
          description: generateDescription(action, req, res),
          responseTime: responseTime,
          requestSize: parseInt(req.get('Content-Length')) || 0,
          responseSize: responseSize,
          sessionId: req.sessionID || null,
          requestId: requestId,
          riskLevel: determineRiskLevel(req, res, action),
          isSecurityEvent: isSecurityEvent,
          isSuspicious: checkSuspiciousActivity(req, res),
          metadata: {
            query: req.query || {},
            params: req.params || {},
            userRole: req.user?.role || 'guest'
          }
        });
      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw - just log the error
      }
    });
  };
};

// Helper functions - UPDATED
const determineAction = (method, path) => {
  if (!path) return 'api_request';
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (path.includes('/auth/register')) return 'register';
  if (path.includes('/cart') && method === 'GET') return 'cart_view';
  if (path.includes('/cart') && method === 'POST') return 'cart_add';
  if (path.includes('/cart') && method === 'DELETE') return 'cart_remove';
  if (path.includes('/products') && method === 'GET') return 'product_view';
  if (path.includes('/products') && method === 'POST') return 'product_create';
  if (path.includes('/orders') && method === 'GET') return 'order_view';
  if (path.includes('/orders') && method === 'POST') return 'order_create';
  return 'api_request'; // Default fallback
};

const determineResourceType = (path) => {
  if (path.includes('/users')) return 'User';
  if (path.includes('/products')) return 'Product';
  if (path.includes('/orders')) return 'Order';
  if (path.includes('/cart')) return 'Cart';
  if (path.includes('/payments')) return 'Payment';
  return 'System';
};

const determineRiskLevel = (req, res, action) => {
  if (res.statusCode >= 500) return 'high';
  if (res.statusCode >= 400) return 'medium';
  if (req.path.includes('/admin')) return 'medium';
  return 'low';
};

const checkSuspiciousActivity = (req, res) => {
  return res.statusCode === 401 || res.statusCode === 403;
};

const generateDescription = (action, req, res) => {
  const user = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Anonymous';
  const status = res.statusCode >= 400 ? 'failed' : 'successful';
  return `${user} performed ${action} - ${status} (${res.statusCode})`;
};

module.exports = auditLogger;
