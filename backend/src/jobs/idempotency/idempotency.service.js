import { ProcessedEvent, ProcessedEventStatus } from './processed-event.model.js';
import { logger } from '../../config/logger.config.js';

export class IdempotencyService {
  /**
   * Execute a background job step idempotently.
   * If the event has already been successfully processed by this job,
   * returns the cached result without repeating side effects.
   *
   * @param {object} params
   * @param {string} params.eventId
   * @param {string} params.jobId
   * @param {string} params.eventName
   * @param {Function} workFn
   */
  async executeIdempotent({ eventId, jobId, eventName }, workFn) {
    if (!eventId || !jobId) {
      // Fallback for calls lacking unique tracking ID
      return workFn();
    }

    try {
      // 1. Check if previously completed
      const existing = await ProcessedEvent.findOne({ eventId, jobId });
      if (existing && existing.status === ProcessedEventStatus.COMPLETED) {
        logger.info(
          { eventId, jobId, eventName },
          'Idempotency guard: duplicate event execution detected and skipped'
        );
        return {
          duplicate: true,
          skipped: true,
          result: existing.result,
        };
      }

      // 2. Mark as processing or increment attempt count
      if (existing) {
        existing.status = ProcessedEventStatus.PROCESSING;
        existing.attempts += 1;
        await existing.save();
      } else {
        try {
          await ProcessedEvent.create({
            eventId,
            jobId,
            eventName,
            status: ProcessedEventStatus.PROCESSING,
            attempts: 1,
          });
        } catch (err) {
          // Handle concurrent insertion race condition
          if (err.code === 11000) {
            const reloaded = await ProcessedEvent.findOne({ eventId, jobId });
            if (reloaded && reloaded.status === ProcessedEventStatus.COMPLETED) {
              return {
                duplicate: true,
                skipped: true,
                result: reloaded.result,
              };
            }
          } else {
            throw err;
          }
        }
      }

      // 3. Execute payload function
      const result = await workFn();

      // 4. Mark completed atomically with result
      await ProcessedEvent.findOneAndUpdate(
        { eventId, jobId },
        {
          $set: {
            status: ProcessedEventStatus.COMPLETED,
            result: result !== undefined ? result : { success: true },
            error: null,
            processedAt: new Date(),
          },
        }
      );

      return {
        duplicate: false,
        skipped: false,
        result,
      };
    } catch (err) {
      // Record failure for diagnostics before re-throwing for Inngest retry handling
      await ProcessedEvent.findOneAndUpdate(
        { eventId, jobId },
        {
          $set: {
            status: ProcessedEventStatus.FAILED,
            error: err.message,
          },
        }
      ).catch(() => {});

      throw err;
    }
  }

  /**
   * Check if an event was already processed by a specific job
   */
  async isProcessed(eventId, jobId) {
    const record = await ProcessedEvent.findOne({ eventId, jobId });
    return record?.status === ProcessedEventStatus.COMPLETED;
  }
}

export const idempotencyService = new IdempotencyService();
