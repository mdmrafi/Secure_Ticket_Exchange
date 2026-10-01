import { inngest } from '../../config/inngest.config.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { listingService } from '../../modules/listings/listing.service.js';
import { Reservation, ReservationStatus } from '../../modules/listings/reservation.model.js';
import { Listing } from '../../modules/listings/listing.model.js';
import { ListingStatus } from '../../common/constants/asset-types.constant.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * 1. Cron-based periodic sweeping for expired reservations
 * Runs every 5 minutes to release any stale active reservations
 */
export const cleanupExpiredReservationsCronJob = inngest.createFunction(
  {
    id: 'cleanup-expired-reservations-cron',
    name: 'Reservation: Sweeper Cron (Every 5 mins)',
    retries: 3,
    onFailure: async ({ error }) => {
      logger.error({ error: error.message }, 'Expired reservation cleanup cron failed');
    },
  },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    logger.info('Running Inngest cron job: cleanup expired reservations');

    const result = await step.run('sweep-stale-reservations', async () => {
      return listingService.expireStaleReservations();
    });

    logger.info({ expiredCount: result.expiredCount }, 'Expired reservations sweep finished');
    return result;
  }
);

/**
 * 2. Event-driven delayed reservation expiration
 * Triggered when a listing is reserved, sleeps until expiration, then verifies & expires
 */
export const reservationExpirationEventJob = inngest.createFunction(
  {
    id: 'cleanup-expired-reservation-event',
    name: 'Reservation: Delayed Expiration Watcher',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Reservation expiration watcher failed');
    },
  },
  { event: EventNames.LISTING_RESERVED },
  async ({ event, step }) => {
    const { reservationId, listingId, expiresAt } = event.data;
    const eventId = event.id || event.data?.eventId;

    // Step 1: Wait until the reservation expiration timestamp
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (expirationDate > new Date()) {
        await step.sleepUntil('wait-for-reservation-expiry', expirationDate);
      }
    }

    // Step 2: Idempotently verify and expire if still active
    return step.run('expire-reservation-if-active', async () => {
      return idempotencyService.executeIdempotent(
        {
          eventId,
          jobId: 'cleanup-expired-reservation-event',
          eventName: event.name,
        },
        async () => {
          const res = await Reservation.findOne({
            _id: reservationId,
            status: ReservationStatus.ACTIVE,
          });

          if (!res) {
            return {
              expired: false,
              reason: 'Reservation is no longer active (already released, expired, or completed)',
            };
          }

          if (res.expiresAt > new Date()) {
            return {
              expired: false,
              reason: 'Reservation expiration has not yet passed',
            };
          }

          // Atomically transition reservation to EXPIRED
          res.status = ReservationStatus.EXPIRED;
          res.releasedAt = new Date();
          res.releaseReason = 'Automated reservation TTL expiration via Inngest background job';
          await res.save();

          // Restore listing status back to ACTIVE if currently RESERVED
          const listing = await Listing.findOneAndUpdate(
            { _id: listingId || res.listingId, status: ListingStatus.RESERVED },
            { $set: { status: ListingStatus.ACTIVE } },
            { new: true }
          );

          logger.info(
            { reservationId: res._id, listingId: res.listingId },
            'Inngest background job: Expired stale reservation and released listing to ACTIVE'
          );

          return {
            expired: true,
            reservationId: res._id,
            listingId: res.listingId,
            newListingStatus: listing?.status || ListingStatus.ACTIVE,
          };
        }
      );
    });
  }
);

/**
 * 3. On-demand cleanup trigger (for manual / test invocations)
 */
export const cleanupExpiredReservationsOnDemandJob = inngest.createFunction(
  {
    id: 'cleanup-expired-reservations-on-demand',
    name: 'Reservation: On-Demand Expiration Sweep',
    retries: 2,
    idempotency: 'event.id',
  },
  { event: EventNames.RESERVATION_CLEANUP_REQUESTED },
  async ({ step }) => {
    return step.run('sweep-on-demand', async () => {
      return listingService.expireStaleReservations();
    });
  }
);

export const reservationCleanupJobs = [
  cleanupExpiredReservationsCronJob,
  reservationExpirationEventJob,
  cleanupExpiredReservationsOnDemandJob,
];
