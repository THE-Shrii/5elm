# 🔑 STEP-BY-STEP GUIDE: Getting Instagram API Keys

## 📋 PREREQUISITES

Before starting, make sure you have:
- ✅ A Facebook account (required for Meta Developer)
- ✅ An Instagram Business or Creator account
- ✅ A Facebook Page connected to your Instagram account
- ✅ Phone number for verification
- ✅ Valid email address

---

## 🚀 STEP 1: CREATE META DEVELOPER ACCOUNT

### 1.1 Go to Meta Developers
1. Open your web browser
2. Navigate to: **https://developers.facebook.com/**
3. Click **"Get Started"** in the top right corner

### 1.2 Sign Up/Login
1. **If you have Facebook account**: Click "Continue with Facebook"
2. **If you don't have Facebook**: Click "Create Account" and fill details
3. Enter your phone number for verification
4. Enter the SMS verification code

### 1.3 Accept Developer Terms
1. Read and accept "Meta Developer Terms"
2. Read and accept "Meta Platform Policy"
3. Click **"Submit"**

---

## 🏗️ STEP 2: CREATE A NEW APP

### 2.1 Create App
1. Once logged in, click **"Create App"** button
2. You'll see different app types:

### 2.2 Choose App Type
**Select: "Business"** (This gives you access to Instagram features)
- ✅ Consumer - No (limited features)
- ✅ **Business - Yes (choose this)**
- ✅ Gaming - No

### 2.3 Fill App Details
```
App Name: "5ELM Instagram Integration"
App Contact Email: your-email@domain.com
Business Manager Account: Skip (or create if you have one)
```

### 2.4 Complete App Creation
1. Click **"Create App"**
2. You may be asked to verify your phone number again
3. Wait for app creation to complete

---

## 📱 STEP 3: ADD INSTAGRAM PRODUCTS

### 3.1 Access App Dashboard
1. You'll be redirected to your app dashboard
2. Look for **"Add Product"** section
3. You'll see various products like Facebook Login, Instagram, etc.

### 3.2 Add Instagram Basic Display
1. Find **"Instagram Basic Display"**
2. Click **"Set Up"** button
3. This allows basic Instagram access (profile, media)

### 3.3 Add Instagram Graph API (IMPORTANT)
1. Find **"Instagram Graph API"**
2. Click **"Set Up"** button
3. This allows advanced features (posting, insights, comments)

### 3.4 Add Facebook Login
1. Find **"Facebook Login"**
2. Click **"Set Up"** button
3. This enables OAuth authentication

---

## 🔐 STEP 4: GET YOUR API KEYS

### 4.1 Go to App Settings
1. In your app dashboard, click **"Settings"** in left sidebar
2. Click **"Basic"** under Settings
3. You'll see your app credentials

### 4.2 Copy Your Keys
```
App ID: 1234567890123456 (example)
App Secret: Click "Show" button to reveal
```

**IMPORTANT**: 
- App ID = This is your `META_APP_ID` and `INSTAGRAM_CLIENT_ID`
- App Secret = This is your `META_APP_SECRET` and `INSTAGRAM_CLIENT_SECRET`

### 4.3 Add App Domain (Important!)
Still in Basic Settings:
```
App Domains: yourdomain.com (your website domain)
Privacy Policy URL: https://yourdomain.com/privacy
Terms of Service URL: https://yourdomain.com/terms
```

---

## 🔗 STEP 5: CONFIGURE OAUTH REDIRECT

### 5.1 Configure Instagram Basic Display
1. Go to **"Instagram Basic Display"** in left sidebar
2. Click **"Basic Display"**
3. Scroll to **"Instagram App"** section
4. Click **"Create New App"**

### 5.2 Set OAuth Redirect URIs
Add these URLs (replace yourdomain.com with your actual domain):
```
Production: https://yourdomain.com/api/v1/instagram/auth/callback
Development: http://localhost:5000/api/v1/instagram/auth/callback
Testing: https://your-ngrok-url.ngrok.io/api/v1/instagram/auth/callback
```

### 5.3 Set Deauthorize Callback URL
```
https://yourdomain.com/api/v1/instagram/auth/deauthorize
```

### 5.4 Set Data Deletion Request URL
```
https://yourdomain.com/api/v1/instagram/auth/data-deletion
```

---

## 📊 STEP 6: CONFIGURE GRAPH API

### 6.1 Go to Instagram Graph API
1. Click **"Instagram Graph API"** in left sidebar
2. This is for business features

### 6.2 Add Instagram Business Account
1. You need to connect your Instagram Business account
2. Go to **"Business Manager"** (if you have one)
3. Or connect directly through the app

---

## 🧪 STEP 7: TEST YOUR SETUP

### 7.1 Get Test Access Token
1. In Instagram Basic Display settings
2. Scroll to **"User Token Generator"**
3. Click **"Add or Remove Instagram Testers"**
4. Add your Instagram account as a tester
5. Generate a test token

### 7.2 Test API Call
Copy this URL and replace `ACCESS_TOKEN`:
```
https://graph.instagram.com/me?fields=id,username&access_token=ACCESS_TOKEN
```

If successful, you'll see:
```json
{
  "id": "1234567890",
  "username": "your_username"
}
```

---

## 📝 STEP 8: ADD KEYS TO YOUR .ENV FILE

Create a `.env` file in your backend and add:

```env
# Instagram API Configuration
META_APP_ID=your_app_id_from_step_4
META_APP_SECRET=your_app_secret_from_step_4
INSTAGRAM_CLIENT_ID=your_app_id_from_step_4
INSTAGRAM_CLIENT_SECRET=your_app_secret_from_step_4
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/v1/instagram/auth/callback

# For production, change to:
# INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/v1/instagram/auth/callback
```

---

## ⚠️ IMPORTANT REQUIREMENTS

### Instagram Account Requirements
1. **Must be Business/Creator Account**
   - Go to Instagram Settings > Account > Switch to Professional Account
   - Choose "Business" or "Creator"

2. **Must be Connected to Facebook Page**
   - In Instagram settings, connect to a Facebook page
   - This enables Graph API features

### App Review Requirements (For Production)
For advanced features, you need Meta's approval:

**Required for App Review:**
- Privacy Policy URL
- Terms of Service URL
- App icon (1024x1024px)
- Detailed explanation of how you'll use Instagram data
- Screen recordings/screenshots of your app

**Permissions to Request:**
- `instagram_basic` - Basic profile access
- `instagram_content_publish` - Create posts
- `instagram_manage_insights` - Get analytics
- `instagram_manage_comments` - Reply to comments

---

## 🔍 TROUBLESHOOTING

### Common Issues:

**1. "Invalid Client ID"**
- Double-check App ID in .env file
- Make sure no extra spaces or characters

**2. "Redirect URI Mismatch"**
- Ensure redirect URI in app settings matches your .env
- Check for http vs https
- Check for trailing slashes

**3. "Instagram Account Not Connected"**
- Convert to Business/Creator account
- Connect to Facebook page
- Wait a few minutes for connection to sync

**4. "This App Cannot Use Instagram Basic Display"**
- Make sure you added Instagram Basic Display product
- Check app is in Development mode
- Add yourself as a tester

---

## 🎯 FINAL VERIFICATION

To verify everything works:

1. **Test API Keys:**
```bash
curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TEST_TOKEN"
```

2. **Test Your Backend:**
```bash
curl http://localhost:5000/api/v1/instagram/auth/connect
```

3. **Should Return:**
```json
{
  "success": true,
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=..."
}
```

**🎉 SUCCESS!** You now have all the API keys needed to integrate Instagram with your e-commerce admin panel!

---

## 📞 NEED HELP?

If you get stuck:
1. Check Meta Developer documentation
2. Verify Instagram account type (Business/Creator)
3. Ensure Facebook page connection
4. Double-check all URLs and settings
5. Try regenerating access tokens
