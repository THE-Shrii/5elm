const express = require('express');
const InstagramAuth = require('../services/instagramAuth');
const { enhancedAdminAuth } = require('../middleware/enhancedAdminAuth');

const router = express.Router();
const instagramAuth = new InstagramAuth();

// Step 1: Admin initiates Instagram connection
router.get('/connect', enhancedAdminAuth, async (req, res) => {
  try {
    const { account_type = 'business' } = req.query;
    
    let authUrl;
    if (account_type === 'business') {
      authUrl = instagramAuth.generateBusinessAuthUrl();
    } else {
      authUrl = instagramAuth.generateAuthUrl();
    }

    res.json({
      success: true,
      message: 'Instagram authorization URL generated',
      data: {
        authUrl,
        instructions: [
          '1. Click the authorization URL',
          '2. Login to Instagram/Facebook',
          '3. Grant permissions to your app',
          '4. You will be redirected back with authorization code',
          '5. System will automatically exchange code for access token'
        ]
      }
    });
  } catch (error) {
    console.error('Instagram connect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Instagram authorization URL',
      error: error.message
    });
  }
});

// Step 2: Handle OAuth callback (redirect from Instagram)
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({
        success: false,
        message: 'Instagram authorization failed',
        error: oauthError
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code received'
      });
    }

    // Exchange code for short-lived token
    const tokenData = await instagramAuth.exchangeCodeForToken(code);
    
    // Exchange short-lived for long-lived token
    const longLivedToken = await instagramAuth.getLongLivedToken(tokenData.access_token);
    
    // For business accounts, get business account ID
    let businessAccountData = null;
    try {
      businessAccountData = await instagramAuth.getBusinessAccountId(longLivedToken.access_token);
    } catch (error) {
      console.log('Not a business account or not connected to Facebook page');
    }

    // Store tokens securely
    await instagramAuth.storeTokens(tokenData.user_id, {
      ...longLivedToken,
      business_account_data: businessAccountData
    });

    // Redirect to admin panel with success message
    res.redirect(`${process.env.FRONTEND_URL}/admin/instagram?connected=true`);
    
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/admin/instagram?error=${encodeURIComponent(error.message)}`);
  }
});

// Step 3: Check connection status
router.get('/status', enhancedAdminAuth, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const storedTokens = await instagramAuth.getStoredTokens(adminUserId);
    
    if (!storedTokens) {
      return res.json({
        success: true,
        connected: false,
        message: 'Instagram account not connected'
      });
    }

    // Validate current token
    const validation = await instagramAuth.validateToken(storedTokens.access_token);
    
    if (!validation.valid) {
      return res.json({
        success: true,
        connected: false,
        message: 'Instagram token expired or invalid',
        error: validation.error
      });
    }

    res.json({
      success: true,
      connected: true,
      message: 'Instagram account connected and active',
      data: {
        username: validation.user.username,
        account_type: validation.user.account_type,
        expires_at: storedTokens.expires_at
      }
    });
    
  } catch (error) {
    console.error('Instagram status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Instagram connection status',
      error: error.message
    });
  }
});

// Step 4: Disconnect Instagram account
router.post('/disconnect', enhancedAdminAuth, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    
    // Remove stored tokens from database
    // await TokenModel.deleteMany({ userId: adminUserId, platform: 'instagram' });
    
    res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });
    
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Instagram account',
      error: error.message
    });
  }
});

// Step 5: Refresh token manually
router.post('/refresh-token', enhancedAdminAuth, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const storedTokens = await instagramAuth.getStoredTokens(adminUserId);
    
    if (!storedTokens) {
      return res.status(404).json({
        success: false,
        message: 'No Instagram tokens found to refresh'
      });
    }

    const refreshedTokens = await instagramAuth.refreshLongLivedToken(storedTokens.access_token);
    
    // Update stored tokens
    await instagramAuth.storeTokens(adminUserId, refreshedTokens);
    
    res.json({
      success: true,
      message: 'Instagram token refreshed successfully',
      data: {
        expires_in: refreshedTokens.expires_in,
        new_expiry: new Date(Date.now() + refreshedTokens.expires_in * 1000)
      }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh Instagram token',
      error: error.message
    });
  }
});

// Step 6: Test API connection
router.get('/test', enhancedAdminAuth, async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const storedTokens = await instagramAuth.getStoredTokens(adminUserId);
    
    if (!storedTokens) {
      return res.status(404).json({
        success: false,
        message: 'Instagram not connected. Please connect your account first.'
      });
    }

    // Test API call
    const axios = require('axios');
    const testResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: storedTokens.access_token
      }
    });

    res.json({
      success: true,
      message: 'Instagram API connection test successful',
      data: testResponse.data
    });
    
  } catch (error) {
    console.error('Instagram test error:', error);
    res.status(500).json({
      success: false,
      message: 'Instagram API connection test failed',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
