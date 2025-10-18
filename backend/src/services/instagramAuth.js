const axios = require('axios');
const qs = require('querystring');

class InstagramAuth {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    this.metaAppId = process.env.META_APP_ID;
    this.metaAppSecret = process.env.META_APP_SECRET;
  }

  // Step 1: Generate Instagram OAuth URL for admin to authorize
  generateAuthUrl(scopes = ['user_profile', 'user_media']) {
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: this.generateState() // CSRF protection
    };

    return `https://api.instagram.com/oauth/authorize?${qs.stringify(params)}`;
  }

  // Step 2: Generate Facebook OAuth URL for business accounts (RECOMMENDED)
  generateBusinessAuthUrl() {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'pages_show_list',
      'pages_read_engagement'
    ];

    const params = {
      client_id: this.metaAppId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: this.generateState()
    };

    return `https://www.facebook.com/v18.0/dialog/oauth?${qs.stringify(params)}`;
  }

  // Step 3: Exchange authorization code for short-lived token
  async exchangeCodeForToken(authCode) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code: authCode
      });

      return {
        success: true,
        access_token: response.data.access_token,
        user_id: response.data.user_id,
        expires_in: 3600 // 1 hour
      };
    } catch (error) {
      console.error('Token exchange error:', error.response?.data);
      throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  // Step 4: Exchange short-lived token for long-lived token (60 days)
  async getLongLivedToken(shortLivedToken) {
    try {
      const params = {
        grant_type: 'ig_exchange_token',
        client_secret: this.clientSecret,
        access_token: shortLivedToken
      };

      const response = await axios.get(`https://graph.instagram.com/access_token?${qs.stringify(params)}`);

      return {
        success: true,
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in // ~60 days
      };
    } catch (error) {
      console.error('Long-lived token error:', error.response?.data);
      throw new Error(`Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Step 5: Refresh long-lived token (before it expires)
  async refreshLongLivedToken(currentToken) {
    try {
      const params = {
        grant_type: 'ig_refresh_token',
        access_token: currentToken
      };

      const response = await axios.get(`https://graph.instagram.com/refresh_access_token?${qs.stringify(params)}`);

      return {
        success: true,
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Token refresh error:', error.response?.data);
      throw new Error(`Failed to refresh token: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get Instagram Business Account ID from connected Facebook pages
  async getBusinessAccountId(accessToken) {
    try {
      // First, get Facebook pages
      const pagesResponse = await axios.get('https://graph.facebook.com/me/accounts', {
        params: {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account'
        }
      });

      // Find page with Instagram business account
      const pageWithInstagram = pagesResponse.data.data.find(
        page => page.instagram_business_account
      );

      if (!pageWithInstagram) {
        throw new Error('No Instagram business account found. Please connect your Instagram account to a Facebook page.');
      }

      return {
        success: true,
        facebook_page_id: pageWithInstagram.id,
        facebook_page_name: pageWithInstagram.name,
        instagram_business_account_id: pageWithInstagram.instagram_business_account.id
      };
    } catch (error) {
      console.error('Business account error:', error.response?.data);
      throw new Error(`Failed to get business account: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Validate current access token
  async validateToken(accessToken) {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type',
          access_token: accessToken
        }
      });

      return {
        valid: true,
        user: response.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error?.message || 'Invalid token'
      };
    }
  }

  // Generate secure state parameter for CSRF protection
  generateState() {
    return require('crypto').randomBytes(16).toString('hex');
  }

  // Store tokens securely in database
  async storeTokens(userId, tokens) {
    // In a real implementation, store in your database with encryption
    console.log('Storing tokens for user:', userId);
    console.log('Tokens:', { ...tokens, access_token: '[HIDDEN]' });
    
    // Example database storage:
    // await TokenModel.create({
    //   userId,
    //   platform: 'instagram',
    //   accessToken: encrypt(tokens.access_token),
    //   refreshToken: encrypt(tokens.refresh_token),
    //   expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    //   createdAt: new Date()
    // });
  }

  // Retrieve stored tokens
  async getStoredTokens(userId) {
    // In a real implementation, fetch from database and decrypt
    console.log('Retrieving tokens for user:', userId);
    
    // Example database retrieval:
    // const tokenRecord = await TokenModel.findOne({
    //   userId,
    //   platform: 'instagram',
    //   expiresAt: { $gt: new Date() }
    // });
    // 
    // return tokenRecord ? {
    //   access_token: decrypt(tokenRecord.accessToken),
    //   expires_at: tokenRecord.expiresAt
    // } : null;
    
    return null; // Placeholder
  }
}

module.exports = InstagramAuth;
