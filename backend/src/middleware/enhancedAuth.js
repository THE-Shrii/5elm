const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const RefreshToken = require('../models/RefreshToken');

// Enhanced JWT verification with blacklist checking
const verifyToken = async (req, res, next) => {
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

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user and check if still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Check if user changed password after token was issued
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      await TokenBlacklist.blacklistToken(token, user._id, 'password_change', req);
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
        lockUntil: user.lockUntil
      });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    next(error);
  }
};

// Generate access and refresh tokens
const generateTokens = async (user, req) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  // Generate refresh token (long-lived)
  const refreshToken = await RefreshToken.createForUser(
    user._id,
    req.ip,
    req.get('User-Agent')
  );

  return {
    accessToken,
    refreshToken: refreshToken.token,
    accessTokenExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    refreshTokenExpires: refreshToken.expiresAt
  };
};

// Refresh access token using refresh token
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Find and validate refresh token
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      isActive: true
    }).populate('user');

    if (!storedToken || !storedToken.isActiveAndNotExpired) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = storedToken.user;

    // Generate new tokens
    const tokens = await generateTokens(user, req);

    // Revoke old refresh token and replace with new one
    storedToken.revoke(req.ip, tokens.refreshToken);
    await storedToken.save();

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });

  } catch (error) {
    next(error);
  }
};

// Logout with token blacklisting
const secureLogout = async (req, res, next) => {
  try {
    const token = req.token;
    const userId = req.user.id;

    // Blacklist current access token
    await TokenBlacklist.blacklistToken(token, userId, 'logout', req);

    // Revoke all refresh tokens for this user if requested
    if (req.body.logoutFromAllDevices) {
      await RefreshToken.updateMany(
        { user: userId, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date(),
          revokedByIp: req.ip 
        }
      );
    } else if (req.body.refreshToken) {
      // Revoke specific refresh token
      const refreshToken = await RefreshToken.findOne({
        token: req.body.refreshToken,
        user: userId
      });
      
      if (refreshToken) {
        refreshToken.revoke(req.ip);
        await refreshToken.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect: verifyToken,
  generateTokens,
  refreshAccessToken,
  secureLogout
};
