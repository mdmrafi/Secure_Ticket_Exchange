import { inngest } from '../../config/inngest.config.js';
import { CORE_DOMAIN_EVENTS } from '../../common/constants/events.constant.js';
import { auditService } from '../../modules/audit/audit.service.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * Audit processing background jobs
 * Processes all core domain events and stores immutable audit logs
 */
export const auditJobs = CORE_DOMAIN_EVENTS.map((eventName) => {
  const functionId = `audit-${eventName.replace(/\./g, '-')}`;

  return inngest.createFunction(
    {
      id: functionId,
      name: `Audit: ${eventName}`,
      retries: 3,
      idempotency: 'event.id',
      onFailure: async ({ error, event }) => {
        logger.error(
          { error: error.message, eventName, eventId: event.id },
          'Audit processing job failed after retries exhausted'
        );
      },
    },
    { event: eventName },
    async ({ event, step }) => {
      const eventId = event.id || event.data?.eventId;

      const result = await step.run('persist-audit-record', async () => {
        return idempotencyService.executeIdempotent(
          {
            eventId,
            jobId: functionId,
            eventName: event.name,
          },
          async () => {
            return auditService.recordAuditEvent({
              eventId,
              eventName: event.name,
              data: event.data,
              user: event.user,
              timestamp: event.ts,
            });
          }
        );
      });

      return { success: true, eventId, result };
    }
  );
});
