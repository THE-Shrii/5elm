# 🎁 Coupon Code Feature - Implementation Guide

## Overview
Automatic coupon code generation and email delivery for landing page registrations.

---

## ✅ What Was Implemented

### 1. Database Schema Update
Added `CouponCode` column to `LandingSubscriptions` table:
```sql
ALTER TABLE LandingSubscriptions
ADD CouponCode VARCHAR(20);
```

### 2. Enhanced Registration Logic
Updated `registerVisitorSQL` function in `src/controllers/landingController.js`:

**Features Added:**
- ✅ Duplicate email check before insertion
- ✅ Unique coupon code generation (`5ELM-XXXXXX` format)
- ✅ Coupon stored in database with user registration
- ✅ Automatic email delivery with coupon code
- ✅ Beautiful HTML email template
- ✅ Returns coupon code in API response

### 3. Updated GET Endpoint
Modified `getSubscriptionsSQL` to include `CouponCode` in the response.

---

## 🔧 Configuration Required

### Step 1: Configure SMTP Settings

Add these variables to your `backend/.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### For Gmail Users:
1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Generate an **App Password**:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "5ELM Backend"
   - Copy the 16-character password
4. Use this app password as `SMTP_PASS`

#### Alternative: Use Ethereal Email (Testing)
For testing without real email:
```bash
# Visit https://ethereal.email/ and click "Create Ethereal Account"
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=generated-user@ethereal.email
SMTP_PASS=generated-password
```
*Note: Ethereal emails are fake and can be viewed at https://ethereal.email/*

---

## 📋 How It Works

### Registration Flow:

1. **User submits form** with firstName, lastName, email, phone, consent
2. **Backend validates** required fields
3. **Checks for duplicate email** in database
4. **Generates unique coupon code**:
   - Format: `5ELM-XXXXXX` (e.g., `5ELM-A3F2B1`)
   - Uses `crypto.randomBytes(3)` for uniqueness
5. **Inserts record** into SQL Server with coupon code
6. **Sends email** with personalized welcome message and coupon
7. **Returns success response** with coupon code

### Example API Response:
```json
{
  "success": true,
  "message": "✅ Visitor registered successfully and coupon emailed to john@example.com",
  "couponCode": "5ELM-A3F2B1"
}
```

---

## 🧪 Testing

### Test 1: Register New User
```bash
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "consent": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Visitor registered successfully and coupon emailed to john.doe@example.com",
  "couponCode": "5ELM-A3F2B1"
}
```

### Test 2: Try Duplicate Email
```bash
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "consent": true
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Email already registered."
}
```

### Test 3: View All Subscriptions
```bash
curl http://localhost:5000/api/v1/landing/subscriptions
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 1,
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john.doe@example.com",
      "Phone": "+1234567890",
      "Consent": true,
      "CouponCode": "5ELM-A3F2B1",
      "CreatedAt": "2025-10-18T12:30:00.000Z"
    }
  ]
}
```

---

## 📧 Email Template

The email sent to users includes:

- **Personalized greeting** with first name
- **Prominent coupon code display** in brand color (#555C4A)
- **Clear discount description** (10% off first order)
- **Professional 5ELM branding**
- **Mobile-responsive HTML design**

### Sample Email:
```
Welcome to 5ELM, John!

Thank you for registering with us. Here's your exclusive coupon code:

5ELM-A3F2B1

Use this code to get 10% off your first order.

With love,
The 5ELM Team 🌿
```

---

## 🔍 Database Verification

### Check all coupons generated:
```sql
SELECT Id, FirstName, LastName, Email, CouponCode, CreatedAt
FROM LandingSubscriptions
ORDER BY CreatedAt DESC;
```

### Check specific user's coupon:
```sql
SELECT CouponCode, CreatedAt
FROM LandingSubscriptions
WHERE Email = 'john.doe@example.com';
```

### Count total registrations with coupons:
```sql
SELECT COUNT(*) AS TotalRegistrations
FROM LandingSubscriptions
WHERE CouponCode IS NOT NULL;
```

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Coupon Validation
Create an endpoint to validate coupon codes:
```javascript
router.get('/validate-coupon/:code', validateCoupon);
```

### 2. Coupon Usage Tracking
Add columns to track coupon redemption:
```sql
ALTER TABLE LandingSubscriptions
ADD IsRedeemed BIT DEFAULT 0,
    RedeemedAt DATETIME NULL,
    OrderId VARCHAR(50) NULL;
```

### 3. Expiration Dates
Add expiration logic to coupons:
```sql
ALTER TABLE LandingSubscriptions
ADD CouponExpiresAt DATETIME DEFAULT DATEADD(DAY, 30, GETDATE());
```

### 4. Email Templates
Create reusable email templates with your email service configuration.

---

## 🐛 Troubleshooting

### Issue: Email not sending
**Solution:**
1. Check SMTP credentials in `.env`
2. Verify SMTP_PORT is correct (587 for TLS, 465 for SSL)
3. Check console logs for detailed error messages
4. Test with Ethereal email first

### Issue: Duplicate coupon codes
**Solution:**
The current implementation uses `crypto.randomBytes(3)` which generates 16.7 million unique combinations. For additional safety:
1. Add a unique index on CouponCode column
2. Implement retry logic if duplicate is detected

### Issue: Email goes to spam
**Solution:**
1. Use authenticated SMTP server
2. Configure SPF/DKIM records for your domain
3. Use a professional email service (SendGrid, AWS SES, Mailgun)

---

## 📦 Dependencies

Already installed in `package.json`:
- ✅ `nodemailer` - Email sending
- ✅ `mssql` - SQL Server connectivity
- ✅ `crypto` - Node.js built-in (coupon generation)

---

## 🎯 Summary

✅ Coupon code feature is fully functional
✅ Automatic generation on registration
✅ Email delivery with beautiful template
✅ Database storage for tracking
✅ Duplicate email prevention
✅ API returns coupon in response

**Configuration Needed:**
- Set up SMTP credentials in `.env` file
- Test with Ethereal or Gmail
- Verify email delivery

**Ready to use!** 🚀
