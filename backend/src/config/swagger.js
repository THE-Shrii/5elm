const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '5elm E-commerce API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for 5elm E-commerce platform with Ayurvedic products focus',
      contact: {
        name: 'API Support',
        email: 'support@5elm.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.5elm.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for user authentication'
        },
        adminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for admin authentication with enhanced security'
        }
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)'
            }
          },
          required: ['success', 'message']
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          },
          required: ['success']
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1
            },
            totalPages: {
              type: 'integer',
              example: 10
            },
            hasNextPage: {
              type: 'boolean',
              example: true
            },
            hasPrevPage: {
              type: 'boolean',
              example: false
            },
            total: {
              type: 'integer',
              example: 100
            },
            count: {
              type: 'integer',
              example: 10
            }
          }
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isEmailVerified: {
              type: 'boolean',
              example: true
            },
            avatar: {
              type: 'string',
              example: 'https://res.cloudinary.com/example/image/upload/v1234567890/avatars/user123.jpg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserRegistration: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              example: 'John'
            },
            lastName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'SecurePassword123!'
            }
          },
          required: ['firstName', 'lastName', 'email', 'password']
        },
        UserLogin: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              example: 'SecurePassword123!'
            }
          },
          required: ['email', 'password']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        // Product schemas
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Organic Turmeric Powder'
            },
            description: {
              type: 'string',
              example: 'Premium quality organic turmeric powder with high curcumin content'
            },
            price: {
              type: 'number',
              example: 299.99
            },
            originalPrice: {
              type: 'number',
              example: 399.99
            },
            category: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://res.cloudinary.com/example/image/upload/v1234567890/products/turmeric1.jpg']
            },
            stock: {
              type: 'integer',
              example: 100
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isFeatured: {
              type: 'boolean',
              example: false
            },
            ayurvedicProperties: {
              type: 'object',
              properties: {
                dosha: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['vata', 'pitta', 'kapha']
                  },
                  example: ['pitta', 'kapha']
                },
                rasa: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['sweet', 'sour', 'salty', 'pungent', 'bitter', 'astringent']
                  },
                  example: ['bitter', 'pungent']
                },
                virya: {
                  type: 'string',
                  enum: ['hot', 'cold'],
                  example: 'hot'
                },
                prabhava: {
                  type: 'string',
                  example: 'Anti-inflammatory and antioxidant properties'
                }
              }
            },
            ratings: {
              type: 'object',
              properties: {
                average: {
                  type: 'number',
                  example: 4.5
                },
                count: {
                  type: 'integer',
                  example: 25
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductCreate: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 200,
              example: 'Organic Turmeric Powder'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              example: 'Premium quality organic turmeric powder with high curcumin content'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 299.99
            },
            originalPrice: {
              type: 'number',
              minimum: 0,
              example: 399.99
            },
            category: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              example: 100
            },
            ayurvedicProperties: {
              type: 'object',
              properties: {
                dosha: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['vata', 'pitta', 'kapha']
                  }
                },
                rasa: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['sweet', 'sour', 'salty', 'pungent', 'bitter', 'astringent']
                  }
                },
                virya: {
                  type: 'string',
                  enum: ['hot', 'cold']
                },
                prabhava: {
                  type: 'string'
                }
              }
            }
          },
          required: ['name', 'description', 'price', 'category', 'stock']
        },
        // Cart schemas
        CartItem: {
          type: 'object',
          properties: {
            product: {
              $ref: '#/components/schemas/Product'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2
            },
            price: {
              type: 'number',
              example: 299.99
            },
            subtotal: {
              type: 'number',
              example: 599.98
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            totalAmount: {
              type: 'number',
              example: 599.98
            },
            totalItems: {
              type: 'integer',
              example: 2
            }
          }
        },
        // Order schemas
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-2024-001234'
            },
            user: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            totalAmount: {
              type: 'number',
              example: 599.98
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'pending'
            },
            payment: {
              type: 'object',
              properties: {
                method: {
                  type: 'string',
                  enum: ['razorpay', 'cod'],
                  example: 'razorpay'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'completed', 'failed', 'refunded'],
                  example: 'pending'
                },
                transactionId: {
                  type: 'string',
                  example: 'pay_1234567890'
                }
              }
            },
            shippingAddress: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  example: 'John Doe'
                },
                address: {
                  type: 'string',
                  example: '123 Main Street'
                },
                city: {
                  type: 'string',
                  example: 'Mumbai'
                },
                state: {
                  type: 'string',
                  example: 'Maharashtra'
                },
                pincode: {
                  type: 'string',
                  example: '400001'
                },
                phone: {
                  type: 'string',
                  example: '+91 9876543210'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Admin Authentication',
        description: 'Admin authentication with enhanced security'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog management'
      },
      {
        name: 'Categories',
        description: 'Product category management'
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations'
      },
      {
        name: 'Orders',
        description: 'Order management and tracking'
      },
      {
        name: 'Payments',
        description: 'Payment processing and management'
      },
      {
        name: 'Reviews',
        description: 'Product reviews and ratings'
      },
      {
        name: 'Wishlist',
        description: 'User wishlist management'
      },
      {
        name: 'Coupons',
        description: 'Discount coupons and promotions'
      },
      {
        name: 'Search',
        description: 'Product search and filtering'
      },
      {
        name: 'Banners',
        description: 'Website banner management'
      },
      {
        name: 'Admin',
        description: 'Administrative operations and analytics'
      },
      {
        name: 'Uploads',
        description: 'File upload management'
      },
      {
        name: 'Instagram',
        description: 'Instagram integration and social media management'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions: {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  }
};