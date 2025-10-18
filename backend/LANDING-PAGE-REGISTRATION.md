# Landing Page Visitor Registration - SQL Server Integration

## ✅ Implementation Complete

The landing page visitor registration feature has been successfully integrated with SQL Server.

## 📁 Files Modified/Created

### 1. Controller
**File**: `/backend/src/controllers/landingController.js`
- ✅ Imported `sql` from sqlserver config
- ✅ Added `registerVisitorSQL` handler
- ✅ Exported new function

### 2. Routes
**File**: `/backend/src/routes/landingRoutes.js`
- ✅ Added POST `/api/v1/landing/register` endpoint
- ✅ Connected to `registerVisitorSQL` controller
- ✅ Kept legacy `/lead` route for compatibility

### 3. Database Schema
**File**: `/backend/sql/create-landing-subscriptions-table.sql`
- ✅ SQL script to create `LandingSubscriptions` table
- ✅ Includes all necessary fields and indexes
- ✅ Automatic timestamp updates

### 4. Test Suite
**File**: `/backend/test-landing-registration.js`
- ✅ Automated test script
- ✅ Tests registration, duplicates, and validation
- ✅ Includes curl command examples

## 📊 Database Table Structure

### LandingSubscriptions Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| Id | INT (Identity) | No | Primary Key |
| FirstName | NVARCHAR(100) | No | Visitor's first name |
| LastName | NVARCHAR(100) | No | Visitor's last name |
| Email | NVARCHAR(255) | No | Email (Unique) |
| Phone | NVARCHAR(20) | Yes | Phone number (optional) |
| Consent | BIT | No | Marketing consent |
| CreatedAt | DATETIME | No | Registration date |
| UpdatedAt | DATETIME | No | Last update date |
| IsActive | BIT | No | Active status |
| Source | NVARCHAR(50) | Yes | Traffic source |
| IPAddress | NVARCHAR(50) | Yes | IP address (future use) |
| UserAgent | NVARCHAR(500) | Yes | Browser info (future use) |
| ReferralSource | NVARCHAR(200) | Yes | Referral info (future use) |

### Indexes
- Primary Key on `Id`
- Unique constraint on `Email`
- Index on `Email` for fast lookups
- Index on `CreatedAt` for reporting

## 🚀 Setup Instructions

### Step 1: Create Database Table

Run the SQL script on your SQL Server:

```bash
# Option 1: Using SQL Server Management Studio (SSMS)
# 1. Open SSMS and connect to 103.174.102.61
# 2. Open the file: backend/sql/create-landing-subscriptions-table.sql
# 3. Execute the script

# Option 2: Using sqlcmd
sqlcmd -S 103.174.102.61 -U FiveELMUser -P "FiveELM@@2017##" -d FiveELMECommerce -i backend/sql/create-landing-subscriptions-table.sql
```

### Step 2: Verify Table Creation

```sql
USE FiveELMECommerce;
GO

-- Check if table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'LandingSubscriptions';

-- View table structure
EXEC sp_help 'LandingSubscriptions';

-- Check for records
SELECT COUNT(*) AS TotalSubscriptions FROM LandingSubscriptions;
```

### Step 3: Test the Backend

```bash
cd /Applications/5elmecommerce/fullstack-ecommerce/backend

# Start the backend server
npm run dev

# In another terminal, run the test
node test-landing-registration.js
```

## 📡 API Endpoint

### Register Visitor

**Endpoint**: `POST /api/v1/landing/register`

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "consent": true
}
```

**Required Fields**:
- `firstName` (string)
- `lastName` (string)
- `email` (string, must be valid email)

**Optional Fields**:
- `phone` (string)
- `consent` (boolean, defaults to false)

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Visitor registered successfully!"
}
```

**Duplicate Email Response** (200 OK):
```json
{
  "success": true,
  "message": "Email already registered, but welcome back!"
}
```

**Validation Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "First name, last name, and email are required."
}
```

**Server Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "message": "Internal server error during registration.",
  "error": "Error details..."
}
```

## 🧪 Testing

### Using the Test Script

```bash
cd backend
node test-landing-registration.js
```

The test script will:
1. Register a new visitor with unique email
2. Attempt duplicate registration (should succeed with welcome message)
3. Test validation with missing required fields

### Using curl

```bash
# Test 1: Register new visitor
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "consent": true
  }'

# Test 2: Without phone (optional field)
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "consent": true
  }'

# Test 3: Validation error (missing email)
curl -X POST http://localhost:5000/api/v1/landing/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Using Postman

1. Create new request: `POST http://localhost:5000/api/v1/landing/register`
2. Set Headers: `Content-Type: application/json`
3. Set Body (raw JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "consent": true
}
```
4. Click Send

## 📊 Database Queries

### View All Subscriptions
```sql
SELECT * FROM LandingSubscriptions 
ORDER BY CreatedAt DESC;
```

### Count Total Subscriptions
```sql
SELECT COUNT(*) AS TotalSubscriptions 
FROM LandingSubscriptions;
```

### Today's Subscriptions
```sql
SELECT * FROM LandingSubscriptions 
WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY CreatedAt DESC;
```

### Subscriptions with Consent
```sql
SELECT * FROM LandingSubscriptions 
WHERE Consent = 1
ORDER BY CreatedAt DESC;
```

### Subscriptions by Date Range
```sql
SELECT 
    CAST(CreatedAt AS DATE) AS Date,
    COUNT(*) AS Subscriptions
FROM LandingSubscriptions
WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
GROUP BY CAST(CreatedAt AS DATE)
ORDER BY Date DESC;
```

### Find Specific Email
```sql
SELECT * FROM LandingSubscriptions 
WHERE Email = 'john.doe@example.com';
```

### Export to CSV (for reports)
```sql
SELECT 
    Id,
    FirstName,
    LastName,
    Email,
    Phone,
    CASE WHEN Consent = 1 THEN 'Yes' ELSE 'No' END AS MarketingConsent,
    FORMAT(CreatedAt, 'yyyy-MM-dd HH:mm:ss') AS RegistrationDate
FROM LandingSubscriptions
ORDER BY CreatedAt DESC;
```

## 🔒 Security Features

1. **Parameterized Queries**: Prevents SQL injection
2. **Input Validation**: Required fields checked
3. **Duplicate Prevention**: Email uniqueness enforced
4. **Consent Tracking**: GDPR compliance ready
5. **Error Handling**: Graceful error messages

## 🎯 Features

- ✅ SQL Server integration
- ✅ Duplicate email detection
- ✅ Optional phone field
- ✅ Consent tracking (GDPR ready)
- ✅ Automatic timestamps
- ✅ Indexed for performance
- ✅ Error handling
- ✅ Validation
- ✅ Test suite included

## 🔄 Future Enhancements

Potential additions:
1. **Email Verification**: Send confirmation email
2. **Welcome Email**: Automated welcome sequence
3. **Analytics**: Track conversion sources
4. **IP Tracking**: Store visitor IP for analytics
5. **User Agent**: Track browser/device info
6. **Unsubscribe**: Allow users to opt-out
7. **Admin Dashboard**: View and manage subscriptions
8. **Export Feature**: Download as CSV/Excel
9. **Duplicate Handling**: Merge or update existing records
10. **Webhook Integration**: Notify external services

## 📞 Support

If you encounter any issues:

1. **Check SQL Server Connection**:
   ```bash
   node test-sql-connection.js
   ```

2. **Verify Table Exists**:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_NAME = 'LandingSubscriptions';
   ```

3. **Check Logs**:
   - Backend console output
   - SQL Server error logs

4. **Test Endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

## 📚 Related Files

- Controller: `/backend/src/controllers/landingController.js`
- Routes: `/backend/src/routes/landingRoutes.js`
- Config: `/backend/src/config/sqlserver.js`
- SQL Schema: `/backend/sql/create-landing-subscriptions-table.sql`
- Test: `/backend/test-landing-registration.js`
- Documentation: This file

---

**Landing Page Registration is ready to use! 🎉**
