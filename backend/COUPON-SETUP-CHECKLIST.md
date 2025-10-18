# 🎁 Coupon Feature - Quick Setup Checklist

## ✅ Completed Steps

- [x] Added `CouponCode VARCHAR(20)` column to `LandingSubscriptions` table
- [x] Updated `registerVisitorSQL` function with:
  - Duplicate email check
  - Coupon code generation
  - Email delivery with nodemailer
  - Enhanced error handling
- [x] Updated `getSubscriptionsSQL` to include CouponCode in response
- [x] Added `nodemailer` import to landingController.js
- [x] Created comprehensive documentation (COUPON-FEATURE-GUIDE.md)
- [x] Created test script (test-coupon-feature.js)

---

## 🔧 Required Configuration (DO THIS NOW)

### Step 1: Configure SMTP in .env

Edit your `backend/.env` file and add/update these lines:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Option A: Gmail (Recommended for Production)
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate password for "Mail" → "Other (5ELM Backend)"
5. Copy the 16-character password
6. Use it as `SMTP_PASS`

#### Option B: Ethereal Email (For Testing Only)
1. Visit https://ethereal.email/
2. Click "Create Ethereal Account"
3. Copy credentials and use in .env:
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=generated-username@ethereal.email
SMTP_PASS=generated-password
```
*Note: Emails can be viewed at https://ethereal.email/*

---

## 🧪 Testing Steps

### 1. Start your backend server
```bash
cd /Applications/5elmecommerce/fullstack-ecommerce/backend
npm start
```

### 2. Run the test script
```bash
node test-coupon-feature.js
```

### 3. Check results
- ✅ User should be registered
- ✅ Coupon code should be generated (format: `5ELM-XXXXXX`)
- ✅ Email should be sent
- ✅ Duplicate email should be rejected
- ✅ GET endpoint should show coupon codes

### 4. Check database
Run this in SQLTools:
```sql
SELECT Id, FirstName, LastName, Email, CouponCode, CreatedAt
FROM LandingSubscriptions
ORDER BY CreatedAt DESC;
```

### 5. Check email
- **Gmail**: Check your inbox/spam
- **Ethereal**: Visit https://ethereal.email/messages

---

## 📧 Expected Email Output

**Subject:** 🎁 Your 5ELM Welcome Coupon Code

**Body:**
```
Welcome to 5ELM, [FirstName]!

Thank you for registering with us. Here's your exclusive coupon code:

5ELM-XXXXXX

Use this code to get 10% off your first order.

With love,
The 5ELM Team 🌿
```

---

## 🎯 API Endpoints Summary

### POST /api/v1/landing/register
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "consent": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ Visitor registered successfully and coupon emailed to john@example.com",
  "couponCode": "5ELM-A3F2B1"
}
```

**Response (Duplicate):**
```json
{
  "success": false,
  "message": "Email already registered."
}
```

### GET /api/v1/landing/subscriptions
**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 1,
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john@example.com",
      "Phone": "+1234567890",
      "Consent": true,
      "CouponCode": "5ELM-A3F2B1",
      "CreatedAt": "2025-10-18T12:30:00.000Z"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Email not sending?
1. Check SMTP credentials in `.env`
2. Verify port (587 for TLS, 465 for SSL)
3. Check console logs for errors
4. Test with Ethereal first

### Coupon not showing in database?
1. Verify `CouponCode` column exists:
   ```sql
   SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'LandingSubscriptions' AND COLUMN_NAME = 'CouponCode';
   ```
2. If missing, run: `ALTER TABLE LandingSubscriptions ADD CouponCode VARCHAR(20);`

### Server crashes on registration?
1. Check if nodemailer is installed: `npm list nodemailer`
2. If not: `npm install nodemailer`
3. Verify SMTP env variables are set

---

## 📦 Files Modified

1. `src/controllers/landingController.js` - Added coupon logic
2. `FiveELM SQL.session.sql` - Added ALTER TABLE command
3. New: `COUPON-FEATURE-GUIDE.md` - Comprehensive documentation
4. New: `test-coupon-feature.js` - Automated test script
5. New: `COUPON-SETUP-CHECKLIST.md` - This file

---

## ✅ Ready to Go!

Once you've configured SMTP credentials:
1. Restart your backend server
2. Test registration from your landing page
3. Check email delivery
4. Verify coupons in database

**Feature is production-ready!** 🚀🎉
