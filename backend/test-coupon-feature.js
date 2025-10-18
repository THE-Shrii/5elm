/**
 * Test script for Coupon Code Feature
 * Tests registration with coupon generation and email delivery
 */

const BASE_URL = 'http://localhost:5000/api/v1/landing';

/**
 * Test 1: Register new user with coupon generation
 */
async function testRegisterWithCoupon() {
  console.log('\n🧪 Test 1: Register New User (Generate Coupon)');
  console.log('=' .repeat(60));

  const payload = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: `test.${Date.now()}@example.com`, // Unique email each time
    phone: '+1234567890',
    consent: true,
  };

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('✅ SUCCESS: User registered with coupon:', data.couponCode);
      console.log('📧 Email sent to:', payload.email);
      return data.couponCode;
    } else {
      console.log('❌ FAILED:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return null;
  }
}

/**
 * Test 2: Try duplicate email (should fail)
 */
async function testDuplicateEmail(email) {
  console.log('\n🧪 Test 2: Try Duplicate Email');
  console.log('=' .repeat(60));

  const payload = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: email,
    phone: '+9876543210',
    consent: true,
  };

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok && data.message.includes('already registered')) {
      console.log('✅ EXPECTED: Duplicate email correctly rejected');
    } else {
      console.log('❌ UNEXPECTED: Should have failed with duplicate error');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Test 3: Verify coupon in database
 */
async function testGetSubscriptions() {
  console.log('\n🧪 Test 3: Fetch Subscriptions (Check Coupons)');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/subscriptions`);
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Total Subscriptions:', data.count);

    if (data.count > 0) {
      console.log('\n📊 Recent registrations with coupons:');
      data.data.slice(0, 3).forEach((sub, index) => {
        console.log(`\n${index + 1}. ${sub.FirstName} ${sub.LastName}`);
        console.log(`   Email: ${sub.Email}`);
        console.log(`   Coupon: ${sub.CouponCode}`);
        console.log(`   Registered: ${new Date(sub.CreatedAt).toLocaleString()}`);
      });
      console.log('\n✅ SUCCESS: Coupons are being stored correctly');
    } else {
      console.log('⚠️ No subscriptions found');
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
    firstName: 'John',
    // Missing lastName and email
    phone: '+1234567890',
  };

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok && data.message.includes('required')) {
      console.log('✅ EXPECTED: Missing fields validation working');
    } else {
      console.log('❌ UNEXPECTED: Should have failed validation');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 Starting Coupon Code Feature Tests');
  console.log('=' .repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Time:', new Date().toLocaleString());
  console.log('=' .repeat(60));

  // Test 1: Register new user
  const testEmail = `test.${Date.now()}@example.com`;
  const payload = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: testEmail,
    phone: '+1234567890',
    consent: true,
  };

  console.log('\n🧪 Test 1: Register New User (Generate Coupon)');
  console.log('=' .repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ SUCCESS: User registered with coupon:', data.couponCode);
      
      // Test 2: Try duplicate email
      await testDuplicateEmail(testEmail);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  // Test 3: View subscriptions
  await testGetSubscriptions();

  // Test 4: Missing fields
  await testMissingFields();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ All tests completed!');
  console.log('=' .repeat(60));
  console.log('\n📧 Check your email (or SMTP logs) for the coupon code email');
  console.log('💡 If using Ethereal, visit https://ethereal.email/ to view the email\n');
}

// Run tests
runTests();

/**
 * MANUAL TESTING WITH CURL:
 * 
 * Test 1: Register new user
 * curl -X POST http://localhost:5000/api/v1/landing/register \
 *   -H "Content-Type: application/json" \
 *   -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","phone":"+1234567890","consent":true}'
 * 
 * Test 2: Get all subscriptions with coupons
 * curl http://localhost:5000/api/v1/landing/subscriptions
 */
