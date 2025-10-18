# 🔑 INSTAGRAM API AUTHENTICATION SUMMARY

## ✅ WHAT YOU NEED TO GET:

### 1. **META/FACEBOOK DEVELOPER ACCOUNT**
- Go to: https://developers.facebook.com/
- Create account and verify with phone number
- Create new app (Business type)

### 2. **REQUIRED API KEYS**
```
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
INSTAGRAM_CLIENT_ID=same_as_meta_app_id
INSTAGRAM_CLIENT_SECRET=same_as_meta_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/v1/instagram/auth/callback
```

### 3. **INSTAGRAM BUSINESS SETUP**
- Convert Instagram to Business/Creator account
- Connect Instagram to a Facebook Page
- This enables advanced features like posting, insights, etc.

## 🔄 AUTHENTICATION FLOW:

### **Step 1: Admin Initiates Connection**
```
GET /api/v1/instagram/auth/connect
-> Returns authorization URL
```

### **Step 2: Admin Authorizes App**
```
Admin clicks URL -> Instagram/Facebook login -> Grants permissions
-> Redirects to: /api/v1/instagram/auth/callback?code=...
```

### **Step 3: System Exchanges Code for Token**
```
System automatically:
1. Exchanges code for short-lived token (1 hour)
2. Exchanges for long-lived token (60 days)
3. Stores securely in database
```

### **Step 4: Ready to Use**
```
All Instagram operations now work:
- POST /api/v1/instagram/posts (create posts)
- GET /api/v1/instagram/account/overview (account stats)
- GET /api/v1/instagram/account/analytics (insights)
```

## 🛠️ HOW TO IMPLEMENT:

### **1. Get Your API Keys**
1. Create app at https://developers.facebook.com/
2. Add Instagram Basic Display + Instagram Graph API products
3. Copy App ID and App Secret to your .env file

### **2. Set Redirect URI**
In your Facebook app settings, add:
```
https://yourdomain.com/api/v1/instagram/auth/callback
http://localhost:5000/api/v1/instagram/auth/callback (for testing)
```

### **3. Test the Flow**
1. Start your backend server
2. Hit: `GET http://localhost:5000/api/v1/instagram/auth/connect`
3. Copy the returned `authUrl` and visit it in browser
4. Login and authorize
5. System will handle the rest automatically

### **4. Frontend Integration**
In your admin panel, add a "Connect Instagram" button that:
1. Calls `/instagram/auth/connect` 
2. Opens the returned URL in popup/new tab
3. Shows success message when connection completes

## 🔐 SECURITY NOTES:

1. **Environment Variables**: Never commit API keys to git
2. **HTTPS Required**: Instagram requires HTTPS for production callbacks
3. **Token Storage**: Store tokens encrypted in database
4. **Token Refresh**: Implement automatic refresh before expiry
5. **Permissions**: Only request permissions you actually need

## 📊 AVAILABLE PERMISSIONS:

### **Basic (Always Available):**
- Read profile info
- Read media posts

### **Advanced (Requires App Review):**
- Create/publish posts
- Read insights/analytics
- Manage comments
- Access business account data

## 🚀 QUICK START COMMANDS:

```bash
# 1. Add to your .env file
echo "META_APP_ID=your_app_id" >> .env
echo "META_APP_SECRET=your_app_secret" >> .env
echo "INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/v1/instagram/auth/callback" >> .env

# 2. Test connection
curl http://localhost:5000/api/v1/instagram/auth/connect

# 3. Check status
curl http://localhost:5000/api/v1/instagram/auth/status
```

## ❗ IMPORTANT NOTES:

1. **Business Account Required**: For posting and insights, you need Instagram Business/Creator account
2. **Facebook Page Required**: Business accounts must be connected to a Facebook page
3. **App Review Required**: For production use, Meta must approve your app
4. **Rate Limits**: Instagram has strict API rate limits (200-240 calls/hour)
5. **Token Expiry**: Long-lived tokens last 60 days and must be refreshed

This setup allows your admin to completely control their Instagram page through your e-commerce admin panel!
