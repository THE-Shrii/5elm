const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, 'fullstack-ecommerce/backend/.env') });

// Debug: Log SMTP settings
console.log("📬 SMTP Settings:", process.env.SMTP_HOST, process.env.SMTP_USER);

// Import configurations
const connectDB = require('./fullstack-ecommerce/backend/src/config/database');
const { connectRedis } = require('./fullstack-ecommerce/backend/src/config/redis');
const { connectSQLServer, closeSQLConnection } = require('./fullstack-ecommerce/backend/src/config/sqlserver');
const { initializeIndices } = require('./fullstack-ecommerce/backend/src/config/elasticsearch');
const { specs, swaggerUi, swaggerOptions } = require('./fullstack-ecommerce/backend/src/config/swagger');

// Initialize database connection (non-blocking)
connectDB().catch(err => {
  console.log('⚠️ Starting server without MongoDB connection');
});

// Initialize SQL Server (non-blocking)
connectSQLServer().catch(err => {
  console.log('⚠️ Starting server without SQL Server connection');
});

// Initialize Redis (optional)
if (!process.env.SKIP_REDIS) {
  connectRedis();
}

// Initialize Elasticsearch (optional)  
if (!process.env.SKIP_ELASTICSEARCH) {
  initializeIndices().catch(err => {
    console.log('⚠️ Elasticsearch initialization failed:', err.message);
    console.log('⚠️ Search system running in fallback mode');
  });
} else {
  console.log('⚠️ Elasticsearch initialization skipped (SKIP_ELASTICSEARCH=true)');
}

// Import middleware
const errorHandler = require('./fullstack-ecommerce/backend/src/middleware/errorHandler');
const logger = require('./fullstack-ecommerce/backend/src/middleware/logger');
// Remove old rate limiter: const { apiLimiter } = require('./src/middleware/rateLimiter');
const {
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  uploadRateLimit,
  speedLimiter
} = require('./fullstack-ecommerce/backend/src/middleware/advancedRateLimit');
const auditLogger = require('./fullstack-ecommerce/backend/src/middleware/auditLogger');

// Import routes
const authRoutes = require('./fullstack-ecommerce/backend/src/routes/authRoutes');
const userRoutes = require('./fullstack-ecommerce/backend/src/routes/userRoutes');
const productRoutes = require('./fullstack-ecommerce/backend/src/routes/productRoutes');
const categoryRoutes = require('./fullstack-ecommerce/backend/src/routes/categoryRoutes');
const cartRoutes = require('./fullstack-ecommerce/backend/src/routes/cartRoutes');
const orderRoutes = require('./fullstack-ecommerce/backend/src/routes/orderRoutes');
const paymentRoutes = require('./fullstack-ecommerce/backend/src/routes/paymentRoutes');
const reviewRoutes = require('./fullstack-ecommerce/backend/src/routes/reviewRoutes');
const wishlistRoutes = require('./fullstack-ecommerce/backend/src/routes/wishlistRoutes');
const couponRoutes = require('./fullstack-ecommerce/backend/src/routes/couponRoutes');
const couponRedeemRoutes = require('./fullstack-ecommerce/backend/src/routes/couponRedeemRoutes');
const adminRoutes = require('./fullstack-ecommerce/backend/src/routes/adminRoutes');
const adminAuthRoutes = require('./fullstack-ecommerce/backend/src/routes/adminAuthRoutes');
const uploadRoutes = require('./fullstack-ecommerce/backend/src/routes/uploadRoutes');
const searchRoutes = require('./fullstack-ecommerce/backend/src/routes/searchRoutes');
const bannerRoutes = require('./fullstack-ecommerce/backend/src/routes/bannerRoutes');
const instagramRoutes = require('./fullstack-ecommerce/backend/src/routes/instagramRoutes');
const instagramAuthRoutes = require('./fullstack-ecommerce/backend/src/routes/instagramAuthRoutes');
const landingRoutes = require('./fullstack-ecommerce/backend/src/routes/landingRoutes');

const app = express();

// Connect to databases
connectDB();
connectRedis();
initializeIndices().then(success => {
  console.log(success ? '✅ Search system initialized' : '⚠️  Search system running in fallback mode');
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*', // Allow all origins if none specified
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ ADDED: Audit logging middleware (before routes)
app.use(auditLogger());

// ✅ ADDED: Speed limiter for suspicious activity detection
app.use(speedLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());
app.use(logger);

// API Versioning
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// ✅ UPDATED: Apply enhanced security rate limiting to specific routes
app.use(`${API_PREFIX}/auth`, authRateLimit);        // 5 attempts per 15min
app.use(`${API_PREFIX}/payments`, paymentRateLimit); // 10 attempts per hour
app.use(`${API_PREFIX}/uploads`, uploadRateLimit);   // 50 uploads per hour
app.use(`${API_PREFIX}`, apiRateLimit);              // 1000 requests per 15min

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/auth/admin`, adminAuthRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/landing-coupons`, couponRedeemRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/banners`, bannerRoutes);
app.use(`${API_PREFIX}/instagram`, instagramRoutes);
app.use(`${API_PREFIX}/instagram/auth`, instagramAuthRoutes);
app.use(`/api/v1/uploads`, uploadRoutes);
app.use(`/api/v1/search`, searchRoutes);
app.use(`/api/v1/landing`, landingRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to 5ELM E-commerce API',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    company: '5ELM',
    contact: process.env.COMPANY_EMAIL,
    security: {
      auditLogging: true,
      rateLimiting: true,
      encryptionEnabled: !!process.env.ENCRYPTION_KEY
    }
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '5ELM API Server is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: API_VERSION,
    security: {
      status: 'Enterprise-Grade',
      features: ['JWT Blacklisting', 'Audit Logging', 'Rate Limiting', 'File Security', 'Data Encryption']
    }
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '5ELM E-commerce API Documentation',
    version: API_VERSION,
    baseUrl: `${req.protocol}://${req.get('host')}${API_PREFIX}`,
    endpoints: {
      auth: '/auth',
      users: '/users',
      products: '/products',
      categories: '/categories',
      cart: '/cart',
      orders: '/orders',
      payments: '/payments',
      reviews: '/reviews',
      wishlist: '/wishlist',
      coupons: '/coupons',
      admin: '/admin',
      uploads: '/uploads',
      search: '/search',
      landing: '/landing'
    },
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    security: {
      rateLimits: {
        auth: '5 requests per 15 minutes',
        payments: '10 requests per hour',
        uploads: '50 requests per hour',
        general: '1000 requests per 15 minutes'
      },
      features: ['Enterprise Security', 'Audit Logging', 'File Protection']
    }
  });
});

// 404 Handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on 5ELM API server`,
    availableRoutes: `${API_PREFIX}/`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 5ELM E-commerce API Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📱 Company: ${process.env.COMPANY_NAME}`);
  console.log(`📧 Support: ${process.env.COMPANY_EMAIL}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`🛡️ Security: Enterprise-Grade Protection Active`);
  console.log(`📊 Features: Audit Logging, Rate Limiting, File Security, Data Encryption`);
});

// Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down 5ELM server...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down 5ELM server...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down 5ELM server gracefully...');
  server.close(async () => {
    await closeSQLConnection();
    console.log('💥 5ELM server process terminated!');
  });
});

module.exports = app;
