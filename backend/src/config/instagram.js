const axios = require('axios');

// Instagram API Configuration
const INSTAGRAM_CONFIG = {
  // Basic Display API (for personal accounts)
  CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI || 'https://yourdomain.com/auth/instagram/callback',
  
  // Graph API (for business accounts)
  ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
  BUSINESS_ACCOUNT_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
  
  // API Endpoints
  GRAPH_API_BASE: 'https://graph.facebook.com/v18.0',
  BASIC_DISPLAY_BASE: 'https://graph.instagram.com',
  
  // Scopes for different permissions
  SCOPES: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement'
  ]
};

// Instagram API Client
class InstagramAPI {
  constructor() {
    this.accessToken = INSTAGRAM_CONFIG.ACCESS_TOKEN;
    this.businessAccountId = INSTAGRAM_CONFIG.BUSINESS_ACCOUNT_ID;
  }

  // Get Instagram Business Account Info
  async getAccountInfo() {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${this.businessAccountId}`,
        {
          params: {
            fields: 'account_type,media_count,followers_count,follows_count,name,username,profile_picture_url,biography,website',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Instagram Media Posts
  async getMediaPosts(limit = 25) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${this.businessAccountId}/media`,
        {
          params: {
            fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count',
            limit,
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get media posts: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Create Instagram Post (Single Image/Video)
  async createPost(mediaUrl, caption, mediaType = 'IMAGE') {
    try {
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${this.businessAccountId}/media`,
        {
          image_url: mediaType === 'IMAGE' ? mediaUrl : undefined,
          video_url: mediaType === 'VIDEO' ? mediaUrl : undefined,
          media_type: mediaType,
          caption: caption,
          access_token: this.accessToken
        }
      );

      const creationId = containerResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${this.businessAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken
        }
      );

      return publishResponse.data;
    } catch (error) {
      throw new Error(`Failed to create post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Post Insights/Analytics
  async getPostInsights(mediaId) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${mediaId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get post insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Account Insights
  async getAccountInsights(period = 'day', since, until) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${this.businessAccountId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period,
            since,
            until,
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get account insights: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Comments on a Post
  async getPostComments(mediaId) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${mediaId}/comments`,
        {
          params: {
            fields: 'id,text,username,timestamp,like_count,replies',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get comments: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Reply to Comment
  async replyToComment(commentId, message) {
    try {
      const response = await axios.post(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/${commentId}/replies`,
        {
          message: message,
          access_token: this.accessToken
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reply to comment: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Hashtag Information
  async searchHashtag(hashtag) {
    try {
      const response = await axios.get(
        `${INSTAGRAM_CONFIG.GRAPH_API_BASE}/ig_hashtag_search`,
        {
          params: {
            user_id: this.businessAccountId,
            q: hashtag,
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search hashtag: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = {
  INSTAGRAM_CONFIG,
  InstagramAPI
};
