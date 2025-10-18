# SQL Server Quick Reference Guide

## ✅ SQL Server Integration Status

**Status**: ✅ Configured | ⚠️ Authentication Issue
**Files Created**:
- `/backend/src/config/sqlserver.js` - Connection configuration
- `/backend/test-sql-connection.js` - Basic connection test
- `/backend/diagnose-sql-connection.js` - Advanced diagnostics
- `/backend/.env` - Environment variables with your credentials

## 🔧 Configuration

### Current Credentials
```
Server: 103.174.102.61
User: FiveELMUser
Password: FiveELM@@2017##
Database: master
Port: 1433 (default)
```

### Environment Variables (.env)
```env
SQL_SERVER=103.174.102.61
SQL_USER=FiveELMUser
SQL_PASSWORD=FiveELM@@2017##
SQL_DATABASE=master
SQL_ENCRYPT=false
SQL_TRUST_CERT=true
```

## 🚀 Quick Start

### 1. Test Connection
```bash
cd backend
node test-sql-connection.js
```

### 2. Run Diagnostics
```bash
node diagnose-sql-connection.js
```

### 3. Start Server
```bash
npm run dev
```

## 💻 Usage Examples

### Import SQL Server Module
```javascript
const { executeQuery, executeStoredProcedure, getSQLPool, sql } = require('./src/config/sqlserver');
```

### Example 1: Simple SELECT Query
```javascript
const { executeQuery } = require('./src/config/sqlserver');

// Get all users
const result = await executeQuery('SELECT * FROM Users');
console.log(result.recordset); // Array of records
```

### Example 2: Parameterized Query (Safe from SQL Injection)
```javascript
// Get user by email
const result = await executeQuery(
  'SELECT * FROM Users WHERE email = @email',
  { email: 'user@example.com' }
);

// Multiple parameters
const result = await executeQuery(
  'SELECT * FROM Products WHERE category = @category AND price < @maxPrice',
  { 
    category: 'Electronics',
    maxPrice: 1000 
  }
);
```

### Example 3: INSERT Data
```javascript
const result = await executeQuery(`
  INSERT INTO Users (name, email, password, createdAt)
  VALUES (@name, @email, @password, GETDATE())
`,
{
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedPassword123'
});

console.log('Rows affected:', result.rowsAffected[0]);
```

### Example 4: UPDATE Data
```javascript
const result = await executeQuery(`
  UPDATE Users 
  SET name = @name, updatedAt = GETDATE()
  WHERE id = @id
`,
{
  id: 123,
  name: 'Jane Doe'
});
```

### Example 5: DELETE Data
```javascript
const result = await executeQuery(
  'DELETE FROM Users WHERE id = @id',
  { id: 123 }
);
```

### Example 6: JOIN Queries
```javascript
const result = await executeQuery(`
  SELECT 
    u.id,
    u.name,
    u.email,
    o.orderNumber,
    o.totalAmount
  FROM Users u
  INNER JOIN Orders o ON u.id = o.userId
  WHERE u.id = @userId
`,
{
  userId: 123
});
```

### Example 7: Execute Stored Procedure
```javascript
const { executeStoredProcedure } = require('./src/config/sqlserver');

const result = await executeStoredProcedure('sp_GetUserOrders', {
  userId: 123,
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

console.log(result.recordset);
```

### Example 8: Transaction
```javascript
const { getSQLPool, sql } = require('./src/config/sqlserver');

const pool = getSQLPool();
const transaction = pool.transaction();

try {
  await transaction.begin();
  
  const request = transaction.request();
  
  // First query
  await request
    .input('userId', sql.Int, 123)
    .query('UPDATE Users SET balance = balance - 100 WHERE id = @userId');
  
  // Second query
  await request
    .input('orderId', sql.Int, 456)
    .query('INSERT INTO Orders (userId, amount) VALUES (@userId, 100)');
  
  await transaction.commit();
  console.log('Transaction completed successfully');
} catch (error) {
  await transaction.rollback();
  console.error('Transaction failed:', error);
}
```

### Example 9: Using SQL Data Types
```javascript
const { getSQLPool, sql } = require('./src/config/sqlserver');

const pool = getSQLPool();
const request = pool.request();

request.input('id', sql.Int, 123);
request.input('name', sql.VarChar(255), 'John Doe');
request.input('email', sql.VarChar(255), 'john@example.com');
request.input('age', sql.TinyInt, 25);
request.input('salary', sql.Decimal(10, 2), 50000.50);
request.input('isActive', sql.Bit, true);
request.input('createdAt', sql.DateTime, new Date());

const result = await request.query(`
  INSERT INTO Users (id, name, email, age, salary, isActive, createdAt)
  VALUES (@id, @name, @email, @age, @salary, @isActive, @createdAt)
`);
```

## 📝 Complete Controller Example

```javascript
// src/controllers/userController.js
const { executeQuery, sql } = require('../config/sqlserver');

// GET all users
exports.getUsers = async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Users ORDER BY createdAt DESC');
    
    res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM Users WHERE id = @id',
      { id: req.params.id }
    );
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// CREATE new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id FROM Users WHERE email = @email',
      { email }
    );
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user
    const result = await executeQuery(`
      INSERT INTO Users (name, email, password, createdAt)
      OUTPUT INSERTED.*
      VALUES (@name, @email, @password, GETDATE())
    `,
    {
      name,
      email,
      password // Should be hashed before this point
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const { id } = req.params;
    
    const result = await executeQuery(`
      UPDATE Users 
      SET name = @name, email = @email, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `,
    {
      id,
      name,
      email
    });
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const result = await executeQuery(
      'DELETE FROM Users WHERE id = @id',
      { id: req.params.id }
    );
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

module.exports = exports;
```

## 🛡️ Security Best Practices

### 1. Always Use Parameterized Queries
```javascript
// ❌ BAD - Vulnerable to SQL injection
const result = await executeQuery(`SELECT * FROM Users WHERE email = '${email}'`);

// ✅ GOOD - Safe from SQL injection
const result = await executeQuery('SELECT * FROM Users WHERE email = @email', { email });
```

### 2. Hash Passwords
```javascript
const bcrypt = require('bcryptjs');

// Hash password before storing
const hashedPassword = await bcrypt.hash(password, 12);

await executeQuery(`
  INSERT INTO Users (email, password) 
  VALUES (@email, @password)
`,
{
  email,
  password: hashedPassword
});
```

### 3. Use Transactions for Critical Operations
```javascript
const pool = getSQLPool();
const transaction = pool.transaction();

try {
  await transaction.begin();
  // Multiple related operations
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## ⚠️ Current Issue: Login Failed

**Error**: Login failed for user 'FiveELMUser'

**To Fix**:
1. Contact your DBA to verify credentials
2. Check SQL Server authentication mode
3. Ensure user has proper database permissions
4. Verify firewall allows connections
5. Test with SSMS first

## 📚 SQL Data Types Reference

```javascript
sql.Bit           // Boolean
sql.TinyInt       // 0-255
sql.SmallInt      // -32,768 to 32,767
sql.Int           // -2^31 to 2^31-1
sql.BigInt        // -2^63 to 2^63-1
sql.Decimal(p, s) // Decimal numbers
sql.Float         // Floating point
sql.Real          // Floating point (smaller)
sql.VarChar(n)    // Variable-length string
sql.NVarChar(n)   // Unicode string
sql.Text          // Large text
sql.Date          // Date only
sql.DateTime      // Date and time
sql.DateTime2     // Date and time (higher precision)
sql.Time          // Time only
sql.UniqueIdentifier // GUID
sql.VarBinary     // Binary data
```

---

**Once authentication is resolved, your backend will be fully integrated with SQL Server! 🚀**
