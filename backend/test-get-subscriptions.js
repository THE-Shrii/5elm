/**
 * Test script for GET /api/v1/landing/subscriptions endpoint
 * Tests fetching all landing page registrations from SQL Server
 */

const BASE_URL = 'http://localhost:5000/api/v1/landing';

/**
 * Test 1: Fetch all subscriptions
 */
async function testGetSubscriptions() {
  console.log('\n🧪 Test 1: Fetch All Subscriptions');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ SUCCESS: Retrieved', data.count, 'subscriptions');
      if (data.count > 0) {
        console.log('\n📊 Sample subscription:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 Starting Landing Subscriptions GET Endpoint Tests');
  console.log('=' .repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Endpoint: GET /subscriptions');
  console.log('=' .repeat(60));

  await testGetSubscriptions();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Tests completed!');
  console.log('=' .repeat(60));
}

// Run tests
runTests();

/**
 * MANUAL TESTING WITH CURL:
 * 
 * Test 1: Get all subscriptions
 * curl -X GET http://localhost:5000/api/v1/landing/subscriptions
 * 
 * Test 2: Get all subscriptions (formatted output)
 * curl -X GET http://localhost:5000/api/v1/landing/subscriptions | json_pp
 */
