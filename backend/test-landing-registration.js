// Test Landing Page Registration Endpoint
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

// Test data
const testVisitor = {
  firstName: 'John',
  lastName: 'Doe',
  email: `test${Date.now()}@example.com`, // Unique email to avoid duplicates
  phone: '+1234567890',
  consent: true
};

async function testRegistration() {
  console.log('🧪 Testing Landing Page Visitor Registration\n');
  console.log('📋 Test Data:', JSON.stringify(testVisitor, null, 2));
  console.log('\n🌐 API Endpoint:', `${API_URL}/landing/register\n`);

  try {
    // Test 1: Register new visitor
    console.log('📝 Test 1: Registering new visitor...');
    const response = await axios.post(`${API_URL}/landing/register`, testVisitor);
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log(`Status Code: ${response.status}\n`);

    // Test 2: Try to register with same email (should return "already registered")
    console.log('📝 Test 2: Attempting duplicate registration...');
    const duplicateResponse = await axios.post(`${API_URL}/landing/register`, testVisitor);
    
    console.log('✅ Duplicate check working!');
    console.log('Response:', JSON.stringify(duplicateResponse.data, null, 2));
    console.log(`Status Code: ${duplicateResponse.status}\n`);

    // Test 3: Test validation (missing required fields)
    console.log('📝 Test 3: Testing validation (missing email)...');
    try {
      await axios.post(`${API_URL}/landing/register`, {
        firstName: 'Jane',
        lastName: 'Doe'
        // email missing
      });
    } catch (validationError) {
      if (validationError.response) {
        console.log('✅ Validation working!');
        console.log('Response:', JSON.stringify(validationError.response.data, null, 2));
        console.log(`Status Code: ${validationError.response.status}\n`);
      } else {
        throw validationError;
      }
    }

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:');
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection Error: Cannot connect to server');
      console.error('💡 Make sure the backend server is running on', API_URL);
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Alternative: Test with curl command
function printCurlCommands() {
  console.log('\n📘 Alternative: Test with curl commands:\n');
  
  console.log('1️⃣ Register new visitor:');
  console.log(`curl -X POST ${API_URL}/landing/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "consent": true
  }'
`);

  console.log('2️⃣ Register without phone (optional field):');
  console.log(`curl -X POST ${API_URL}/landing/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "consent": true
  }'
`);

  console.log('3️⃣ Test validation error (missing email):');
  console.log(`curl -X POST ${API_URL}/landing/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Test",
    "lastName": "User"
  }'
`);
}

// Run tests
console.log('═══════════════════════════════════════════════════════════');
console.log('   Landing Page Registration - API Test Suite');
console.log('═══════════════════════════════════════════════════════════\n');

testRegistration().then(() => {
  printCurlCommands();
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Test Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
