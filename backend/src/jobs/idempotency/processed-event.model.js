import mongoose from 'mongoose';

export const ProcessedEventStatus = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
});

const processedEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ProcessedEventStatus),
      default: ProcessedEventStatus.PROCESSING,
      index: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring an event can only be completed once per job
processedEventSchema.index({ eventId: 1, jobId: 1 }, { unique: true });

export const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);
