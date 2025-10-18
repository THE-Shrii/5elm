# 🌿 5ELM Backend API

Complete REST API for the 5ELM Ayurvedic E-commerce Platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Overview

This backend API provides a complete e-commerce solution with specialized features for Ayurvedic products, including:

- RESTful API architecture
- JWT-based authentication
- Advanced search with Elasticsearch integration
- Payment processing with Razorpay
- Real-time inventory management
- Comprehensive admin dashboard
- Enterprise-grade security features

## ✨ Features

### Core E-commerce
- ✅ User authentication & authorization (JWT)
- ✅ Product catalog management
- ✅ Shopping cart system
- ✅ Order processing & management
- ✅ Payment gateway integration (Razorpay)
- ✅ Review & rating system
- ✅ Wishlist functionality
- ✅ Coupon & discount management

### Ayurvedic Specialization
- ✅ Dosha-based product filtering (Vata, Pitta, Kapha)
- ✅ Ingredient search with Sanskrit names
- ✅ Condition-based product recommendations
- ✅ Skin type compatibility filtering
- ✅ Ayurvedic certification tracking

### Enterprise Features
- ✅ Multi-tier rate limiting
- ✅ Audit logging for security events
- ✅ JWT token blacklisting
- ✅ File upload security with virus scanning
- ✅ Data encryption at rest
- ✅ Redis caching for performance
- ✅ Elasticsearch for advanced search
- ✅ Email notifications
- ✅ Swagger API documentation

## 🛠 Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Search**: Elasticsearch
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Razorpay
- **File Storage**: Cloudinary
- **Email**: NodeMailer
- **Documentation**: Swagger UI
- **Testing**: Jest & Supertest
- **Security**: Helmet, CORS, express-rate-limit

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- MongoDB v5.0 or higher
- Redis v7 or higher (optional)
- Elasticsearch v9 or higher (optional)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Start production server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`

### Quick Test

```bash
# Health check
curl http://localhost:5000/health

# API documentation
open http://localhost:5000/api-docs
```

## 📚 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication & Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| POST | `/auth/refresh-token` | Refresh JWT token | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password/:token` | Reset password | No |
| GET | `/auth/profile` | Get user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| DELETE | `/auth/account` | Delete user account | Yes |

### Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | Get all products | No |
| GET | `/products/:id` | Get product by ID | No |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |
| GET | `/products/featured` | Get featured products | No |
| GET | `/products/category/:id` | Get products by category | No |

### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | Get all categories | No |
| GET | `/categories/:id` | Get category by ID | No |
| POST | `/categories` | Create category | Admin |
| PUT | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

### Cart

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/cart` | Get user cart | Yes |
| POST | `/cart/add` | Add item to cart | Yes |
| PUT | `/cart/update/:itemId` | Update cart item | Yes |
| DELETE | `/cart/remove/:itemId` | Remove item from cart | Yes |
| DELETE | `/cart/clear` | Clear entire cart | Yes |

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | Get user orders | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |
| POST | `/orders` | Create new order | Yes |
| PUT | `/orders/:id/cancel` | Cancel order | Yes |
| GET | `/orders/admin/all` | Get all orders | Admin |
| PUT | `/orders/:id/status` | Update order status | Admin |

### Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/create-order` | Create Razorpay order | Yes |
| POST | `/payments/verify` | Verify payment | Yes |
| POST | `/payments/webhook` | Razorpay webhook | No |
| GET | `/payments/:id` | Get payment details | Yes |

### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reviews/product/:productId` | Get product reviews | No |
| POST | `/reviews` | Create review | Yes |
| PUT | `/reviews/:id` | Update review | Yes |
| DELETE | `/reviews/:id` | Delete review | Yes |
| GET | `/reviews/user` | Get user reviews | Yes |

### Search (Ayurvedic)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/search/ayurvedic` | Advanced Ayurvedic search | No |
| GET | `/search/suggestions` | Search suggestions | No |
| GET | `/search/filters` | Available filters | No |
| POST | `/search/index` | Reindex products | Admin |

### Wishlist

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wishlist` | Get user wishlist | Yes |
| POST | `/wishlist/add` | Add to wishlist | Yes |
| DELETE | `/wishlist/remove/:productId` | Remove from wishlist | Yes |
| DELETE | `/wishlist/clear` | Clear wishlist | Yes |

### Coupons

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/coupons` | Get all coupons | Admin |
| GET | `/coupons/:code` | Get coupon by code | No |
| POST | `/coupons` | Create coupon | Admin |
| PUT | `/coupons/:id` | Update coupon | Admin |
| DELETE | `/coupons/:id` | Delete coupon | Admin |
| POST | `/coupons/validate` | Validate coupon | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/admin/login` | Admin login | No |
| GET | `/admin/dashboard` | Dashboard stats | Admin |
| GET | `/admin/users` | Manage users | Admin |
| GET | `/admin/analytics` | Sales analytics | Admin |
| GET | `/admin/audit-logs` | Security audit logs | Admin |

### File Upload

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/uploads/image` | Upload single image | Admin |
| POST | `/uploads/images` | Upload multiple images | Admin |
| DELETE | `/uploads/:filename` | Delete file | Admin |

## 🔐 Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. **Register a new user**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "SecurePass@123",
       "phone": "1234567890"
     }'
   ```

2. **Login to get token**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "SecurePass@123"
     }'
   ```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

3. **Use the token in subsequent requests**
   ```bash
   curl http://localhost:5000/api/v1/auth/profile \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## ⚙️ Environment Variables

See `.env.example` for all available configuration options. Key variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/5elm

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Payment
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
SMTP_PASS=your_password

# Redis (Optional)
REDIS_URL=redis://localhost:6379
SKIP_REDIS=false

# Elasticsearch (Optional)
ELASTICSEARCH_NODE=http://localhost:9200
SKIP_ELASTICSEARCH=false
```

## 🔒 Security

### Implemented Security Features

1. **Authentication**
   - JWT with secure token generation
   - Token blacklisting for logout
   - Refresh token mechanism
   - Password hashing with bcrypt (12 rounds)

2. **API Security**
   - Multi-tier rate limiting
     - Auth: 5 requests/15min
     - Payment: 10 requests/hour
     - Upload: 50 requests/hour
     - General: 1000 requests/15min
   - CORS with configurable origins
   - Helmet for security headers
   - Input validation with express-validator
   - MongoDB sanitization (NoSQL injection prevention)

3. **File Upload Security**
   - File type validation
   - File size limits
   - VirusTotal scanning (optional)
   - Secure storage with Cloudinary

4. **Data Protection**
   - Sensitive data encryption at rest
   - Secure environment variables
   - Audit logging for security events

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── controllers/
│   ├── models/
│   └── utils/
├── integration/        # API integration tests
│   ├── auth.test.js
│   ├── products.test.js
│   └── orders.test.js
└── e2e/               # End-to-end tests
    └── checkout.test.js
```

### Example Test

```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
  });
});
```

## 🚀 Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Deployment

1. **Set environment to production**
   ```bash
   NODE_ENV=production
   ```

2. **Install production dependencies**
   ```bash
   npm ci --production
   ```

3. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name 5elm-api
   pm2 startup
   pm2 save
   ```

4. **Monitor**
   ```bash
   pm2 status
   pm2 logs 5elm-api
   pm2 monit
   ```

### Environment-Specific Configurations

#### Development
- Detailed error messages
- Debug logging enabled
- CORS allows all origins
- Rate limiting relaxed

#### Production
- Generic error messages
- Error logging only
- CORS restricted to specific origins
- Strict rate limiting
- HTTPS required

## 📖 API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:5000/api-docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- **Email**: support@5elm.com
- **Documentation**: http://localhost:5000/api-docs
- **Issues**: [GitHub Issues](https://github.com/AyushkhatiDev/fullstack-ecommerce/issues)

## 🗺️ Roadmap

- [ ] GraphQL API support
- [ ] WebSocket real-time notifications
- [ ] Advanced analytics APIs
- [ ] Multi-vendor marketplace
- [ ] AI-powered recommendations
- [ ] Social authentication
- [ ] Multi-language support

---

**Built with 💚 for Ayurvedic wellness**
