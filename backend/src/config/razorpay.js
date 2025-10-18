const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if we have real Razorpay credentials
const hasRealCredentials = process.env.RAZORPAY_KEY_ID && 
                          process.env.RAZORPAY_KEY_SECRET && 
                          process.env.RAZORPAY_KEY_ID.startsWith('rzp_');

let razorpay;

if (hasRealCredentials) {
  // Initialize Razorpay with real credentials
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized with real credentials');
} else {
  // Mock Razorpay for development
  console.log('⚠️  Using Razorpay development mock (no real payments)');
  razorpay = null;
}

// Create Razorpay order
const createRazorpayOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    console.log('🔄 Creating Razorpay order:', { amount, currency, receipt });

    if (!razorpay) {
      // Enhanced mock order for development
      console.log('🔧 Creating mock Razorpay order...');
      
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount for order creation');
      }
      
      const mockOrder = {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        entity: 'order',
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise
        amount_paid: 0,
        amount_due: Math.round(parseFloat(amount) * 100),
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        offer_id: null,
        status: 'created',
        attempts: 0,
        notes: notes || {},
        created_at: Math.floor(Date.now() / 1000)
      };
      
      console.log('✅ Mock Razorpay order created successfully:', mockOrder.id);
      console.log('   Amount: ₹' + amount);
      console.log('   Receipt:', mockOrder.receipt);
      
      return mockOrder;
    }

    // Real Razorpay order creation
    console.log('🔄 Creating real Razorpay order...');
    
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Amount in paise
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
      payment_capture: 1 // Auto capture payment
    };

    console.log('📤 Sending to Razorpay:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('✅ Real Razorpay order created successfully:', order.id);
    return order;

  } catch (error) {
    console.error('❌ Razorpay order creation error details:');
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Input amount:', amount);
    console.error('   Input currency:', currency);
    console.error('   Input receipt:', receipt);
    
    // Enhanced error handling
    if (error.message && error.message.includes('authentication')) {
      throw new Error('Invalid Razorpay credentials. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
    }
    
    if (error.message && error.message.includes('amount')) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive number`);
    }

    if (error.message && error.message.includes('currency')) {
      throw new Error(`Invalid currency: ${currency}. Currency must be a valid code like INR`);
    }
    
    // Re-throw the original error with more context
    throw new Error(`Razorpay order creation failed: ${error.message}`);
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'development_mode') {
      console.log('⚠️  Payment signature verification skipped (development mode)');
      return true; // Accept all payments in development
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = expectedSignature === signature;
    console.log(isValid ? '✅ Payment signature verified' : '❌ Payment signature verification failed');
    
    return isValid;
  } catch (error) {
    console.error('Payment signature verification failed:', error);
    return false;
  }
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  try {
    if (!razorpay) {
      // Return mock payment for development
      console.log('🔧 Fetching mock payment:', paymentId);
      
      return {
        id: paymentId,
        entity: 'payment',
        amount: 100000, // ₹1000 in paise
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
        bank: null,
        wallet: null,
        vpa: 'user@paytm',
        card: null,
        fee: 2360, // Example fee in paise
        tax: 360   // Example tax in paise
      };
    }

    console.log('📤 Fetching real payment from Razorpay:', paymentId);
    const payment = await razorpay.payments.fetch(paymentId);
    console.log('✅ Payment fetched successfully');
    
    return payment;
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    throw error;
  }
};

// Create refund
const createRefund = async (paymentId, amount = null, notes = {}) => {
  try {
    if (!razorpay) {
      // Return mock refund for development
      console.log('🔧 Creating mock refund for payment:', paymentId);
      
      return {
        id: `rfnd_mock_${Date.now()}`,
        entity: 'refund',
        amount: amount ? Math.round(parseFloat(amount) * 100) : 100000,
        currency: 'INR',
        payment_id: paymentId,
        status: 'processed',
        notes: notes || {},
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    console.log('📤 Creating real refund with Razorpay');
    
    const refundData = {
      notes: notes || {},
      ...(amount && { amount: Math.round(parseFloat(amount) * 100) })
    };

    const refund = await razorpay.payments.refund(paymentId, refundData);
    console.log('✅ Refund created successfully:', refund.id);
    
    return refund;
  } catch (error) {
    console.error('Refund creation failed:', error);
    throw error;
  }
};

module.exports = {
  razorpay,
  verifyPaymentSignature,
  createRazorpayOrder,
  fetchPayment,
  createRefund
};
