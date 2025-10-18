const { InstagramAPI } = require('../config/instagram');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/instagram');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and videos (MP4, MOV) are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

class InstagramController {
  constructor() {
    this.instagram = new InstagramAPI();
  }

  // Get Instagram account overview for admin dashboard
  async getAccountOverview(req, res) {
    try {
      const accountInfo = await this.instagram.getAccountInfo();
      const recentMedia = await this.instagram.getMediaPosts(10);
      
      // Get insights for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const insights = await this.instagram.getAccountInsights(
        'day',
        thirtyDaysAgo.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );

      res.json({
        success: true,
        data: {
          account: accountInfo,
          recentMedia: recentMedia.data,
          insights: insights.data,
          summary: {
            followers: accountInfo.followers_count,
            following: accountInfo.follows_count,
            posts: accountInfo.media_count,
            engagement_rate: this.calculateEngagementRate(recentMedia.data)
          }
        }
      });
    } catch (error) {
      console.error('Instagram overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Instagram overview',
        error: error.message
      });
    }
  }

  // Get all Instagram posts with pagination
  async getPosts(req, res) {
    try {
      const { limit = 25 } = req.query;
      const posts = await this.instagram.getMediaPosts(limit);
      
      // Get insights for each post
      const postsWithInsights = await Promise.all(
        posts.data.map(async (post) => {
          try {
            const insights = await this.instagram.getPostInsights(post.id);
            return { ...post, insights: insights.data };
          } catch (error) {
            return { ...post, insights: null };
          }
        })
      );

      res.json({
        success: true,
        data: postsWithInsights,
        pagination: posts.paging
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Instagram posts',
        error: error.message
      });
    }
  }

  // Create new Instagram post
  async createPost(req, res) {
    try {
      const { caption, productIds } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Media file is required'
        });
      }

      // Upload file to your CDN/cloud storage and get public URL
      const mediaUrl = await this.uploadMediaToCloud(req.file);
      
      // Determine media type
      const mediaType = req.file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';
      
      // Add product links to caption if productIds provided
      let finalCaption = caption;
      if (productIds && productIds.length > 0) {
        const productLinks = await this.generateProductLinks(productIds);
        finalCaption += '\n\n' + productLinks;
      }

      const result = await this.instagram.createPost(mediaUrl, finalCaption, mediaType);
      
      // Save post data to database for tracking
      await this.savePostToDatabase({
        instagramId: result.id,
        caption: finalCaption,
        mediaUrl,
        mediaType,
        productIds: productIds || [],
        publishedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Post created successfully',
        data: result
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Instagram post',
        error: error.message
      });
    }
  }

  // Get post comments and manage responses
  async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const comments = await this.instagram.getPostComments(postId);
      
      res.json({
        success: true,
        data: comments.data
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: error.message
      });
    }
  }

  // Reply to Instagram comment
  async replyToComment(req, res) {
    try {
      const { commentId } = req.params;
      const { message } = req.body;
      
      const result = await this.instagram.replyToComment(commentId, message);
      
      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Reply comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reply to comment',
        error: error.message
      });
    }
  }

  // Get Instagram analytics/insights
  async getAnalytics(req, res) {
    try {
      const { period = 'day', days = 30 } = req.query;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const insights = await this.instagram.getAccountInsights(
        period,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const recentPosts = await this.instagram.getMediaPosts(50);
      const postsAnalytics = await this.generatePostsAnalytics(recentPosts.data);
      
      res.json({
        success: true,
        data: {
          accountInsights: insights.data,
          postsAnalytics,
          summary: {
            totalEngagement: postsAnalytics.totalEngagement,
            averageEngagement: postsAnalytics.averageEngagement,
            bestPerformingPost: postsAnalytics.bestPost,
            growthRate: await this.calculateGrowthRate(days)
          }
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Instagram analytics',
        error: error.message
      });
    }
  }

  // Search and analyze hashtags
  async searchHashtags(req, res) {
    try {
      const { hashtag } = req.query;
      
      if (!hashtag) {
        return res.status(400).json({
          success: false,
          message: 'Hashtag parameter is required'
        });
      }
      
      const hashtagData = await this.instagram.searchHashtag(hashtag);
      
      res.json({
        success: true,
        data: hashtagData
      });
    } catch (error) {
      console.error('Hashtag search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search hashtags',
        error: error.message
      });
    }
  }

  // Helper methods
  calculateEngagementRate(posts) {
    if (!posts || posts.length === 0) return 0;
    
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + (post.like_count || 0) + (post.comments_count || 0);
    }, 0);
    
    return (totalEngagement / posts.length).toFixed(2);
  }

  async uploadMediaToCloud(file) {
    // Implement your cloud storage upload logic here
    // For now, return a local file URL
    return `${process.env.BASE_URL}/uploads/instagram/${file.filename}`;
  }

  async generateProductLinks(productIds) {
    // Generate product links for Instagram caption
    const links = productIds.map(id => 
      `🛍️ Shop: ${process.env.FRONTEND_URL}/products/${id}`
    );
    return links.join('\n');
  }

  async savePostToDatabase(postData) {
    // Save Instagram post data to your database
    // This helps track ROI and performance
    console.log('Saving post to database:', postData);
  }

  async generatePostsAnalytics(posts) {
    let totalEngagement = 0;
    let bestPost = null;
    let maxEngagement = 0;

    posts.forEach(post => {
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      totalEngagement += engagement;
      
      if (engagement > maxEngagement) {
        maxEngagement = engagement;
        bestPost = post;
      }
    });

    return {
      totalEngagement,
      averageEngagement: posts.length > 0 ? (totalEngagement / posts.length).toFixed(2) : 0,
      bestPost
    };
  }

  async calculateGrowthRate(days) {
    // Calculate follower growth rate
    // This would require storing historical data
    return 0; // Placeholder
  }

  // Schedule Instagram Post
  async schedulePost(req, res) {
    try {
      const { caption, scheduledTime, productIds } = req.body;
      
      // Save scheduled post to database
      const scheduledPost = {
        caption,
        scheduledTime: new Date(scheduledTime),
        productIds: productIds || [],
        status: 'scheduled',
        createdAt: new Date()
      };
      
      // In a real implementation, you'd save this to your database
      // and use a job queue (like Bull or Agenda) to publish at the scheduled time
      
      res.json({
        success: true,
        message: 'Post scheduled successfully',
        data: scheduledPost
      });
    } catch (error) {
      console.error('Schedule post error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule post',
        error: error.message
      });
    }
  }

  // Get Scheduled Posts
  async getScheduledPosts(req, res) {
    try {
      // In a real implementation, fetch from database
      const scheduledPosts = []; // Placeholder
      
      res.json({
        success: true,
        data: scheduledPosts
      });
    } catch (error) {
      console.error('Get scheduled posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled posts',
        error: error.message
      });
    }
  }

  // Get Post Insights with E-commerce Metrics
  async getPostInsights(req, res) {
    try {
      const { postId } = req.params;
      const insights = await this.instagram.getPostInsights(postId);
      
      // Get e-commerce data related to this post
      const ecommerceMetrics = await this.getPostEcommerceMetrics(postId);
      
      res.json({
        success: true,
        data: {
          instagramInsights: insights.data,
          ecommerceMetrics
        }
      });
    } catch (error) {
      console.error('Post insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch post insights',
        error: error.message
      });
    }
  }

  // Get Audience Insights
  async getAudienceInsights(req, res) {
    try {
      const { period = 'lifetime' } = req.query;
      
      const insights = await this.instagram.getAccountInsights(period);
      
      // Combine with your e-commerce customer data
      const audienceData = {
        instagram: insights.data,
        ecommerce: await this.getCustomerDemographics()
      };
      
      res.json({
        success: true,
        data: audienceData
      });
    } catch (error) {
      console.error('Audience insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audience insights',
        error: error.message
      });
    }
  }

  // Get Engagement Metrics
  async getEngagementMetrics(req, res) {
    try {
      const { days = 30 } = req.query;
      const posts = await this.instagram.getMediaPosts(50);
      
      const engagementData = {
        totalPosts: posts.data.length,
        averageLikes: this.calculateAverageLikes(posts.data),
        averageComments: this.calculateAverageComments(posts.data),
        engagementRate: this.calculateEngagementRate(posts.data),
        bestPerformingPosts: this.getBestPerformingPosts(posts.data),
        engagementTrends: await this.getEngagementTrends(days)
      };
      
      res.json({
        success: true,
        data: engagementData
      });
    } catch (error) {
      console.error('Engagement metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement metrics',
        error: error.message
      });
    }
  }

  // Get Product Performance on Instagram
  async getProductPerformance(req, res) {
    try {
      // Analyze which products perform best on Instagram
      const productMetrics = await this.analyzeProductPerformance();
      
      res.json({
        success: true,
        data: productMetrics
      });
    } catch (error) {
      console.error('Product performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product performance',
        error: error.message
      });
    }
  }

  // Promote Product on Instagram
  async promoteProduct(req, res) {
    try {
      const { productId } = req.params;
      const { caption, hashtags } = req.body;
      
      // Get product details from your database
      const product = await this.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Create Instagram post for product
      const productCaption = this.generateProductCaption(product, caption, hashtags);
      const result = await this.instagram.createPost(
        product.images[0], // Use first product image
        productCaption,
        'IMAGE'
      );
      
      res.json({
        success: true,
        message: 'Product promoted successfully',
        data: result
      });
    } catch (error) {
      console.error('Promote product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to promote product',
        error: error.message
      });
    }
  }

  // Track Instagram Sales
  async getInstagramSales(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Track sales that came from Instagram
      const salesData = await this.trackInstagramSales(startDate, endDate);
      
      res.json({
        success: true,
        data: salesData
      });
    } catch (error) {
      console.error('Instagram sales tracking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track Instagram sales',
        error: error.message
      });
    }
  }

  // Helper methods for e-commerce integration
  async getPostEcommerceMetrics(postId) {
    // Track clicks, conversions, sales from specific posts
    return {
      clicks: 0,
      conversions: 0,
      sales: 0,
      revenue: 0
    };
  }

  async getCustomerDemographics() {
    // Get customer demographics from your database
    return {
      ageGroups: {},
      locations: {},
      interests: []
    };
  }

  calculateAverageLikes(posts) {
    if (!posts.length) return 0;
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    return (totalLikes / posts.length).toFixed(2);
  }

  calculateAverageComments(posts) {
    if (!posts.length) return 0;
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    return (totalComments / posts.length).toFixed(2);
  }

  getBestPerformingPosts(posts) {
    return posts
      .sort((a, b) => {
        const aEngagement = (a.like_count || 0) + (a.comments_count || 0);
        const bEngagement = (b.like_count || 0) + (b.comments_count || 0);
        return bEngagement - aEngagement;
      })
      .slice(0, 5);
  }

  async getEngagementTrends(days) {
    // Calculate engagement trends over time
    return [];
  }

  async analyzeProductPerformance() {
    // Analyze which products get the most engagement
    return {
      topProducts: [],
      categoryPerformance: {},
      conversionRates: {}
    };
  }

  async getProductById(productId) {
    // Get product from your database
    return null; // Placeholder
  }

  generateProductCaption(product, customCaption, hashtags) {
    const baseCaption = customCaption || `✨ Check out our amazing ${product.name}! ✨`;
    const productLink = `\n\n🛍️ Shop now: ${process.env.FRONTEND_URL}/products/${product._id}`;
    const hashtagString = hashtags ? `\n\n${hashtags.map(tag => `#${tag}`).join(' ')}` : '';
    
    return baseCaption + productLink + hashtagString;
  }

  async trackInstagramSales(startDate, endDate) {
    // Track sales that originated from Instagram
    return {
      totalSales: 0,
      totalRevenue: 0,
      conversionRate: 0,
      topSellingProducts: []
    };
  }
}

module.exports = {
  InstagramController,
  upload
};
