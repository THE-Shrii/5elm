const asyncHandler = require('../middleware/asyncHandler');
const { sql, connectSQLServer } = require('../config/sqlserver');
const nodemailer = require('nodemailer');
let Visitor, Coupon;

try {
  Visitor = require('../models/Visitor');
  Coupon = require('../models/Coupon');
} catch (error) {
  console.log('⚠️ Models not available - running in limited mode');
}

const { sendEmail } = require('../config/email');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

// In-memory storage for limited mode
const visitorStore = new Map();
let visitorIdCounter = 1;

// @desc    Register visitor from landing page
// @route   POST /api/v1/landing/register
// @access  Public
const registerVisitor = asyncHandler(async (req, res, next) => {
  const { name, email, phone, interests, source, referralSource } = req.body;

  // Validate required fields
  if (!name || !email) {
    return next(new ErrorResponse('Name and email are required', 400));
  }

  // Check if database is available
  if (!Visitor) {
    // Limited mode - simulate registration
    const visitorId = `mock_${visitorIdCounter++}`;
    const couponCode = generateCouponCode();
    
    // Simulate visitor data
    const mockVisitor = {
      _id: visitorId,
      name,
      email,
      phone,
      interests: interests || [],
      source: source || 'landing_page',
      referralSource,
      couponCode,
      couponSent: true,
      isSubscribed: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in memory
    visitorStore.set(email, mockVisitor);

    // Simulate email sending (log to console in limited mode)
    console.log(`📧 Limited Mode: Welcome email would be sent to ${email} with coupon ${couponCode}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome email sent. (Limited Mode)',
      data: {
        visitor: {
          id: mockVisitor._id,
          name: mockVisitor.name,
          email: mockVisitor.email,
          couponCode: mockVisitor.couponCode,
          couponSent: mockVisitor.couponSent
        }
      }
    });
  }

  // Check if visitor already exists
  let visitor = await Visitor.findOne({ email });
  
  if (visitor) {
    // If visitor exists but hasn't received coupon, send it
    if (!visitor.couponSent) {
      await sendWelcomeEmail(visitor);
      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        data: {
          visitor: {
            id: visitor._id,
            name: visitor.name,
            email: visitor.email,
            couponCode: visitor.couponCode,
            couponSent: true
          }
        }
      });
    }
    
    return next(new ErrorResponse('Email already registered', 400));
  }

  // Generate unique coupon code
  const couponCode = generateCouponCode();

  // Create new visitor
  visitor = await Visitor.create({
    name,
    email,
    phone,
    interests: interests || [],
    source: source || 'landing_page',
    referralSource,
    couponCode,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });

  // Send welcome email with coupon
  await sendWelcomeEmail(visitor);

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome email sent.',
    data: {
      visitor: {
        id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        couponCode: visitor.couponCode,
        couponSent: visitor.couponSent
      }
    }
  });
});

// @desc    Get visitor statistics (admin only)
// @route   GET /api/v1/landing/stats
// @access  Private/Admin
const getVisitorStats = asyncHandler(async (req, res, next) => {
  // Check if database is available
  if (!Visitor) {
    // Limited mode - return mock stats
    const totalVisitors = visitorStore.size;
    const visitorsWithCoupons = Array.from(visitorStore.values()).filter(v => v.couponSent).length;
    const activeSubscribers = Array.from(visitorStore.values()).filter(v => v.status === 'active').length;
    const unsubscribed = Array.from(visitorStore.values()).filter(v => v.status === 'unsubscribed').length;

    // Generate mock daily stats
    const dailyStats = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailyStats.push({
        _id: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate()
        },
        visitors: Math.floor(Math.random() * 10) + 1,
        couponsSent: Math.floor(Math.random() * 8) + 1
      });
    }

    // Generate mock source stats
    const sourceStats = [
      { _id: 'landing_page', count: Math.floor(totalVisitors * 0.7) },
      { _id: 'social_media', count: Math.floor(totalVisitors * 0.2) },
      { _id: 'referral', count: Math.floor(totalVisitors * 0.1) }
    ];

    return res.status(200).json({
      success: true,
      message: 'Limited Mode: Mock statistics',
      data: {
        overview: {
          totalVisitors,
          visitorsWithCoupons,
          activeSubscribers,
          unsubscribed
        },
        dailyStats,
        sourceStats
      }
    });
  }

  const stats = await Visitor.aggregate([
    {
      $group: {
        _id: null,
        totalVisitors: { $sum: 1 },
        visitorsWithCoupons: {
          $sum: { $cond: [{ $eq: ['$couponSent', true] }, 1, 0] }
        },
        activeSubscribers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        unsubscribed: {
          $sum: { $cond: [{ $eq: ['$status', 'unsubscribed'] }, 1, 0] }
        }
      }
    }
  ]);

  const dailyStats = await Visitor.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        visitors: { $sum: 1 },
        couponsSent: {
          $sum: { $cond: [{ $eq: ['$couponSent', true] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 30 }
  ]);

  const sourceStats = await Visitor.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalVisitors: 0,
        visitorsWithCoupons: 0,
        activeSubscribers: 0,
        unsubscribed: 0
      },
      dailyStats,
      sourceStats
    }
  });
});

// @desc    Get all visitors (admin only)
// @route   GET /api/v1/landing/visitors
// @access  Private/Admin
const getVisitors = asyncHandler(async (req, res, next) => {
  // Check if database is available
  if (!Visitor) {
    // Limited mode - return mock visitor list
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const allVisitors = Array.from(visitorStore.values());
    const total = allVisitors.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const visitors = allVisitors.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      message: 'Limited Mode: Mock visitor data',
      data: {
        visitors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const visitors = await Visitor.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await Visitor.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      visitors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Unsubscribe visitor from emails
// @route   GET /api/v1/landing/unsubscribe/:id
// @access  Public
const unsubscribeVisitor = asyncHandler(async (req, res, next) => {
  // Check if database is available
  if (!Visitor) {
    // Limited mode - find in memory store
    const visitorId = req.params.id;
    let foundVisitor = null;
    
    for (const [email, visitor] of visitorStore.entries()) {
      if (visitor._id === visitorId) {
        foundVisitor = visitor;
        break;
      }
    }

    if (!foundVisitor) {
      return next(new ErrorResponse('Visitor not found', 404));
    }

    foundVisitor.isSubscribed = false;
    foundVisitor.status = 'unsubscribed';

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from email notifications (Limited Mode)'
    });
  }

  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return next(new ErrorResponse('Visitor not found', 404));
  }

  visitor.isSubscribed = false;
  visitor.status = 'unsubscribed';
  await visitor.save();

  res.status(200).json({
    success: true,
    message: 'Successfully unsubscribed from email notifications'
  });
});

// @desc    Track email open
// @route   GET /api/v1/landing/email-opened/:id
// @access  Public
const trackEmailOpen = asyncHandler(async (req, res, next) => {
  // Check if database is available
  if (!Visitor) {
    // Limited mode - find in memory store
    const visitorId = req.params.id;
    let foundVisitor = null;
    
    for (const [email, visitor] of visitorStore.entries()) {
      if (visitor._id === visitorId) {
        foundVisitor = visitor;
        break;
      }
    }

    if (!foundVisitor) {
      return next(new ErrorResponse('Visitor not found', 404));
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    return res.end(pixel);
  }

  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return next(new ErrorResponse('Visitor not found', 404));
  }

  visitor.emailOpens += 1;
  visitor.lastEmailOpenedAt = new Date();
  await visitor.save();

  // Return a 1x1 transparent pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(pixel);
});

// Helper function to generate coupon code
function generateCouponCode() {
  const prefix = 'WELCOME';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}

// Helper function to send welcome email
async function sendWelcomeEmail(visitor) {
  try {
    // Create coupon in database
    const coupon = await Coupon.create({
      code: visitor.couponCode,
      name: 'Welcome Discount for Landing Page Visitors',
      description: 'Special discount for early bird subscribers',
      type: 'percentage',
      value: 15, // 15% discount
      minimumOrderValue: 500, // ₹500 minimum order
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      usageLimit: 1,
      usageLimitPerUser: 1,
      newUsersOnly: true,
      isActive: true,
      createdBy: null, // System generated
      notes: `Auto-generated welcome coupon for visitor: ${visitor.email}`
    });

    // Prepare email data
    const emailData = {
      name: visitor.name,
      couponCode: visitor.couponCode,
      discountText: '15% OFF your first order',
      expiryDate: coupon.endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      websiteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      unsubscribeUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/landing/unsubscribe/${visitor._id}`
    };

    // Send email
    await sendEmail({
      to: visitor.email,
      subject: '🎉 Welcome to 5ELM - Your Exclusive 15% Discount Inside!',
      template: 'landing-welcome',
      data: emailData
    });

    // Update visitor record
    visitor.couponSent = true;
    visitor.couponSentAt = new Date();
    visitor.welcomeEmailSent = true;
    visitor.welcomeEmailSentAt = new Date();
    await visitor.save();

    console.log(`✅ Welcome email sent to ${visitor.email} with coupon ${visitor.couponCode}`);

  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${visitor.email}:`, error);
    throw error;
  }
}

/**
 * @desc Register visitor from landing page (SQL Server + Email coupon)
 * @route POST /api/v1/landing/register
 * @access Public
 */
const registerVisitorSQL = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, consent } = req.body;

  // 1️⃣ Validate required fields
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, and email are required.',
    });
  }

  console.log('📩 New landing registration request from:', email);

  try {
    const pool = await connectSQLServer();

    // 2️⃣ Check if email already exists
    const existing = await pool
      .request()
      .input('Email', sql.VarChar(255), email)
      .query('SELECT TOP 1 * FROM LandingSubscriptions WHERE Email = @Email');

    if (existing.recordset.length > 0) {
      console.log(`⚠️ Email already registered: ${email}`);
      return res.status(400).json({
        success: false,
        message:
          'This email is already registered. Please check your inbox for your welcome coupon.',
      });
    }

    // 3️⃣ Generate coupon code
    const couponCode = `5ELM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 4️⃣ Insert record into SQL Server
    await pool
      .request()
      .input('FirstName', sql.VarChar(100), firstName)
      .input('LastName', sql.VarChar(100), lastName)
      .input('Email', sql.VarChar(255), email)
      .input('Phone', sql.VarChar(20), phone || null)
      .input('Consent', sql.Bit, consent ? 1 : 0)
      .input('CouponCode', sql.VarChar(20), couponCode)
      .query(`
        INSERT INTO LandingSubscriptions (FirstName, LastName, Email, Phone, Consent, CouponCode)
        VALUES (@FirstName, @LastName, @Email, @Phone, @Consent, @CouponCode)
      `);

    // 5️⃣ Configure email transport (production safe)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Gmail uses STARTTLS on 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ Email server verified successfully.');

    // 6️⃣ Build polished HTML email template
    const htmlBody = `
      <div style="font-family:'Poppins',Helvetica,Arial,sans-serif;background-color:#121212;color:#f1f1f1;padding:0;margin:0;">
        <div style="max-width:600px;margin:0 auto;background:#1E1E1E;border-radius:14px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          
          <!-- Logo -->
          <div style="text-align:center;margin-bottom:20px;">
            <img src="https://5elm.in/assets/logo-light.png" alt="5ELM Logo" width="90" style="border:none;outline:none;display:inline-block;">
          </div>
          
          <!-- Heading -->
          <h2 style="color:#EAEAEA;text-align:center;margin-bottom:10px;">
            Welcome to 5ELM, ${firstName}!
          </h2>

          <p style="font-size:15px;line-height:1.6;text-align:center;color:#c9c9c9;margin:0 0 25px;">
            We're thrilled to have you join our journey towards <strong>natural Ayurvedic skincare</strong>.<br>
            Here's your exclusive <strong>10% OFF</strong> welcome coupon:
          </p>

          <!-- Coupon Code -->
          <div style="text-align:center;margin:25px 0;">
            <div style="display:inline-block;background:#2E2E2E;color:#fff;padding:14px 24px;border-radius:8px;font-size:22px;letter-spacing:2px;font-weight:bold;">
              ${couponCode}
            </div>
          </div>

          <p style="font-size:14px;text-align:center;color:#b3b3b3;">
            Use this code during checkout to enjoy your discount.<br>
            <a href="https://5elm.in" style="color:#9FFF9F;text-decoration:none;font-weight:600;">Visit 5ELM.in →</a>
          </p>

          <div style="margin-top:32px;text-align:center;color:#aaa;font-size:13px;">
            With love,<br>
            🌿 <strong>The 5ELM Team</strong>
          </div>

          <hr style="border:none;border-top:1px solid #333;margin:30px 0;">
          
          <p style="font-size:11px;text-align:center;color:#666;line-height:1.4;">
            You're receiving this email because you subscribed on our website.<br>
            If this wasn't you, you can <a href="mailto:5elminternal@gmail.com" style="color:#9FFF9F;text-decoration:none;">unsubscribe</a> anytime.
          </p>
        </div>
      </div>
    `;

    // 7️⃣ Send email
    await transporter.sendMail({
      from: `"5ELM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to 5ELM - Your Exclusive 10% OFF Coupon!',
      html: htmlBody,
    });

    console.log(`📧 Coupon email sent successfully to ${email}`);

    // 8️⃣ Return safe success response
    res.status(201).json({
      success: true,
      message: 'Thank you for registering! A welcome email with your coupon has been sent.',
    });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({
      success: false,
      message: 'We encountered a server issue. Please try again later.',
    });
  }
});

/**
 * @desc Get all landing page subscriptions (SQL Server)
 * @route GET /api/v1/landing/subscriptions
 * @access Public
 */
const getSubscriptionsSQL = asyncHandler(async (req, res, next) => {
  try {
    const pool = await connectSQLServer();
    const result = await pool.request().query(`
      SELECT Id, FirstName, LastName, Email, Phone, Consent, CouponCode, CreatedAt
      FROM LandingSubscriptions
      ORDER BY CreatedAt DESC
    `);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error('❌ SQL Fetch Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch landing subscriptions.',
      error: err.message
    });
  }
});

module.exports = {
  registerVisitor,
  registerVisitorSQL,
  getVisitorStats,
  getVisitors,
  unsubscribeVisitor,
  trackEmailOpen,
  getSubscriptionsSQL
};