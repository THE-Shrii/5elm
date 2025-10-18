/**
 * Test script for Coupon Redeem Endpoint
 * Tests the POST /api/v1/coupons/redeem endpoint
 */

const BASE_URL = 'http://localhost:5000/api/v1/coupons';

/**
 * Test 1: Redeem a valid coupon
 */
async function testRedeemValidCoupon() {
  console.log('\n🧪 Test 1: Redeem Valid Coupon');
  console.log('=' .repeat(60));

  const payload = {
    couponCode: '5ELM-A3F2B1', // Replace with actual coupon from your database
    userId: 'user123', // Replace with actual user ID
    orderAmount: 100
  };

  try {
    const response = await fetch(`${BASE_URL}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ SUCCESS: Coupon redeemed successfully');
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Test 2: Redeem invalid/non-existent coupon
 */
async function testRedeemInvalidCoupon() {
  console.log('\n🧪 Test 2: Redeem Invalid Coupon');
  console.log('=' .repeat(60));

  const payload = {
    couponCode: 'INVALID-CODE',
    userId: 'user123',
    orderAmount: 100
  };

  try {
    const response = await fetch(`${BASE_URL}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('✅ EXPECTED: Invalid coupon rejected');
    } else {
      console.log('❌ UNEXPECTED: Invalid coupon should fail');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Test 3: Redeem already redeemed coupon
 */
async function testRedeemAlreadyUsedCoupon() {
  console.log('\n🧪 Test 3: Redeem Already Used Coupon');
  console.log('=' .repeat(60));

  const payload = {
    couponCode: '5ELM-A3F2B1', // Same code as Test 1
    userId: 'user123',
    orderAmount: 100
  };

  try {
    const response = await fetch(`${BASE_URL}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok && data.message.includes('already')) {
      console.log('✅ EXPECTED: Already redeemed coupon rejected');
    } else {
      console.log('⚠️ Result:', data.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Test 4: Missing required fields
 */
async function testMissingFields() {
  console.log('\n🧪 Test 4: Missing Required Fields');
  console.log('=' .repeat(60));

  const payload = {
    couponCode: '5ELM-A3F2B1'
    // Missing userId and orderAmount
  };

  try {
    const response = await fetch(`${BASE_URL}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('✅ EXPECTED: Missing fields validation working');
    } else {
      console.log('❌ UNEXPECTED: Should fail validation');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 Starting Coupon Redeem Tests');
  console.log('=' .repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Endpoint: POST /redeem');
  console.log('Time:', new Date().toLocaleString());
  console.log('=' .repeat(60));

  await testRedeemValidCoupon();
  await testRedeemInvalidCoupon();
  // await testRedeemAlreadyUsedCoupon(); // Uncomment after first test
  await testMissingFields();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Tests completed!');
  console.log('=' .repeat(60));
  console.log('\n💡 Tips:');
  console.log('   - Replace couponCode with actual codes from your database');
  console.log('   - Check SQL Server to see redeemed status');
  console.log('   - Run: SELECT * FROM LandingSubscriptions WHERE CouponCode IS NOT NULL\n');
}

// Run tests
runTests();

/**
 * MANUAL TESTING WITH CURL:
 * 
 * Test 1: Redeem coupon
 * curl -X POST http://localhost:5000/api/v1/coupons/redeem \
 *   -H "Content-Type: application/json" \
 *   -d '{"couponCode":"5ELM-A3F2B1","userId":"user123","orderAmount":100}'
 * 
 * Test 2: Get all subscriptions with coupons
 * curl http://localhost:5000/api/v1/landing/subscriptions
 */
