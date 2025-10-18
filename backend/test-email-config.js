/**
 * Test Email Configuration
 * Verifies SMTP connection and sends a test email
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n🔍 Testing Email Configuration');
console.log('=' .repeat(60));

// Display configuration (hide password)
console.log('\n📧 SMTP Configuration:');
console.log('Host:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('Port:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('User:', process.env.SMTP_USER || '❌ NOT SET');
console.log('Pass:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('=' .repeat(60));

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test 1: Verify connection
async function testConnection() {
  console.log('\n🧪 Test 1: Verify SMTP Connection');
  console.log('-'.repeat(60));
  
  try {
    await transporter.verify();
    console.log('✅ SUCCESS: Email server is ready to send messages!');
    return true;
  } catch (error) {
    console.error('❌ FAILED: Email server connection failed');
    console.error('Error:', error.message);
    console.error('\n💡 Common Issues:');
    console.error('   - Check if SMTP credentials are correct in .env');
    console.error('   - For Gmail, use App Password, not regular password');
    console.error('   - Verify SMTP_HOST and SMTP_PORT are correct');
    console.error('   - Check if your firewall is blocking port', process.env.SMTP_PORT);
    return false;
  }
}

// Test 2: Send test email
async function testSendEmail() {
  console.log('\n🧪 Test 2: Send Test Email');
  console.log('-'.repeat(60));
  
  try {
    const info = await transporter.sendMail({
      from: `"5ELM Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '🎉 Test Email - 5ELM Backend',
      html: `
        <div style="font-family:Arial,sans-serif;padding:15px">
          <h2>✅ Email Configuration Successful!</h2>
          <p>This is a test email from your 5ELM backend.</p>
          <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
          <p><strong>From:</strong> ${process.env.SMTP_USER}</p>
          <p style="margin-top: 20px; color: #555C4A;">
            <em>If you received this email, your email configuration is working perfectly! 🎊</em>
          </p>
        </div>
      `,
    });
    
    console.log('✅ SUCCESS: Test email sent!');
    console.log('Message ID:', info.messageId);
    console.log('📬 Check your inbox:', process.env.SMTP_USER);
    return true;
  } catch (error) {
    console.error('❌ FAILED: Could not send test email');
    console.error('Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n🚀 Starting Email Configuration Tests...\n');
  
  // Check if env variables are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ ERROR: SMTP environment variables are not set!');
    console.error('\n📝 Please add these to your .env file:');
    console.error('   SMTP_HOST=smtp.gmail.com');
    console.error('   SMTP_PORT=587');
    console.error('   SMTP_USER=your-email@gmail.com');
    console.error('   SMTP_PASS=your-app-password');
    process.exit(1);
  }
  
  // Test connection
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    console.log('\n' + '=' .repeat(60));
    console.log('❌ Tests failed. Fix the connection issue first.');
    console.log('=' .repeat(60));
    process.exit(1);
  }
  
  // Test sending email
  await testSendEmail();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ All email configuration tests completed!');
  console.log('=' .repeat(60));
  console.log('\n📧 Your email setup is ready for production!\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
