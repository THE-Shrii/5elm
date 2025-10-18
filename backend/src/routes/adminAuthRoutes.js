const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { 
  adminLogin, 
  getAdminProfile, 
  adminLogout, 
  adminLoginLimiter,
  enhancedAdminAuth 
} = require('../middleware/enhancedAdminAuth');

const router = express.Router();

// @desc    One-time admin user setup (for production)
// @route   POST /api/v1/auth/admin/setup
// @access  Public (but only works if no admin exists)
router.post('/setup', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: '5elminternal@gmail.com' });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('VEDICelement@01200', 12);

    // Create admin user
    const adminUser = new User({
      firstName: '5ELM',
      lastName: 'Internal',
      email: '5elminternal@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true
    });

    await adminUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        email: '5elminternal@gmail.com',
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating admin user'
    });
  }
});

// @desc    Admin login with enhanced security
// @route   POST /api/v1/auth/admin/login
// @access  Public (but restricted to specific email)
router.post('/login', adminLoginLimiter, adminLogin);

// @desc    Get admin profile
// @route   GET /api/v1/auth/admin/me
// @access  Private/Admin
router.get('/me', enhancedAdminAuth, getAdminProfile);

// @desc    Admin logout
// @route   POST /api/v1/auth/admin/logout
// @access  Private/Admin
router.post('/logout', enhancedAdminAuth, adminLogout);

// @desc    Verify admin token
// @route   GET /api/v1/auth/admin/verify
// @access  Private/Admin
router.get('/verify', enhancedAdminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin token is valid',
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
