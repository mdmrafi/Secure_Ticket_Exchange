import { inngest } from '../../config/inngest.config.js';
import { NonRetriableError } from 'inngest';
import { EventNames } from '../../common/constants/events.constant.js';
import { Asset } from '../../modules/assets/asset.model.js';
import { Verification } from '../../modules/verification/verification.model.js';
import { verificationService } from '../../modules/verification/verification.service.js';
import { publishEvent } from '../publisher.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { VerificationStatus, AssetStatus } from '../../common/constants/asset-types.constant.js';
import { notificationService } from '../../modules/notifications/notification.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * Background job: Verification with automatic retries and exponential backoff
 */
export const verificationRetriesJob = inngest.createFunction(
  {
    id: 'verification-retries-job',
    name: 'Verification: Engine Evaluator with Retries',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event, step }) => {
      const assetId = event.data?.assetId;
      logger.error(
        { error: error.message, assetId, eventId: event.id },
        'Verification job permanently failed after exhausting all retry attempts'
      );

      if (assetId) {
        // Record terminal failure in database
        await step.run('handle-verification-exhausted-failure', async () => {
          const asset = await Asset.findById(assetId);
          if (asset) {
            asset.verificationStatus = VerificationStatus.MANUAL_REVIEW;
            asset.status = AssetStatus.PENDING_VERIFICATION;
            await asset.save();

            // Notify owner of failure to automate verification
            if (asset.ownerId) {
              await notificationService.sendNotification(asset.ownerId, {
                title: 'Automated Verification Inconclusive',
                message: `Automated verification for asset #${assetId} could not be finalized. It has been routed to manual compliance review.`,
                type: 'SYSTEM',
                data: { assetId, error: error.message },
              });
            }
          }
        });
      }
    },
  },
  [
    { event: EventNames.ASSET_CREATED },
    { event: EventNames.VERIFICATION_RETRY_REQUESTED },
    { event: 'asset/verification.requested' },
  ],
  async ({ event, step }) => {
    const { assetId, attempt = 1, simulateFailure = false } = event.data;
    const eventId = event.id || event.data?.eventId;

    if (!assetId) {
      throw new NonRetriableError('Asset ID is required to execute verification');
    }

    // Step 1: Check eligibility and current status
    const asset = await step.run('load-and-check-eligibility', async () => {
      const foundAsset = await Asset.findById(assetId);
      if (!foundAsset) {
        throw new NonRetriableError(`Asset #${assetId} not found`);
      }

      // If already verified or rejected, skip re-evaluating
      if (
        foundAsset.verificationStatus === VerificationStatus.VERIFIED ||
        foundAsset.status === AssetStatus.VERIFIED
      ) {
        return { eligible: false, reason: 'Asset is already verified', asset: foundAsset };
      }

      return { eligible: true, asset: foundAsset };
    });

    if (!asset.eligible) {
      return { skipped: true, reason: asset.reason };
    }

    // Step 2: Idempotent execution of verification with retry support
    const verificationResult = await step.run('execute-verification-engine', async () => {
      return idempotencyService.executeIdempotent(
        {
          eventId,
          jobId: 'verification-retries-job',
          eventName: event.name,
        },
        async () => {
          // Allow simulated transient errors for retry testing
          if (simulateFailure && attempt < 3) {
            logger.warn(
              { assetId, attempt },
              'Simulating transient provider network timeout for retry testing'
            );
            throw new Error(`Transient provider timeout (Attempt ${attempt}/3)`);
          }

          logger.info({ assetId }, 'Executing multi-layer asset verification');
          const result = await verificationService.runAssetVerification(assetId);
          return result;
        }
      );
    });

    // Step 3: If verified successfully, emit asset.verified event
    if (verificationResult.result?.status === VerificationStatus.VERIFIED) {
      await step.run('emit-asset-verified-event', async () => {
        await publishEvent(EventNames.ASSET_VERIFIED, {
          assetId,
          ownerId: asset.asset.ownerId,
          verificationId: verificationResult.result.verificationId,
          status: VerificationStatus.VERIFIED,
          confidenceScore: verificationResult.result.confidenceScore || 100,
        });
      });
    }

    return {
      success: true,
      assetId,
      result: verificationResult.result,
    };
  }
);

export const verificationJobs = [verificationRetriesJob];
