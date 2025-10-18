const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment Identifiers
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true // Allow null but unique when present
  },
  razorpaySignature: {
    type: String
  },

  // 5ELM Order Reference
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'created'
  },

  // Payment Method Details
  method: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'paylater']
  },
  bank: String,
  wallet: String,
  vpa: String, // UPI ID
  cardNetwork: String,
  cardType: String,

  // Transaction Details
  fee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  serviceCharge: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  capturedAt: Date,
  failedAt: Date,

  // Error Details
  errorCode: String,
  errorDescription: String,
  errorSource: String,
  errorStep: String,
  errorReason: String,

  // Refund Information
  refunds: [{
    refundId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    },
    reason: String,
    notes: mongoose.Schema.Types.Mixed,
    processedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Payment Notes & Metadata
  notes: mongoose.Schema.Types.Mixed,
  description: String,

  // Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,

  // Analytics
  analytics: {
    userAgent: String,
    ipAddress: String,
    deviceType: String,
    paymentFlow: String,
    attemptCount: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds
    .filter(refund => refund.status === 'processed')
    .reduce((total, refund) => total + refund.amount, 0);
});

// Virtual for refund status
paymentSchema.virtual('refundStatus').get(function() {
  const totalRefunded = this.totalRefunded;
  if (totalRefunded === 0) return 'none';
  if (totalRefunded >= this.amount) return 'full';
  return 'partial';
});

// Virtual for net amount after refunds
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefunded;
});

// Method to add refund
paymentSchema.methods.addRefund = function(refundData) {
  this.refunds.push(refundData);
  
  // Update payment status based on refund amount
  const totalRefunded = this.totalRefunded;
  if (totalRefunded >= this.amount) {
    this.status = 'refunded';
  } else if (totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        successfulAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  // Get method breakdown
  const methodStats = await this.aggregate([
    { $match: { ...matchStage, status: 'paid' } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { amount: -1 } }
  ]);

  return {
    overview: stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      successfulAmount: 0,
      failedPayments: 0,
      averageAmount: 0
    },
    methodBreakdown: methodStats,
    successRate: stats[0] ? (stats[0].successfulPayments / stats[0].totalPayments * 100) : 0
  };
};

module.exports = mongoose.model('Payment', paymentSchema);
