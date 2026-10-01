import mongoose from 'mongoose';

export const ReservationStatus = {
  ACTIVE: 'ACTIVE',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
};

const reservationSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer ID is required'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.ACTIVE,
      index: true,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    releaseReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Release reason cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
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

// Database Indexes

// 1. Enforce rule: only one active reservation can exist per listing (atomicity against race conditions)
reservationSchema.index(
  { listingId: 1 },
  {
    unique: true,
    name: 'unique_active_reservation_per_listing',
    partialFilterExpression: { status: ReservationStatus.ACTIVE },
  }
);

// 2. Query buyer's active reservations
reservationSchema.index({ buyerId: 1, status: 1 });

// 3. Query stale reservations for cleanup / TTL jobs
reservationSchema.index({ status: 1, expiresAt: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
