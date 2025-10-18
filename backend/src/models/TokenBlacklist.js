const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['logout', 'security_breach', 'password_change', 'admin_revoke'],
    required: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete when JWT naturally expires
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for fast lookups
tokenBlacklistSchema.index({ token: 1, expiresAt: 1 });
tokenBlacklistSchema.index({ userId: 1, blacklistedAt: -1 });

// Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isBlacklisted = async function(token) {
  const blacklistedToken = await this.findOne({ token });
  return !!blacklistedToken;
};

// Static method to blacklist token
tokenBlacklistSchema.statics.blacklistToken = async function(token, userId, reason, req) {
  const jwt = require('jsonwebtoken');
  let decoded;
  
  try {
    decoded = jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }

  const expiresAt = new Date(decoded.exp * 1000);

  return await this.create({
    token,
    userId,
    reason,
    expiresAt,
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent')
  });
};

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
