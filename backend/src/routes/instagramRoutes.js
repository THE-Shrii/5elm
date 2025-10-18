const express = require('express');
const { InstagramController, upload } = require('../controllers/instagramController');
const { enhancedAdminAuth } = require('../middleware/enhancedAdminAuth');

const router = express.Router();
const instagramController = new InstagramController();

// Apply admin authentication to all Instagram routes
router.use(enhancedAdminAuth);

// Instagram Account Management
router.get('/account/overview', instagramController.getAccountOverview.bind(instagramController));
router.get('/account/analytics', instagramController.getAnalytics.bind(instagramController));

// Instagram Posts Management
router.get('/posts', instagramController.getPosts.bind(instagramController));
router.post('/posts', upload.single('media'), instagramController.createPost.bind(instagramController));
router.get('/posts/:postId/comments', instagramController.getPostComments.bind(instagramController));
router.post('/comments/:commentId/reply', instagramController.replyToComment.bind(instagramController));

// Instagram Content Planning
router.get('/hashtags/search', instagramController.searchHashtags.bind(instagramController));
router.post('/posts/schedule', instagramController.schedulePost.bind(instagramController));
router.get('/posts/scheduled', instagramController.getScheduledPosts.bind(instagramController));

// Instagram Analytics & Insights
router.get('/insights/posts', instagramController.getPostInsights.bind(instagramController));
router.get('/insights/audience', instagramController.getAudienceInsights.bind(instagramController));
router.get('/insights/engagement', instagramController.getEngagementMetrics.bind(instagramController));

// Instagram & E-commerce Integration
router.get('/products/performance', instagramController.getProductPerformance.bind(instagramController));
router.post('/products/:productId/promote', instagramController.promoteProduct.bind(instagramController));
router.get('/sales/tracking', instagramController.getInstagramSales.bind(instagramController));

module.exports = router;
