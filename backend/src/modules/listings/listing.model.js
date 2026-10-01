import mongoose from 'mongoose';
import { ListingStatus } from '../../common/constants/asset-types.constant.js';

const listingSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required'],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      index: true,
    },
    askingPrice: {
      type: Number,
      required: [true, 'Asking price is required'],
      min: [0, 'Asking price cannot be negative'],
    },
    originalFaceValue: {
      type: Number,
      default: 0,
      min: [0, 'Original face value cannot be negative'],
    },
    currency: {
      type: String,
      default: 'BDT',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          ListingStatus.DRAFT,
          ListingStatus.ACTIVE,
          ListingStatus.RESERVED,
          ListingStatus.SOLD,
          ListingStatus.CANCELLED,
          ListingStatus.EXPIRED,
          ListingStatus.SUSPENDED,
          'PENDING_ESCROW',
          'COMPLETED',
        ],
        message: '{VALUE} is not a valid listing status',
      },
      default: ListingStatus.ACTIVE,
      index: true,
    },
    isEscrowProtected: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
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

// Virtual field for backward compatibility with 'price'
listingSchema
  .virtual('price')
  .get(function () {
    return this.askingPrice;
  })
  .set(function (val) {
    this.askingPrice = val;
  });

// Pre-validate hook to harmonize askingPrice and price
listingSchema.pre('validate', function (next) {
  if (this.askingPrice == null && this.get('price') != null) {
    this.askingPrice = this.get('price');
  }
  if (!this.originalFaceValue && this.askingPrice) {
    this.originalFaceValue = this.askingPrice;
  }
  next();
});

// Database indexes for common search operations

// 1. Enforce business rule: same asset cannot have multiple active/reserved listings (atomicity against race conditions)
listingSchema.index(
  { assetId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [ListingStatus.ACTIVE, ListingStatus.RESERVED, 'PENDING_ESCROW'] },
    },
  }
);

// 2. Default marketplace browsing: status + newest first
listingSchema.index({ status: 1, createdAt: -1 });

// 3. Status + price sorting & range filtering
listingSchema.index({ status: 1, askingPrice: 1 });
listingSchema.index({ status: 1, askingPrice: -1 });

// 4. Status + expiresAt for active listings expiration queries
listingSchema.index({ status: 1, expiresAt: 1 });

// 5. Seller listings lookups: sellerId + status + createdAt
listingSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

// 6. Currency filtering
listingSchema.index({ status: 1, currency: 1 });

export const Listing = mongoose.model('Listing', listingSchema);
