import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never expose passwordHash in queries unless explicitly requested (+passwordHash)
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'ADMIN', 'MODERATOR'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'USER',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'PENDING'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'ACTIVE',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
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
    // Fraud prevention & reputation metrics
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Compare candidate password with stored bcrypt passwordHash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
