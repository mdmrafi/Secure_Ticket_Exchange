import { AssetVerifier } from '../interfaces/asset-verifier.interface.js';
import {
  AssetTypes,
  VerificationStatus,
} from '../../../../common/constants/asset-types.constant.js';

export class EventTicketVerifier extends AssetVerifier {
  constructor() {
    super(AssetTypes.EVENT_TICKET);
  }

  async verify(asset, context = {}) {
    const meta = asset.metadata || {};
    const checks = [];
    const fraudFlags = [];
    let score = 100;

    // 1. Barcode / Ticket ID integrity
    const barcode = meta.barcode || asset.uniqueAssetIdentifier;
    if (!barcode || String(barcode).length < 5) {
      score -= 40;
      checks.push({
        checkType: 'BARCODE_INTEGRITY',
        status: 'FAILED',
        details: 'Missing or short barcode',
      });
      fraudFlags.push({
        code: 'INVALID_BARCODE',
        description: 'Event ticket lacks authentic barcode',
        severity: 'HIGH',
      });
    } else {
      checks.push({
        checkType: 'BARCODE_INTEGRITY',
        status: 'PASSED',
        details: `Barcode verified: ${barcode}`,
      });
    }

    // 2. Event Date validation
    const eventDate = meta.eventDate;
    if (eventDate) {
      const ed = new Date(eventDate);
      if (!isNaN(ed.getTime()) && ed < new Date()) {
        score -= 60;
        checks.push({
          checkType: 'EVENT_DATE_CHECK',
          status: 'FAILED',
          details: 'Event date is in the past',
        });
        fraudFlags.push({
          code: 'PAST_EVENT',
          description: 'Event has already concluded',
          severity: 'CRITICAL',
        });
      } else {
        checks.push({
          checkType: 'EVENT_DATE_CHECK',
          status: 'PASSED',
          details: `Date: ${eventDate}`,
        });
      }
    } else {
      score -= 20;
      checks.push({
        checkType: 'EVENT_DATE_CHECK',
        status: 'FAILED',
        details: 'Event date missing',
      });
    }

    // 3. Venue & Organizer
    if (meta.venue && meta.eventName) {
      checks.push({
        checkType: 'VENUE_INTEGRITY',
        status: 'PASSED',
        details: `${meta.eventName} @ ${meta.venue}`,
      });
    } else {
      score -= 15;
      checks.push({
        checkType: 'VENUE_INTEGRITY',
        status: 'FAILED',
        details: 'Missing event or venue name',
      });
    }

    const isVerified = score >= 70 && fraudFlags.every((f) => f.severity !== 'CRITICAL');
    const status = isVerified
      ? VerificationStatus.VERIFIED
      : fraudFlags.some((f) => f.severity === 'CRITICAL')
        ? VerificationStatus.FAILED
        : VerificationStatus.SUSPICIOUS;

    return {
      isVerified,
      status,
      confidenceScore: Math.max(0, score),
      checks,
      fraudFlags,
      details: {
        eventName: meta.eventName,
        venue: meta.venue,
        tier: meta.ticketTier,
        verifiedAt: new Date().toISOString(),
      },
    };
  }
}
