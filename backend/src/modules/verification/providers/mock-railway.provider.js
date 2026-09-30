import { RailwayVerificationProvider } from './railway-provider.interface.js';
import { VerificationStatus } from '../../../common/constants/asset-types.constant.js';
import { logger } from '../../../config/logger.config.js';

/**
 * MockRailwayVerificationProvider
 *
 * Implements synthetic verification of Bangladesh Railway travel documents.
 * Simulates authoritative registry responses without scraping or bypassing
 * CAPTCHA, authentication, or anti-bot protections.
 */
export class MockRailwayVerificationProvider extends RailwayVerificationProvider {
  constructor() {
    super();
    this.name = 'mock-railway-provider';
  }

  getName() {
    return this.name;
  }

  /**
   * Verify ticket against synthetic authoritative railway registry
   */
  async verifyTicket({
    pnr = '',
    ticketNumber = '',
    passengerName = '',
    trainNumber = '',
    journeyDate = '',
    fromStation = '',
    toStation = '',
    options = {},
  }) {
    const rawPnr = (pnr || '').toString().trim().toUpperCase();
    const rawPassenger = (passengerName || '').toString().trim().toUpperCase();
    const now = new Date();
    const source = 'MOCK_BANGLADESH_RAILWAY_AUTHORITY';

    logger.info(
      { pnr: rawPnr, trainNumber, fromStation, toStation },
      '[MockRailwayVerificationProvider] Querying synthetic railway registry'
    );

    // 1. Simulating Provider Failure / Gateway Timeout
    if (
      options.simulateProviderFailure ||
      rawPnr.includes('PROV_FAIL') ||
      rawPnr.includes('TIMEOUT')
    ) {
      logger.warn({ pnr: rawPnr }, '[MockRailwayVerificationProvider] Simulated provider timeout/failure triggered');
      return {
        status: VerificationStatus.MANUAL_REVIEW,
        ticketExists: null,
        passengerMatch: null,
        journeyMatch: null,
        verificationTimestamp: now,
        source,
        isProviderFailure: true,
        errorMessage: 'Railway authority API gateway timeout / upstream service unreachable.',
        details: {
          gatewayStatus: 504,
          retryAfterSeconds: 60,
          requiresManualReviewFallback: true,
        },
      };
    }

    // 2. Simulating Nonexistent Ticket
    if (
      options.ticketExists === false ||
      rawPnr.includes('NOT_FOUND') ||
      rawPnr.includes('NONEXISTENT') ||
      rawPnr.includes('404') ||
      rawPnr.endsWith('0000')
    ) {
      return {
        status: VerificationStatus.FAILED,
        ticketExists: false,
        passengerMatch: false,
        journeyMatch: false,
        verificationTimestamp: now,
        source,
        details: {
          reason: 'Ticket not found in Bangladesh Railway central reservation database.',
          pnr: rawPnr,
        },
      };
    }

    // 3. Simulating Passenger Identity Mismatch
    if (
      options.passengerMatch === false ||
      rawPassenger.includes('MISMATCH') ||
      rawPnr.includes('PASS_MISMATCH')
    ) {
      return {
        status: VerificationStatus.SUSPICIOUS,
        ticketExists: true,
        passengerMatch: false,
        journeyMatch: true,
        verificationTimestamp: now,
        source,
        details: {
          reason: 'Passenger identity mismatch with railway booking record.',
          registeredNameSample: 'M. R. CHOWDHURY',
          providedName: passengerName,
        },
      };
    }

    // 4. Simulating Journey / Route Mismatch
    if (
      options.journeyMatch === false ||
      rawPnr.includes('JOURNEY_MISMATCH')
    ) {
      return {
        status: VerificationStatus.SUSPICIOUS,
        ticketExists: true,
        passengerMatch: true,
        journeyMatch: false,
        verificationTimestamp: now,
        source,
        details: {
          reason: 'Journey itinerary mismatch with official railway schedule.',
          pnr: rawPnr,
        },
      };
    }

    // 5. Simulating Manual Review Flag
    if (
      options.manualReview === true ||
      rawPnr.includes('REVIEW') ||
      rawPnr.endsWith('9999')
    ) {
      return {
        status: VerificationStatus.MANUAL_REVIEW,
        ticketExists: true,
        passengerMatch: true,
        journeyMatch: true,
        verificationTimestamp: now,
        source,
        details: {
          reason: 'Audit flag: Reservation record requires compliance analyst inspection.',
        },
      };
    }

    // 6. Valid Authentic Mock Ticket
    return {
      status: VerificationStatus.VERIFIED,
      ticketExists: true,
      passengerMatch: true,
      journeyMatch: true,
      verificationTimestamp: now,
      source,
      details: {
        trainName: options.trainName || 'Suborno Express',
        bookingStatus: 'CONFIRMED',
        quota: 'GENERAL',
        pnr: rawPnr,
      },
    };
  }
}

export const mockRailwayVerificationProvider = new MockRailwayVerificationProvider();
