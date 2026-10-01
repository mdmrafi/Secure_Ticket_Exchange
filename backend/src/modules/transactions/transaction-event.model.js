import mongoose from 'mongoose';

export const TransactionEventType = {
  TRANSACTION_INITIATED: 'TRANSACTION_INITIATED',
  PAYMENT_SESSION_CREATED: 'PAYMENT_SESSION_CREATED',
  PAYMENT_AUTHORIZED: 'PAYMENT_AUTHORIZED',
  PAYMENT_PAID: 'PAYMENT_PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  TRANSFER_PENDING: 'TRANSFER_PENDING',
  TRANSACTION_COMPLETED: 'TRANSACTION_COMPLETED',
  TRANSACTION_CANCELLED: 'TRANSACTION_CANCELLED',
  TRANSACTION_DISPUTED: 'TRANSACTION_DISPUTED',
  DUPLICATE_CALLBACK_IGNORED: 'DUPLICATE_CALLBACK_IGNORED',
};

const transactionEventSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: Object.values(TransactionEventType),
      index: true,
    },
    fromTransactionStatus: {
      type: String,
      required: true,
    },
    toTransactionStatus: {
      type: String,
      required: true,
    },
    fromPaymentStatus: {
      type: String,
      required: true,
    },
    toPaymentStatus: {
      type: String,
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['BUYER', 'SELLER', 'ADMIN', 'SYSTEM', 'PAYMENT_PROVIDER'],
      default: 'SYSTEM',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Event logs are append-only with createdAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
transactionEventSchema.index({ transactionId: 1, createdAt: 1 });

// Strictly prevent updates or deletions to guarantee immutability
transactionEventSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    const error = new Error(
      'Transaction audit event logs are strictly immutable and cannot be updated or deleted.'
    );
    next(error);
  }
);

export const TransactionEvent = mongoose.model('TransactionEvent', transactionEventSchema);
