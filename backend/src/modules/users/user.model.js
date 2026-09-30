import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Hidden by default when querying
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['USER', 'VERIFIER', 'ADMIN', 'SUPPORT'],
      default: 'USER',
      index: true,
    },
    // Pluggable identity support (e.g. Clerk / OAuth)
    externalAuthId: {
      type: String,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['jwt', 'clerk', 'google'],
      default: 'jwt',
    },
    // Fraud prevention & reputation
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
