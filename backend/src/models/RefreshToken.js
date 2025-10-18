const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  }
}, {
  timestamps: true
});

// Indexes for performance
refreshTokenSchema.index({ user: 1, isActive: 1 });
refreshTokenSchema.index({ token: 1, isActive: 1 });

// Virtual to check if token is expired
refreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

// Virtual to check if token is active and not expired
refreshTokenSchema.virtual('isActiveAndNotExpired').get(function() {
  return this.isActive && !this.isExpired;
});

// Generate new refresh token
refreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(40).toString('hex');
};

// Create new refresh token for user
refreshTokenSchema.statics.createForUser = async function(userId, ipAddress, userAgent) {
  const token = this.generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return await this.create({
    token,
    user: userId,
    expiresAt,
    createdByIp: ipAddress,
    deviceInfo: {
      userAgent,
      platform: this.getPlatform(userAgent),
      browser: this.getBrowser(userAgent)
    }
  });
};

// Revoke refresh token
refreshTokenSchema.methods.revoke = function(ipAddress, replacedByToken) {
  this.revokedAt = Date.now();
  this.revokedByIp = ipAddress;
  this.replacedByToken = replacedByToken;
  this.isActive = false;
};

// Helper methods for device detection
refreshTokenSchema.statics.getPlatform = function(userAgent) {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
};

refreshTokenSchema.statics.getBrowser = function(userAgent) {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  return 'Unknown';
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
