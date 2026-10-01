import { AssetVerifier } from '../interfaces/asset-verifier.interface.js';
import {
  AssetTypes,
  VerificationStatus,
} from '../../../../common/constants/asset-types.constant.js';

export class BusTicketVerifier extends AssetVerifier {
  constructor() {
    super(AssetTypes.BUS_TICKET);
  }

  async verify(asset, context = {}) {
    const meta = asset.metadata || {};
    const checks = [];
    const fraudFlags = [];
    let score = 100;

    // 1. Operator validation check
    const operator = meta.operator;
    if (!operator || operator.trim().length < 2) {
      score -= 30;
      checks.push({
        checkType: 'OPERATOR_VERIFICATION',
        status: 'FAILED',
        details: 'Missing or invalid operator',
      });
      fraudFlags.push({
        code: 'INVALID_BUS_OPERATOR',
        description: 'Operator name missing',
        severity: 'HIGH',
      });
    } else {
      checks.push({
        checkType: 'OPERATOR_VERIFICATION',
        status: 'PASSED',
        details: `Operator: ${operator}`,
      });
    }

    // 2. Schedule & Departure Time Check
    const departureDate = meta.departureDate;
    if (departureDate) {
      const depTime = new Date(departureDate);
      if (!isNaN(depTime.getTime()) && depTime < new Date()) {
        score -= 50;
        checks.push({
          checkType: 'SCHEDULE_VALIDATION',
          status: 'FAILED',
          details: 'Ticket departure date is in the past',
        });
        fraudFlags.push({
          code: 'EXPIRED_TICKET_SCHEDULE',
          description: 'Bus journey has already departed',
          severity: 'CRITICAL',
        });
      } else {
        checks.push({
          checkType: 'SCHEDULE_VALIDATION',
          status: 'PASSED',
          details: `Scheduled: ${departureDate}`,
        });
      }
    } else {
      score -= 15;
      checks.push({
        checkType: 'SCHEDULE_VALIDATION',
        status: 'FAILED',
        details: 'No departure date specified',
      });
    }

    // 3. Booking Reference Format Check
    const ref = meta.ticketNumber || meta.bookingReference || asset.uniqueAssetIdentifier;
    if (ref && String(ref).length >= 4) {
      checks.push({
        checkType: 'BOOKING_REFERENCE_INTEGRITY',
        status: 'PASSED',
        details: `Ref: ${ref}`,
      });
    } else {
      score -= 20;
      checks.push({
        checkType: 'BOOKING_REFERENCE_INTEGRITY',
        status: 'FAILED',
        details: 'Malformed booking reference',
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
        operator: meta.operator,
        route: `${meta.source} -> ${meta.destination}`,
        verifiedAt: new Date().toISOString(),
      },
    };
  }
}
