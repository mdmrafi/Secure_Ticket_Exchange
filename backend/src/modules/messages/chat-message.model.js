import mongoose from 'mongoose';

export const MessageDeliveryStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
};

export const MessageContextType = {
  TRANSACTION: 'TRANSACTION',
  LISTING: 'LISTING',
  DISPUTE: 'DISPUTE',
  DIRECT: 'DIRECT',
};

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      trim: true,
      index: true,
    },
    contextType: {
      type: String,
      enum: Object.values(MessageContextType),
      required: [true, 'Context type is required'],
      index: true,
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Context ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(MessageDeliveryStatus),
      default: MessageDeliveryStatus.SENT,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
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

// Indexes for high performance querying
chatMessageSchema.index({ roomId: 1, createdAt: 1 });
chatMessageSchema.index({ contextType: 1, contextId: 1, createdAt: 1 });
chatMessageSchema.index({ recipientId: 1, status: 1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
