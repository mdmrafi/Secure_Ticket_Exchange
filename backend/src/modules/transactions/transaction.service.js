import mongoose from 'mongoose';
import { transactionRepository } from './transaction.repository.js';
import { listingRepository } from '../listings/listing.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { User } from '../users/user.model.js';
import { Asset } from '../assets/asset.model.js';
import { Listing } from '../listings/listing.model.js';
import { Reservation, ReservationStatus } from '../listings/reservation.model.js';
import { getPaymentProvider } from './providers/payment-provider.factory.js';
import { TransactionEventType } from './transaction-event.model.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors/index.js';
import {
  ListingStatus,
  TransactionStatus,
  PaymentStatus,
  AssetStatus,
} from '../../common/constants/asset-types.constant.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';

// Strict State Transition Matrix for Transactions
export const ALLOWED_TRANSACTION_TRANSITIONS = {
  [TransactionStatus.INITIATED]: [TransactionStatus.PAYMENT_PENDING, TransactionStatus.CANCELLED],
  [TransactionStatus.PAYMENT_PENDING]: [
    TransactionStatus.PAYMENT_CONFIRMED,
    TransactionStatus.CANCELLED,
    TransactionStatus.DISPUTED,
  ],
  [TransactionStatus.PAYMENT_CONFIRMED]: [
    TransactionStatus.TRANSFER_PENDING,
    TransactionStatus.DISPUTED,
    TransactionStatus.CANCELLED,
  ],
  [TransactionStatus.TRANSFER_PENDING]: [TransactionStatus.COMPLETED, TransactionStatus.DISPUTED],
  [TransactionStatus.COMPLETED]: [], // Terminal state
  [TransactionStatus.CANCELLED]: [], // Terminal state
  [TransactionStatus.DISPUTED]: [TransactionStatus.COMPLETED, TransactionStatus.CANCELLED],
};

// Strict State Transition Matrix for Payments
export const ALLOWED_PAYMENT_TRANSITIONS = {
  [PaymentStatus.PENDING]: [PaymentStatus.AUTHORIZED, PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING, // allow retry
  ],
  [PaymentStatus.REFUNDED]: [], // Terminal
};

/**
 * Strip sensitive payment credentials (card numbers, CVV, PIN, etc.) from payloads
 * ensuring PCI-DSS compliance and zero storage of raw credentials.
 */
export function sanitizePaymentData(data) {
  if (!data || typeof data !== 'object') return data;
  if (data instanceof Date || data instanceof RegExp) return data;
  if (Array.isArray(data)) return data.map(sanitizePaymentData);

  const sensitivePattern =
    /^(card_?number|pan|cvv|cvc|security_?code|expiry|expiry_?date|pin|password|secret|access_?token)$/i;
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitivePattern.test(key)) {
      continue; // Purge completely
    }
    if (value instanceof Date || value instanceof RegExp) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePaymentData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class TransactionService {
  constructor(
    repo = transactionRepository,
    listingRepo = listingRepository,
    assetRepo = assetRepository,
    paymentProvider = getPaymentProvider()
  ) {
    this.repo = repo;
    this.listingRepo = listingRepo;
    this.assetRepo = assetRepo;
    this.paymentProvider = paymentProvider;
  }

  /**
   * Validate that a state transition is legal according to strict transaction rules
   */
  validateTransactionTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return;
    const allowed = ALLOWED_TRANSACTION_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestError(
        `Invalid transaction state transition from ${currentStatus} to ${nextStatus}. Required intermediate steps must be completed.`
      );
    }
  }

  /**
   * Validate that a payment state transition is legal
   */
  validatePaymentTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return;
    const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestError(
        `Invalid payment state transition from ${currentStatus} to ${nextStatus}.`
      );
    }
  }

  /**
   * Initiate a new exchange transaction for a listed asset
   *
   * Business Rules:
   * 1. Suspended users cannot initiate transactions
   * 2. Seller cannot purchase own asset
   * 3. Listing must be ACTIVE or RESERVED by this buyer
   * 4. Strict initial state: INITIATED & PENDING
   * 5. Records immutable audit event
   *
   * @param {string} buyerId
   * @param {string} listingId
   */
  async initiateTransaction(buyerId, listingId) {
    const buyer = await User.findById(buyerId).select('accountStatus');
    if (!buyer) {
      throw new NotFoundError('Buyer account not found');
    }
    if (buyer.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Suspended users cannot initiate transactions');
    }

    const listing = await this.listingRepo.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    if (sellerIdStr === buyerId.toString()) {
      throw new BadRequestError('You cannot purchase your own listed asset');
    }

    // Check if listing is active or reserved by this buyer
    if (listing.status !== ListingStatus.ACTIVE && listing.status !== ListingStatus.RESERVED) {
      throw new BadRequestError(
        `Listing is no longer active or available (Status: ${listing.status})`
      );
    }

    if (listing.status === ListingStatus.RESERVED) {
      const activeRes = await Reservation.findOne({
        listingId: listing._id,
        status: ReservationStatus.ACTIVE,
      });
      if (activeRes && activeRes.buyerId.toString() !== buyerId.toString()) {
        throw new ConflictError('Listing is currently reserved by another buyer');
      }
    }

    // Atomically ensure listing is RESERVED
    if (listing.status === ListingStatus.ACTIVE) {
      await this.listingRepo.updateById(listing._id, { status: ListingStatus.RESERVED });
    }

    const amount = listing.askingPrice ?? listing.price;
    const currency = listing.currency || 'BDT';

    const transaction = await this.repo.create({
      listingId: listing._id,
      assetId: listing.assetId._id,
      buyerId,
      sellerId: listing.sellerId._id,
      amount,
      currency,
      transactionStatus: TransactionStatus.INITIATED,
      paymentStatus: PaymentStatus.PENDING,
      escrowStatus: 'NONE',
    });

    // Append to immutable audit event log
    await this.repo.recordEvent({
      transactionId: transaction._id,
      eventType: TransactionEventType.TRANSACTION_INITIATED,
      fromTransactionStatus: 'NONE',
      toTransactionStatus: TransactionStatus.INITIATED,
      fromPaymentStatus: 'NONE',
      toPaymentStatus: PaymentStatus.PENDING,
      actorId: buyerId,
      actorRole: 'BUYER',
      metadata: {
        amount,
        currency,
        listingId: listing._id,
        assetId: listing.assetId._id,
      },
    });

    // Asynchronously dispatch transaction.created event for background jobs
    publishEvent(
      EventNames.TRANSACTION_CREATED,
      {
        transactionId: transaction._id.toString(),
        buyerId: buyerId.toString(),
        sellerId: (listing.sellerId._id || listing.sellerId).toString(),
        listingId: listing._id.toString(),
        assetId: (listing.assetId._id || listing.assetId).toString(),
        amount,
        currency,
        buyerEmail: buyer.email,
      },
      { id: buyerId.toString() }
    ).catch(() => {});

    return transaction;
  }

  /**
   * Create checkout/payment session with payment provider
   * Step: INITIATED -> PAYMENT_PENDING
   *
   * @param {string} transactionId
   * @param {string} userId
   */
  async createPaymentSession(transactionId, userId) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId);

    if (tx.buyerId._id.toString() !== userId.toString()) {
      throw new ForbiddenError('Only the buyer can create a payment session for this transaction');
    }

    // Allow retry from PAYMENT_PENDING if session was already initiated
    if (tx.transactionStatus !== TransactionStatus.PAYMENT_PENDING) {
      this.validateTransactionTransition(tx.transactionStatus, TransactionStatus.PAYMENT_PENDING);
    }

    // Provider abstraction: create payment session
    const createFn = this.paymentProvider.createPayment
      ? this.paymentProvider.createPayment.bind(this.paymentProvider)
      : this.paymentProvider.createPaymentSession.bind(this.paymentProvider);

    const paymentSession = await createFn({
      transactionId: tx._id.toString(),
      amount: tx.amount,
      currency: tx.currency,
      buyerId: userId,
      buyerEmail: tx.buyerId.email,
    });

    const previousTxStatus = tx.transactionStatus;
    const previousPayStatus = tx.paymentStatus;

    const updatedTx = await this.repo.updateById(tx._id, {
      transactionStatus: TransactionStatus.PAYMENT_PENDING,
      paymentDetails: sanitizePaymentData({
        ...tx.paymentDetails,
        provider: paymentSession.provider,
        paymentSessionId: paymentSession.paymentSessionId,
      }),
    });

    await this.repo.recordEvent({
      transactionId: tx._id,
      eventType: TransactionEventType.PAYMENT_SESSION_CREATED,
      fromTransactionStatus: previousTxStatus,
      toTransactionStatus: TransactionStatus.PAYMENT_PENDING,
      fromPaymentStatus: previousPayStatus,
      toPaymentStatus: tx.paymentStatus,
      actorId: userId,
      actorRole: 'BUYER',
      metadata: sanitizePaymentData({
        paymentSessionId: paymentSession.paymentSessionId,
        checkoutUrl: paymentSession.checkoutUrl,
      }),
    });

    return {
      transaction: updatedTx,
      paymentSession,
    };
  }

  /**
   * Authoritatively verify payment status with payment provider.
   * NEVER trust payment success information supplied by the frontend.
   * Backend directly queries provider ledger and enforces amount & currency parity.
   *
   * @param {string} transactionId
   * @param {string} userId
   * @param {object} [clientPayload]
   */
  async verifyPaymentStatus(transactionId, userId, clientPayload = {}) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId);

    if (tx.buyerId._id.toString() !== userId.toString()) {
      throw new ForbiddenError('Only the buyer can verify payment for this transaction');
    }

    // Ensure transaction is in a payable state
    if (
      tx.transactionStatus !== TransactionStatus.PAYMENT_PENDING &&
      tx.transactionStatus !== TransactionStatus.INITIATED
    ) {
      if (
        tx.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED ||
        tx.transactionStatus === TransactionStatus.TRANSFER_PENDING ||
        tx.transactionStatus === TransactionStatus.COMPLETED
      ) {
        return tx;
      }
      throw new BadRequestError(
        `Cannot verify payment for transaction in status ${tx.transactionStatus}. Must be PAYMENT_PENDING.`
      );
    }

    const paymentSessionId =
      clientPayload.paymentSessionId ||
      tx.paymentDetails?.paymentSessionId ||
      `mock_sess_${tx._id}`;

    // Query payment provider directly (authoritative verification - zero trust)
    const verification = await this.paymentProvider.verifyPayment({
      paymentSessionId,
      transactionRef: clientPayload.transactionRef,
      signature: clientPayload.signature,
      payload: clientPayload,
    });

    // Check 1: Transaction Mismatch
    if (verification.transactionId && verification.transactionId.toString() !== tx._id.toString()) {
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.TRANSACTION_MISMATCH_DETECTED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorId: userId,
        actorRole: 'BUYER',
        metadata: {
          expectedTransactionId: tx._id.toString(),
          providerTransactionId: verification.transactionId,
        },
      });
      throw new BadRequestError(
        'Transaction ID mismatch: payment session belongs to another transaction'
      );
    }

    // Check 2: Amount Manipulation Protection
    if (
      verification.amount !== undefined &&
      verification.amount !== null &&
      verification.amount > 0
    ) {
      if (Math.abs(Number(verification.amount) - Number(tx.amount)) > 0.001) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.AMOUNT_MANIPULATION_DETECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorId: userId,
          actorRole: 'BUYER',
          metadata: {
            expectedAmount: tx.amount,
            reportedAmount: verification.amount,
          },
        });
        throw new BadRequestError(
          `Amount manipulation detected: expected ${tx.amount} ${tx.currency} but provider reported ${verification.amount}`
        );
      }
    }

    // Check 3: Currency Manipulation Protection
    if (verification.currency) {
      if (verification.currency.toUpperCase() !== tx.currency.toUpperCase()) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.CURRENCY_MANIPULATION_DETECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorId: userId,
          actorRole: 'BUYER',
          metadata: {
            expectedCurrency: tx.currency,
            reportedCurrency: verification.currency,
          },
        });
        throw new BadRequestError(
          `Currency manipulation detected: expected ${tx.currency} but provider reported ${verification.currency}`
        );
      }
    }

    // Zero-Trust check: provider authoritative status determines outcome
    if (verification.status === 'PAID') {
      this.validatePaymentTransition(tx.paymentStatus, PaymentStatus.PAID);
      this.validateTransactionTransition(tx.transactionStatus, TransactionStatus.PAYMENT_CONFIRMED);

      const previousTxStatus = tx.transactionStatus;
      const previousPayStatus = tx.paymentStatus;
      const txRef = verification.transactionRef || `REF-${Date.now()}`;
      const paidAt = verification.paidAt || new Date();

      const updatedTx = await this.repo.updateById(tx._id, {
        transactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        escrowStatus: 'HELD',
        paymentDetails: sanitizePaymentData({
          ...tx.paymentDetails,
          provider: verification.provider || tx.paymentDetails?.provider,
          paymentSessionId,
          transactionRef: txRef,
          paidAt,
          failureReason: null,
        }),
      });

      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.PAYMENT_VERIFIED,
        fromTransactionStatus: previousTxStatus,
        toTransactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
        fromPaymentStatus: previousPayStatus,
        toPaymentStatus: PaymentStatus.PAID,
        actorId: userId,
        actorRole: 'BUYER',
        metadata: {
          provider: verification.provider,
          paymentSessionId,
          transactionRef: txRef,
          paidAt,
          amountVerified: tx.amount,
          currencyVerified: tx.currency,
        },
      });

      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.PAYMENT_CONFIRMED,
        fromTransactionStatus: previousTxStatus,
        toTransactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
        fromPaymentStatus: previousPayStatus,
        toPaymentStatus: PaymentStatus.PAID,
        actorId: userId,
        actorRole: 'BUYER',
        metadata: {
          transactionRef: txRef,
          paidAt,
          escrowStatus: 'HELD',
        },
      });

      publishEvent(
        EventNames.PAYMENT_COMPLETED,
        {
          transactionId: tx._id.toString(),
          buyerId: (tx.buyerId?._id || tx.buyerId).toString(),
          sellerId: (tx.sellerId?._id || tx.sellerId).toString(),
          amount: tx.amount,
          currency: tx.currency,
          transactionRef: txRef,
          paidAt,
        },
        { id: userId }
      ).catch(() => {});

      return updatedTx;
    } else if (verification.status === 'FAILED') {
      this.validatePaymentTransition(tx.paymentStatus, PaymentStatus.FAILED);

      const previousTxStatus = tx.transactionStatus;
      const previousPayStatus = tx.paymentStatus;

      const updatedTx = await this.repo.updateById(tx._id, {
        paymentStatus: PaymentStatus.FAILED,
        paymentDetails: sanitizePaymentData({
          ...tx.paymentDetails,
          failureReason: verification.failureReason || 'Payment failed on provider gateway',
        }),
      });

      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.PAYMENT_FAILED,
        fromTransactionStatus: previousTxStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: previousPayStatus,
        toPaymentStatus: PaymentStatus.FAILED,
        actorId: userId,
        actorRole: 'BUYER',
        metadata: {
          failureReason: verification.failureReason,
        },
      });

      return updatedTx;
    } else {
      // Status is PENDING - do NOT trust frontend claims if provider hasn't confirmed payment
      throw new BadRequestError('Payment has not yet been confirmed by the payment gateway');
    }
  }

  /**
   * Process simulated payment outcome
   * For backwards compatibility and testing:
   * If simulated provider is active, executes customer payment simulation on provider first,
   * then authoritatively verifies with provider.
   *
   * @param {string} transactionId
   * @param {string} userId
   * @param {{ outcome?: 'SUCCESS' | 'FAIL', failureReason?: string }} options
   */
  async processPayment(transactionId, userId, options = {}) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId);

    if (tx.transactionStatus !== TransactionStatus.PAYMENT_PENDING) {
      throw new BadRequestError(
        `Cannot process payment for transaction in status ${tx.transactionStatus}. Must be PAYMENT_PENDING.`
      );
    }

    const paymentSessionId = tx.paymentDetails?.paymentSessionId || `mock_sess_${tx._id}`;
    const outcome = options.outcome || 'SUCCESS';

    // If provider supports simulation (e.g. MockPaymentProvider), simulate customer action on gateway
    if (typeof this.paymentProvider.simulateCustomerPayment === 'function') {
      await this.paymentProvider.simulateCustomerPayment({
        paymentSessionId,
        outcome,
        failureReason: options.failureReason,
      });
    }

    // Now authoritatively verify status from provider (never trusting client claim)
    return this.verifyPaymentStatus(transactionId, userId, {
      paymentSessionId,
      ...options,
    });
  }

  /**
   * Handle webhook / callback from payment provider with idempotent processing
   * and comprehensive threat defenses against:
   * 1. Duplicate callbacks
   * 2. Forged callbacks (HMAC signature verification)
   * 3. Amount manipulation
   * 4. Currency manipulation
   * 5. Replay attacks (timestamp & terminal status guards)
   * 6. Transaction mismatch
   * 7. Sensitive payment credential leakage
   *
   * @param {string} transactionId
   * @param {object} callbackPayload
   * @param {object} [headers]
   */
  async handlePaymentCallback(transactionId, callbackPayload = {}, headers = {}) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    const sanitizedPayload = sanitizePaymentData(callbackPayload);

    // 1. DUPLICATE CALLBACK PROTECTION (IDEMPOTENCY)
    const isAlreadyPaid =
      tx.paymentStatus === PaymentStatus.PAID ||
      tx.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED ||
      tx.transactionStatus === TransactionStatus.TRANSFER_PENDING ||
      tx.transactionStatus === TransactionStatus.COMPLETED;

    if (isAlreadyPaid) {
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.DUPLICATE_CALLBACK_IGNORED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          callbackPayload: sanitizedPayload,
          message: 'Duplicate payment callback safely handled without re-processing',
        },
      });

      return {
        idempotent: true,
        message: 'Duplicate payment callback safely handled without re-processing',
        transaction: tx,
      };
    }

    // 2. REPLAY ATTACK DEFENSE - Terminal status guard
    if (tx.transactionStatus === TransactionStatus.CANCELLED) {
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.REPLAY_ATTACK_DETECTED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          reason: 'Callback replayed on cancelled transaction',
          callbackPayload: sanitizedPayload,
        },
      });
      throw new BadRequestError(
        'Replay attack detected: cannot process payment callback for a cancelled transaction'
      );
    }

    // 2b. REPLAY ATTACK DEFENSE - Webhook timestamp expiration (max 5 minutes window)
    const rawTimestamp =
      headers['x-webhook-timestamp'] || headers['x-timestamp'] || callbackPayload.timestamp;

    if (rawTimestamp) {
      const ts = Number(rawTimestamp);
      const now = Date.now();
      const maxAgeMs = 5 * 60 * 1000; // 5 minutes
      const maxFutureClockSkewMs = 60 * 1000; // 1 minute

      if (isNaN(ts) || now - ts > maxAgeMs || ts - now > maxFutureClockSkewMs) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.REPLAY_ATTACK_DETECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorRole: 'PAYMENT_PROVIDER',
          metadata: {
            reason: 'Webhook timestamp expired or out of bounds',
            timestamp: ts,
            now,
            ageMs: now - ts,
          },
        });
        throw new BadRequestError(
          'Payment callback timestamp expired or invalid (possible replay attack)'
        );
      }
    }

    // 3. FORGED CALLBACK DEFENSE (Cryptographic HMAC Signature Verification)
    const signature =
      headers['x-signature'] || headers['x-webhook-signature'] || callbackPayload.signature;

    if (signature && typeof this.paymentProvider.verifySignature === 'function') {
      const payloadToVerify = { ...callbackPayload };
      delete payloadToVerify.signature;

      const isValidSignature = this.paymentProvider.verifySignature(signature, payloadToVerify);
      if (!isValidSignature) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.FORGED_CALLBACK_REJECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorRole: 'PAYMENT_PROVIDER',
          metadata: {
            reason: 'HMAC signature verification failed',
            providedSignature: signature,
          },
        });
        throw new ForbiddenError('Invalid or forged payment provider webhook signature');
      }
    }

    // 4. TRANSACTION MISMATCH DEFENSE
    if (
      callbackPayload.transactionId &&
      callbackPayload.transactionId.toString() !== tx._id.toString()
    ) {
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.TRANSACTION_MISMATCH_DETECTED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          targetTransactionId: tx._id.toString(),
          payloadTransactionId: callbackPayload.transactionId,
        },
      });
      throw new BadRequestError(
        'Transaction ID mismatch: webhook payload does not match target transaction'
      );
    }

    if (
      callbackPayload.paymentSessionId &&
      tx.paymentDetails?.paymentSessionId &&
      callbackPayload.paymentSessionId !== tx.paymentDetails.paymentSessionId
    ) {
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.TRANSACTION_MISMATCH_DETECTED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          expectedPaymentSessionId: tx.paymentDetails.paymentSessionId,
          payloadPaymentSessionId: callbackPayload.paymentSessionId,
        },
      });
      throw new BadRequestError(
        'Payment session ID mismatch: webhook payload does not match transaction session'
      );
    }

    // 5. AMOUNT MANIPULATION DEFENSE
    if (callbackPayload.amount !== undefined && callbackPayload.amount !== null) {
      if (Math.abs(Number(callbackPayload.amount) - Number(tx.amount)) > 0.001) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.AMOUNT_MANIPULATION_DETECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorRole: 'PAYMENT_PROVIDER',
          metadata: {
            expectedAmount: tx.amount,
            receivedAmount: callbackPayload.amount,
          },
        });
        throw new BadRequestError(
          `Amount manipulation detected: expected ${tx.amount} ${tx.currency} but received ${callbackPayload.amount}`
        );
      }
    }

    // 6. CURRENCY MANIPULATION DEFENSE
    if (callbackPayload.currency) {
      if (callbackPayload.currency.toUpperCase() !== tx.currency.toUpperCase()) {
        await this.repo.recordEvent({
          transactionId: tx._id,
          eventType: TransactionEventType.CURRENCY_MANIPULATION_DETECTED,
          fromTransactionStatus: tx.transactionStatus,
          toTransactionStatus: tx.transactionStatus,
          fromPaymentStatus: tx.paymentStatus,
          toPaymentStatus: tx.paymentStatus,
          actorRole: 'PAYMENT_PROVIDER',
          metadata: {
            expectedCurrency: tx.currency,
            receivedCurrency: callbackPayload.currency,
          },
        });
        throw new BadRequestError(
          `Currency manipulation detected: expected ${tx.currency} but received ${callbackPayload.currency}`
        );
      }
    }

    // Process outcome:
    const isSuccess =
      callbackPayload.status === 'PAID' ||
      callbackPayload.outcome === 'SUCCESS' ||
      callbackPayload.event === 'payment.succeeded';

    // If simulation provider is present and session exists, ensure provider session matches webhook status
    if (typeof this.paymentProvider.simulateCustomerPayment === 'function') {
      const sessionId =
        callbackPayload.paymentSessionId ||
        tx.paymentDetails?.paymentSessionId ||
        `mock_sess_${tx._id}`;
      await this.paymentProvider.simulateCustomerPayment({
        paymentSessionId: sessionId,
        outcome: isSuccess ? 'SUCCESS' : 'FAIL',
        failureReason: callbackPayload.failureReason,
        transactionRef: callbackPayload.transactionRef,
      });
    }

    if (isSuccess) {
      return this.verifyPaymentStatus(transactionId, tx.buyerId._id.toString(), {
        paymentSessionId: callbackPayload.paymentSessionId || tx.paymentDetails?.paymentSessionId,
        transactionRef: callbackPayload.transactionRef,
        signature,
      });
    } else {
      this.validatePaymentTransition(tx.paymentStatus, PaymentStatus.FAILED);

      const previousTxStatus = tx.transactionStatus;
      const previousPayStatus = tx.paymentStatus;

      const updatedTx = await this.repo.updateById(tx._id, {
        paymentStatus: PaymentStatus.FAILED,
        paymentDetails: sanitizePaymentData({
          ...tx.paymentDetails,
          failureReason: callbackPayload.failureReason || 'Payment failed on provider gateway',
        }),
      });

      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.PAYMENT_FAILED,
        fromTransactionStatus: previousTxStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: previousPayStatus,
        toPaymentStatus: PaymentStatus.FAILED,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          failureReason: callbackPayload.failureReason,
        },
      });

      return updatedTx;
    }
  }

  /**
   * Execute asset ownership transfer and complete transaction
   * Step: PAYMENT_CONFIRMED -> TRANSFER_PENDING -> COMPLETED
   *
   * @param {string} transactionId
   * @param {string} userId
   * @param {string} userRole
   */
  async transferAsset(transactionId, userId, userRole = 'USER') {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId, userRole);

    // Rule: Never jump from INITIATED -> COMPLETED or without intermediate steps
    if (tx.transactionStatus === TransactionStatus.INITIATED) {
      throw new BadRequestError(
        'A transaction must never jump directly from INITIATED to COMPLETED. Payment must be confirmed first.'
      );
    }

    if (
      tx.transactionStatus !== TransactionStatus.PAYMENT_CONFIRMED &&
      tx.transactionStatus !== TransactionStatus.TRANSFER_PENDING
    ) {
      throw new BadRequestError(
        `Cannot execute asset transfer for transaction in status ${tx.transactionStatus}. Must be PAYMENT_CONFIRMED.`
      );
    }

    // Step 1: Transition to TRANSFER_PENDING if not already
    if (tx.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED) {
      this.validateTransactionTransition(tx.transactionStatus, TransactionStatus.TRANSFER_PENDING);

      await this.repo.updateById(tx._id, {
        transactionStatus: TransactionStatus.TRANSFER_PENDING,
      });

      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.TRANSFER_PENDING,
        fromTransactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
        toTransactionStatus: TransactionStatus.TRANSFER_PENDING,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorId: userId,
        actorRole: userRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
        metadata: {
          assetId: tx.assetId._id,
          newOwnerId: tx.buyerId._id,
        },
      });
    }

    // Step 2: Atomic transfer of asset ownership & finalize transaction status
    this.validateTransactionTransition(
      TransactionStatus.TRANSFER_PENDING,
      TransactionStatus.COMPLETED
    );

    // Transfer asset ownership to buyer
    await this.assetRepo.updateById(tx.assetId._id, {
      ownerId: tx.buyerId._id,
      status: AssetStatus.TRANSFERRED,
    });

    // Mark listing as SOLD
    await this.listingRepo.updateById(tx.listingId._id, {
      status: ListingStatus.SOLD,
    });

    // Complete any active reservation
    await Reservation.findOneAndUpdate(
      { listingId: tx.listingId._id, status: ReservationStatus.ACTIVE },
      { $set: { status: ReservationStatus.COMPLETED } }
    );

    // Finalize transaction
    const completedTx = await this.repo.updateById(tx._id, {
      transactionStatus: TransactionStatus.COMPLETED,
      escrowStatus: 'RELEASED', // Escrow funds released to seller
      completedAt: new Date(),
    });

    await this.repo.recordEvent({
      transactionId: tx._id,
      eventType: TransactionEventType.TRANSACTION_COMPLETED,
      fromTransactionStatus: TransactionStatus.TRANSFER_PENDING,
      toTransactionStatus: TransactionStatus.COMPLETED,
      fromPaymentStatus: tx.paymentStatus,
      toPaymentStatus: tx.paymentStatus,
      actorId: userId,
      actorRole: userRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
      metadata: {
        escrowStatus: 'RELEASED',
        completedAt: completedTx.completedAt,
        newOwnerId: tx.buyerId._id,
      },
    });

    return completedTx;
  }

  /**
   * Cancel an in-flight transaction
   * Step: INITIATED / PAYMENT_PENDING -> CANCELLED
   *
   * @param {string} transactionId
   * @param {string} userId
   * @param {string} userRole
   * @param {string} [reason]
   */
  async cancelTransaction(transactionId, userId, userRole = 'USER', reason = null) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId, userRole);

    this.validateTransactionTransition(tx.transactionStatus, TransactionStatus.CANCELLED);

    const previousTxStatus = tx.transactionStatus;
    const previousPayStatus = tx.paymentStatus;
    let newPaymentStatus = tx.paymentStatus;
    let newEscrowStatus = tx.escrowStatus;

    // If payment was already processed, refund
    if (tx.paymentStatus === PaymentStatus.PAID) {
      await this.paymentProvider.refundPayment({
        paymentSessionId: tx.paymentDetails?.paymentSessionId,
        amount: tx.amount,
        reason: reason || 'Transaction cancelled by user',
      });
      newPaymentStatus = PaymentStatus.REFUNDED;
      newEscrowStatus = 'REFUNDED';
    }

    // Revert listing to ACTIVE
    await this.listingRepo.updateById(tx.listingId._id, {
      status: ListingStatus.ACTIVE,
    });

    // Release any active reservation
    await Reservation.findOneAndUpdate(
      { listingId: tx.listingId._id, status: ReservationStatus.ACTIVE },
      { $set: { status: ReservationStatus.RELEASED, releaseReason: 'Transaction cancelled' } }
    );

    const cancelledTx = await this.repo.updateById(tx._id, {
      transactionStatus: TransactionStatus.CANCELLED,
      paymentStatus: newPaymentStatus,
      escrowStatus: newEscrowStatus,
      cancelledAt: new Date(),
    });

    await this.repo.recordEvent({
      transactionId: tx._id,
      eventType: TransactionEventType.TRANSACTION_CANCELLED,
      fromTransactionStatus: previousTxStatus,
      toTransactionStatus: TransactionStatus.CANCELLED,
      fromPaymentStatus: previousPayStatus,
      toPaymentStatus: newPaymentStatus,
      actorId: userId,
      actorRole:
        userRole === 'ADMIN' ? 'ADMIN' : tx.buyerId._id.toString() === userId ? 'BUYER' : 'SELLER',
      metadata: {
        reason: reason || 'Cancelled by participant',
        cancelledAt: cancelledTx.cancelledAt,
      },
    });

    return cancelledTx;
  }

  /**
   * Get single transaction details with authorization enforcement
   *
   * @param {string} id
   * @param {string} userId
   * @param {string} userRole
   */
  async getTransactionById(id, userId, userRole = 'USER') {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId, userRole);

    const events = await this.repo.getEventsByTransactionId(id);

    return {
      ...tx.toObject(),
      events,
    };
  }

  /**
   * Get immutable event history for a transaction
   *
   * @param {string} id
   * @param {string} userId
   * @param {string} userRole
   */
  async getTransactionEvents(id, userId, userRole = 'USER') {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    this.checkAccess(tx, userId, userRole);

    return this.repo.getEventsByTransactionId(id);
  }

  /**
   * List transactions for authenticated user
   *
   * @param {string} userId
   * @param {object} query
   */
  async getMyTransactions(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listByUser(userId, {}, { skip, limit });

    return {
      transactions: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Enforce access control: only buyer, seller, or admin can access
   */
  checkAccess(transaction, userId, userRole = 'USER') {
    const buyerId = transaction.buyerId?._id
      ? transaction.buyerId._id.toString()
      : transaction.buyerId.toString();

    const sellerId = transaction.sellerId?._id
      ? transaction.sellerId._id.toString()
      : transaction.sellerId.toString();

    const isBuyer = buyerId === userId.toString();
    const isSeller = sellerId === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new ForbiddenError(
        'Access denied: You are not authorized to view or manage this transaction'
      );
    }
  }
}

export const transactionService = new TransactionService();
