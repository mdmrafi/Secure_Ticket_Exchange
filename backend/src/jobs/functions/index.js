import { inngest } from '../../config/inngest.config.js';
import { logger } from '../../config/logger.config.js';

/**
 * Example background job: Asset verification workflow
 * Handles heavy asynchronous validation (PDF parsing, OCR, QR code check)
 */
export const assetVerificationJob = inngest.createFunction(
  { id: 'asset-verification-job' },
  { event: 'asset/verification.requested' },
  async ({ event, step }) => {
    logger.info({ eventData: event.data }, 'Inngest job: Starting asset verification background job');

    const result = await step.run('verify-asset-payload', async () => {
      // Step placeholder: Verify asset authenticity against rules or external services
      return {
        assetId: event.data.assetId,
        status: 'PENDING_REVIEW',
        verifiedAt: new Date().toISOString(),
      };
    });

    return { success: true, result };
  }
);

export const allInngestFunctions = [assetVerificationJob];
