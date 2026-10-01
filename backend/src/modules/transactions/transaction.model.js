import mongoose from 'mongoose';
import {
  TransactionStatus,
  PaymentStatus,
} from '../../common/constants/asset-types.constant.js';

const transactionSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0, 'Transaction amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'BDT',
      uppercase: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PaymentStatus),
        message: '{VALUE} is not a valid payment status',
      },
      default: PaymentStatus.PENDING,
      index: true,
    },
    transactionStatus: {
      type: String,
      enum: {
        values: [
          TransactionStatus.INITIATED,
          TransactionStatus.PAYMENT_PENDING,
          TransactionStatus.PAYMENT_CONFIRMED,
          TransactionStatus.TRANSFER_PENDING,
          TransactionStatus.COMPLETED,
          TransactionStatus.CANCELLED,
          TransactionStatus.DISPUTED,
          'PAYMENT_ESCROWED', // backward compatibility
          'TRANSFERRING', // backward compatibility
          'REFUNDED', // backward compatibility
        ],
        message: '{VALUE} is not a valid transaction status',
      },
      default: TransactionStatus.INITIATED,
      index: true,
    },
    escrowStatus: {
      type: String,
      enum: ['NONE', 'HELD', 'RELEASED', 'REFUNDED'],
      default: 'NONE',
      index: true,
    },
    paymentDetails: {
      provider: { type: String, default: 'mock-payment-gateway' },
      paymentSessionId: { type: String },
      transactionRef: { type: String },
      paidAt: { type: Date, default: null },
      authorizedAt: { type: Date, default: null },
      failureReason: { type: String, default: null },
      refundedAt: { type: Date, default: null },
    },
    disputeReason: {
      type: String,
      trim: true,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual field for backward compatibility with 'status'
transactionSchema
  .virtual('status')
  .get(function () {
    return this.transactionStatus;
  })
  .set(function (val) {
    this.transactionStatus = val;
  });

// Pre-validate hook to synchronize status and transactionStatus
transactionSchema.pre('validate', function (next) {
  if (!this.transactionStatus && this.get('status')) {
    this.transactionStatus = this.get('status');
  }
  next();
});

// Database indexes for fast lookups
transactionSchema.index({ buyerId: 1, transactionStatus: 1, createdAt: -1 });
transactionSchema.index({ sellerId: 1, transactionStatus: 1, createdAt: -1 });
transactionSchema.index({ listingId: 1, transactionStatus: 1 });
transactionSchema.index(
  { 'paymentDetails.paymentSessionId': 1 },
  { sparse: true, name: 'idx_tx_payment_session_id' }
);
transactionSchema.index(
  { 'paymentDetails.transactionRef': 1 },
  { sparse: true, name: 'idx_tx_transaction_ref' }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
