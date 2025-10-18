const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Make user optional for guest/unauthenticated requests
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed from true to false
    index: true
  },
  userEmail: {
    type: String,
    required: false, // Changed from true to false
    index: true
  },
  
  // Update action enum to include missing values
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout', 
      'register',
      'password_change',
      'password_reset',
      'admin_access',
      'payment_create',
      'user_create',
      'user_update',
      'product_view',
      'product_create',
      'order_view',
      'order_create',
      'cart_add',
      'cart_remove',
      'cart_view',
      'api_request', // Add this missing enum value
      'security_violation',
      'system_access',
      'data_export',
      'data_import',
      'unknown' // Fallback for any other actions
    ],
    index: true
  },
  
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  },
  
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  
  resourceType: {
    type: String,
    required: false,
    enum: ['User', 'Product', 'Order', 'Cart', 'Payment', 'System', null],
    default: null
  },
  
  resourceId: {
    type: String,
    required: false
  },
  
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: {
    type: String,
    required: false
  },
  
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  
  description: {
    type: String,
    required: false
  },
  
  responseTime: {
    type: Number,
    required: false
  },
  
  requestSize: {
    type: Number,
    required: false,
    default: 0
  },
  
  responseSize: {
    type: Number,
    required: false,
    default: 0
  },
  
  sessionId: {
    type: String,
    required: false
  },
  
  requestId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  
  isSecurityEvent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true,
  collection: 'auditlogs'
});

// Indexes for performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ isSecurityEvent: 1, createdAt: -1 });
auditLogSchema.index({ statusCode: 1, createdAt: -1 });

// Static method to log activities (FIXED VERSION)
auditLogSchema.statics.logActivity = async function(logData) {
  try {
    // Provide defaults for missing required fields
    const sanitizedData = {
      userId: logData.userId || null,
      userEmail: logData.userEmail || null,
      action: logData.action || 'api_request',
      method: logData.method || 'GET',
      endpoint: logData.endpoint || 'unknown',
      resourceType: logData.resourceType || null,
      resourceId: logData.resourceId || null,
      ipAddress: logData.ipAddress || '0.0.0.0',
      userAgent: logData.userAgent || 'unknown',
      status: logData.status || 'success',
      statusCode: logData.statusCode || 200,
      description: logData.description || `${logData.method || 'GET'} ${logData.endpoint || 'unknown'}`,
      responseTime: logData.responseTime || 0,
      requestSize: logData.requestSize || 0,
      responseSize: logData.responseSize || 0,
      sessionId: logData.sessionId || null,
      requestId: logData.requestId || null,
      riskLevel: logData.riskLevel || 'low',
      isSecurityEvent: logData.isSecurityEvent || false,
      isSuspicious: logData.isSuspicious || false,
      metadata: logData.metadata || {}
    };

    // Validate enum values
    const validActions = [
      'login', 'logout', 'register', 'password_change', 'password_reset',
      'admin_access', 'payment_create', 'user_create', 'user_update',
      'product_view', 'product_create', 'order_view', 'order_create',
      'cart_add', 'cart_remove', 'cart_view', 'api_request',
      'security_violation', 'system_access', 'data_export', 'data_import', 'unknown'
    ];

    if (!validActions.includes(sanitizedData.action)) {
      sanitizedData.action = 'unknown';
    }

    const auditLog = new this(sanitizedData);
    await auditLog.save();
    
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking the main request
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
