# 🎯 QUICK REFERENCE: Instagram API Keys Setup

## 📋 CHECKLIST - Follow This Order:

### ✅ Phase 1: Account Setup
- [ ] Have Facebook account
- [ ] Have Instagram Business/Creator account  
- [ ] Connect Instagram to Facebook Page
- [ ] Verify phone number

### ✅ Phase 2: Developer Account
- [ ] Go to https://developers.facebook.com/
- [ ] Click "Get Started" 
- [ ] Login/Register
- [ ] Accept developer terms

### ✅ Phase 3: Create App
- [ ] Click "Create App"
- [ ] Choose "Business" type
- [ ] Name: "5ELM Instagram Integration"
- [ ] Add contact email

### ✅ Phase 4: Add Products
- [ ] Add "Instagram Basic Display"
- [ ] Add "Instagram Graph API" 
- [ ] Add "Facebook Login"

### ✅ Phase 5: Get API Keys
- [ ] Go to Settings > Basic
- [ ] Copy App ID (this is META_APP_ID)
- [ ] Click "Show" and copy App Secret (this is META_APP_SECRET)

### ✅ Phase 6: Configure Redirects
- [ ] Go to Instagram Basic Display
- [ ] Add OAuth Redirect URI: `http://localhost:5000/api/v1/instagram/auth/callback`
- [ ] For production: `https://yourdomain.com/api/v1/instagram/auth/callback`

### ✅ Phase 7: Test Setup
- [ ] Add yourself as Instagram tester
- [ ] Generate test token
- [ ] Test API call: `https://graph.instagram.com/me?fields=id,username&access_token=TOKEN`

### ✅ Phase 8: Add to Project
- [ ] Copy keys to your .env file
- [ ] Test backend endpoint: `GET /api/v1/instagram/auth/connect`
- [ ] Should return authorization URL

---

## 🔑 THE EXACT KEYS YOU NEED:

After completing the steps above, you'll have these values:

```env
# From Step 5 (App Settings > Basic)
META_APP_ID=1234567890123456
META_APP_SECRET=abc123def456ghi789jkl012mno345pqr678

# These are the same values
INSTAGRAM_CLIENT_ID=1234567890123456  
INSTAGRAM_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678

# This is what you set in Step 6
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/v1/instagram/auth/callback
```

---

## 🚨 COMMON MISTAKES TO AVOID:

1. **Wrong Account Type**: Instagram must be Business/Creator, not Personal
2. **No Facebook Page**: Business accounts must connect to a Facebook page
3. **Wrong App Type**: Choose "Business" not "Consumer" when creating app
4. **Missing Products**: Must add both Instagram Basic Display AND Graph API
5. **Wrong Redirect**: URI in app settings must exactly match your .env file
6. **Spaces in Keys**: No spaces before/after keys in .env file
7. **HTTP vs HTTPS**: Development uses http://localhost, production needs https://

---

## ⏱️ TIME ESTIMATE:

- **First Time**: 30-45 minutes
- **With Experience**: 10-15 minutes
- **App Review** (for production): 2-7 days

---

## 🆘 STUCK? TRY THESE:

### Issue: Can't find "Create App" button
**Solution**: Make sure you're logged into Facebook first, then go to developers.facebook.com

### Issue: "Instagram Basic Display" not showing
**Solution**: 
1. Make sure you created a "Business" type app
2. Refresh the page
3. Try logging out and back in

### Issue: "Invalid OAuth redirect URI"
**Solution**: 
1. Go to Instagram Basic Display settings
2. Make sure URI exactly matches (no trailing slash, correct protocol)
3. Save settings and wait 5 minutes

### Issue: "Instagram account not found"  
**Solution**:
1. Convert Instagram to Business account
2. Connect to Facebook page
3. Wait 10-15 minutes for sync

### Issue: API calls return "Invalid access token"
**Solution**:
1. Regenerate test token
2. Make sure using long-lived token for production
3. Check token hasn't expired

---

## 🎉 SUCCESS INDICATORS:

You'll know it's working when:

1. ✅ You can generate authorization URL
2. ✅ Instagram login popup appears
3. ✅ After authorization, you get redirected to your callback
4. ✅ API calls return Instagram data (username, media, etc.)
5. ✅ Your admin panel shows "Instagram Connected" status

**Ready to connect Instagram to your e-commerce admin panel!** 🚀
