# 🎉 Backend Server Running - Ready to Test!

## ✅ Server Status

**Backend Server:** ✅ RUNNING  
**Port:** 5000  
**API Base URL:** http://localhost:5000/api/v1

---

## 📊 Current Configuration

### ✅ What's Working:
- ✅ **Server Running** on port 5000
- ✅ **CORS Enabled** - Frontend can connect from any port
- ✅ **SQL Server** - Connecting to 103.174.102.61
- ✅ **Email Service** - Gmail SMTP configured (lwnkqzivnxggyytv)
- ✅ **Landing Routes** - POST /api/v1/landing/register available
- ✅ **Security** - Enterprise-grade protection active
- ✅ **Rate Limiting** - Enabled
- ✅ **Audit Logging** - Enabled

### ⚠️ Skipped (Not Needed):
- ⚠️ **MongoDB** - Not required (using SQL Server only)
- ⚠️ **Redis** - Optional caching (skipped)
- ⚠️ **Elasticsearch** - Optional search (skipped)

---

## 🧪 How to Test Your Landing Page

### Step 1: Open Frontend with Live Server

1. In VS Code, open `/Applications/5elmecommerce/5elm/index.html`
2. Right-click → **"Open with Live Server"**
3. Or click the **"Go Live"** button at the bottom of VS Code

**Your frontend will open at:** `http://127.0.0.1:5500/index.html`

### Step 2: Fill Out the Form

Enter these details:
- **First Name:** Test
- **Last Name:** User  
- **Email:** test@example.com
- **Phone:** +1234567890
- **✓ Consent:** Checked

### Step 3: Submit

Click **"Sign Up"** button

### Step 4: Watch for Results

**On the webpage, you should see:**
```
✅ Thank you! You've been registered successfully.
```

**In backend terminal, you should see:**
```
✅ Email server is ready to send messages!
📧 Email sent: <message-id>
```

**In your email inbox (5elminternal@gmail.com):**
```
Subject: 🎁 Your 5ELM Welcome Coupon Code

Welcome to 5ELM, Test!

Your exclusive coupon code: 5ELM-XXXXXX

Use this code to get 10% off your first order.
```

---

## 🔍 Testing with curl (Alternative Method)

If Live Server doesn't work, test directly with curl:

```bash
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "consent": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Visitor registered successfully and coupon emailed to test@example.com",
  "couponCode": "5ELM-A3F2B1"
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"

**Check if backend is running:**
```bash
lsof -i :5000
```

**Should show:**
```
node    12345 user   23u  IPv6 0x... TCP *:5000 (LISTEN)
```

**If not running, restart:**
```bash
cd /Applications/5elmecommerce
node server.js
```

### Issue: "CORS error" in browser console

**Solution:** Backend already has CORS enabled, but double-check:
1. Backend is running on port 5000
2. Frontend fetch URL is `http://localhost:5000/api/v1/landing/register`
3. Try using `localhost` instead of `127.0.0.1` in both frontend and backend

### Issue: "Email not sent"

**Check:**
1. SMTP password is correct in `.env`
2. Backend shows: `✅ Email server is ready to send messages!`
3. Check spam folder in Gmail

**Test email manually:**
```bash
node fullstack-ecommerce/backend/test-email-config.js
```

### Issue: "Internal server error"

**Check backend terminal for errors:**
- SQL Server connection issues
- Email service issues
- Database table not created

**Run SQL table creation script:**
```sql
ALTER TABLE LandingSubscriptions ADD CouponCode VARCHAR(20);
```

---

## 📧 View Test Results

### Check Database
```sql
SELECT Id, FirstName, LastName, Email, CouponCode, CreatedAt
FROM LandingSubscriptions
ORDER BY CreatedAt DESC;
```

### Check Email
- Open Gmail: 5elminternal@gmail.com
- Look for "Your 5ELM Welcome Coupon Code"

### Check API Response
Use browser DevTools (F12) → Network tab to see the response

---

## ✅ Current Setup Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Backend** | ✅ Running | Port 5000 |
| **Frontend** | 🔄 Ready | Open with Live Server |
| **SQL Server** | ✅ Connected | 103.174.102.61 |
| **Email** | ✅ Configured | Gmail SMTP |
| **CORS** | ✅ Enabled | Allows all origins |
| **API** | ✅ Ready | /api/v1/landing/register |
| **Coupon** | ✅ Working | Generates 5ELM-XXXXXX |

---

## 🚀 You're All Set!

**Everything is configured and ready to go:**

1. ✅ Backend server is running on port 5000
2. ✅ CORS is enabled (no cross-origin issues)
3. ✅ Frontend fetch URL points to correct backend
4. ✅ Email service is configured
5. ✅ SQL Server is connected
6. ✅ Coupon generation is working

**Next Step:** Open your `index.html` with Live Server and test the registration! 🎉

---

## 📱 Quick Test Commands

```bash
# Check if backend is running
curl http://localhost:5000/api/v1/landing/subscriptions

# Test registration
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"+1234567890","consent":true}'

# View all subscriptions
curl http://localhost:5000/api/v1/landing/subscriptions
```

**Happy Testing! 🎊**
