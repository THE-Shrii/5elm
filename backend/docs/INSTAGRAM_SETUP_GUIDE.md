# 🔧 INSTAGRAM API SETUP GUIDE FOR E-COMMERCE INTEGRATION

## STEP 1: Create Facebook/Meta Developer Account
1. Go to https://developers.facebook.com/
2. Create a Developer Account (if you don't have one)
3. Verify your account with phone number

## STEP 2: Create a New App
1. Click "Create App" 
2. Select "Business" as the app type
3. Fill in app details:
   - App Name: "5ELM E-commerce Instagram Integration"
   - App Contact Email: your-email@domain.com
   - Business Account: Select your business account

## STEP 3: Add Instagram Products
1. In your app dashboard, click "+ Add Product"
2. Add these products:
   - ✅ Instagram Basic Display (for basic access)
   - ✅ Instagram Graph API (for business features)
   - ✅ Facebook Login (for authentication)

## STEP 4: Configure Instagram Basic Display
1. Go to Instagram Basic Display > Basic Display
2. Create New App
3. Set up OAuth Redirect URIs:
   - https://yourdomain.com/auth/instagram/callback
   - http://localhost:3000/auth/instagram/callback (for development)

## STEP 5: Get Your API Credentials
```
App ID: Found in App Dashboard > Settings > Basic
App Secret: Found in App Dashboard > Settings > Basic
```

## STEP 6: Instagram Business Account Setup
1. Make sure your Instagram account is a Business/Creator account
2. Connect it to a Facebook Page
3. Go to Instagram Graph API > Basic Display
4. Generate Access Token

## STEP 7: Get Long-Lived Access Token
Use this process to get a token that lasts 60 days:

### Initial Short-Lived Token (1 hour):
```
https://api.instagram.com/oauth/authorize
  ?client_id={your-client-id}
  &redirect_uri={your-redirect-uri}
  &scope=user_profile,user_media
  &response_type=code
```

### Exchange for Long-Lived Token:
```
curl -X GET \
  "https://graph.instagram.com/access_token
    ?grant_type=ig_exchange_token
    &client_secret={your-client-secret}
    &access_token={short-lived-token}"
```

## STEP 8: Required Permissions for E-commerce Features

### For Business Accounts (RECOMMENDED):
- `instagram_basic` - Read profile info
- `instagram_content_publish` - Create posts
- `instagram_manage_insights` - Get analytics
- `instagram_manage_comments` - Manage comments
- `pages_show_list` - Access connected pages
- `pages_read_engagement` - Read engagement data

### For Personal Accounts (LIMITED):
- `user_profile` - Basic profile access
- `user_media` - Read user's media

## STEP 9: Webhook Setup (Optional but Recommended)
1. In App Dashboard > Instagram > Configuration
2. Set up webhooks for:
   - Comments (to auto-respond)
   - Mentions (to track brand mentions)
   - Story mentions

## STEP 10: App Review (For Production)
For production use, you need Meta's approval for:
- instagram_content_publish
- instagram_manage_insights
- instagram_manage_comments

Submit your app for review with:
- Detailed use case explanation
- Screen recordings of your admin panel
- Privacy policy and terms of service

## 🔐 SECURITY BEST PRACTICES

1. **Environment Variables**: Store all keys in .env file
2. **Token Refresh**: Implement automatic token refresh
3. **Rate Limiting**: Respect Instagram's API limits
4. **Error Handling**: Implement proper error handling
5. **Logging**: Log all API calls for debugging

## 📊 API RATE LIMITS

### Instagram Graph API:
- 240 calls per hour per user
- 200 calls per hour for publishing

### Instagram Basic Display:
- 200 calls per hour per user

## 🛠️ TESTING YOUR SETUP

Use these endpoints to test your integration:

1. **Test Account Info**:
   ```
   GET https://graph.instagram.com/me?fields=id,username&access_token={token}
   ```

2. **Test Media Retrieval**:
   ```
   GET https://graph.instagram.com/me/media?fields=id,caption&access_token={token}
   ```

3. **Test Publishing** (Business only):
   ```
   POST https://graph.instagram.com/{user-id}/media
   ```

## 🚨 COMMON ISSUES & SOLUTIONS

1. **"Invalid Access Token"**
   - Token expired (refresh it)
   - Wrong token type (use long-lived)

2. **"Insufficient Permissions"**
   - Request additional scopes
   - Submit for app review

3. **"Rate Limit Exceeded"**
   - Implement exponential backoff
   - Cache responses when possible

4. **"Business Account Required"**
   - Convert personal account to business
   - Connect to Facebook page

## 📝 NEXT STEPS AFTER SETUP

1. Add credentials to your .env file
2. Test API connections
3. Implement admin panel features
4. Set up monitoring and alerts
5. Plan for app review submission
