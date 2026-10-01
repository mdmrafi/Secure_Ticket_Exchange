import mongoose from 'mongoose';
import { transactionRepository } from './transaction.repository.js';
import { listingRepository } from '../listings/listing.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { User } from '../users/user.model.js';
import { Asset } from '../assets/asset.model.js';
import { Listing } from '../listings/listing.model.js';
import { Reservation, ReservationStatus } from '../listings/reservation.model.js';
import { mockPaymentProvider } from './providers/mock-payment.provider.js';
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

// Strict State Transition Matrix for Transactions
export const ALLOWED_TRANSACTION_TRANSITIONS = {
  [TransactionStatus.INITIATED]: [
    TransactionStatus.PAYMENT_PENDING,
    TransactionStatus.CANCELLED,
  ],
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
  [TransactionStatus.TRANSFER_PENDING]: [
    TransactionStatus.COMPLETED,
    TransactionStatus.DISPUTED,
  ],
  [TransactionStatus.COMPLETED]: [], // Terminal state
  [TransactionStatus.CANCELLED]: [], // Terminal state
  [TransactionStatus.DISPUTED]: [
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
  ],
};

// Strict State Transition Matrix for Payments
export const ALLOWED_PAYMENT_TRANSITIONS = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.AUTHORIZED,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.AUTHORIZED]: [
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING, // allow retry
  ],
  [PaymentStatus.REFUNDED]: [], // Terminal
};

export class TransactionService {
  constructor(
    repo = transactionRepository,
    listingRepo = listingRepository,
    assetRepo = assetRepository,
    paymentProvider = mockPaymentProvider
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
      throw new BadRequestError(`Listing is no longer active or available (Status: ${listing.status})`);
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

    return transaction;
  }

  /**
   * Create checkout/payment session with mock payment provider
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

    // Call mock payment gateway
    const paymentSession = await this.paymentProvider.createPaymentSession({
      transactionId: tx._id.toString(),
      amount: tx.amount,
      currency: tx.currency,
      buyerId: userId,
    });

    const previousTxStatus = tx.transactionStatus;
    const previousPayStatus = tx.paymentStatus;

    const updatedTx = await this.repo.updateById(tx._id, {
      transactionStatus: TransactionStatus.PAYMENT_PENDING,
      paymentDetails: {
        ...tx.paymentDetails,
        provider: paymentSession.provider,
        paymentSessionId: paymentSession.paymentSessionId,
      },
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
      metadata: {
        paymentSessionId: paymentSession.paymentSessionId,
        checkoutUrl: paymentSession.checkoutUrl,
      },
    });

    return {
      transaction: updatedTx,
      paymentSession,
    };
  }

  /**
   * Process simulated payment outcome
   * Success: PAYMENT_PENDING -> PAYMENT_CONFIRMED, PENDING -> PAID
   * Failure: PENDING -> FAILED
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

    const outcome = options.outcome || 'SUCCESS';
    const paymentResult = await this.paymentProvider.processPayment({
      paymentSessionId: tx.paymentDetails?.paymentSessionId || `mock_sess_${tx._id}`,
      outcome,
      failureReason: options.failureReason,
    });

    if (outcome === 'SUCCESS') {
      this.validatePaymentTransition(tx.paymentStatus, PaymentStatus.PAID);
      this.validateTransactionTransition(tx.transactionStatus, TransactionStatus.PAYMENT_CONFIRMED);

      const previousTxStatus = tx.transactionStatus;
      const previousPayStatus = tx.paymentStatus;

      const updatedTx = await this.repo.updateById(tx._id, {
        transactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        escrowStatus: 'HELD', // Funds now held securely in escrow
        paymentDetails: {
          ...tx.paymentDetails,
          transactionRef: paymentResult.transactionRef,
          paidAt: paymentResult.paidAt,
          failureReason: null,
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
          transactionRef: paymentResult.transactionRef,
          paidAt: paymentResult.paidAt,
          escrowStatus: 'HELD',
        },
      });

      return updatedTx;
    } else {
      // Failed payment attempt
      this.validatePaymentTransition(tx.paymentStatus, PaymentStatus.FAILED);

      const previousTxStatus = tx.transactionStatus;
      const previousPayStatus = tx.paymentStatus;

      const updatedTx = await this.repo.updateById(tx._id, {
        paymentStatus: PaymentStatus.FAILED,
        paymentDetails: {
          ...tx.paymentDetails,
          failureReason: paymentResult.failureReason,
        },
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
          failureReason: paymentResult.failureReason,
        },
      });

      return updatedTx;
    }
  }

  /**
   * Handle webhook / callback from payment provider with idempotency protection
   *
   * @param {string} transactionId
   * @param {object} callbackPayload
   */
  async handlePaymentCallback(transactionId, callbackPayload) {
    const tx = await this.repo.findById(transactionId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }

    // Idempotency check: duplicate callback handling
    const isAlreadyPaid =
      tx.paymentStatus === PaymentStatus.PAID ||
      tx.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED ||
      tx.transactionStatus === TransactionStatus.TRANSFER_PENDING ||
      tx.transactionStatus === TransactionStatus.COMPLETED;

    if (isAlreadyPaid) {
      // Record duplicate callback audit event without altering state or failing
      await this.repo.recordEvent({
        transactionId: tx._id,
        eventType: TransactionEventType.DUPLICATE_CALLBACK_IGNORED,
        fromTransactionStatus: tx.transactionStatus,
        toTransactionStatus: tx.transactionStatus,
        fromPaymentStatus: tx.paymentStatus,
        toPaymentStatus: tx.paymentStatus,
        actorRole: 'PAYMENT_PROVIDER',
        metadata: {
          callbackPayload,
          message: 'Duplicate payment callback safely handled without re-processing',
        },
      });

      return {
        idempotent: true,
        message: 'Duplicate payment callback received and safely ignored',
        transaction: tx,
      };
    }

    // Process callback outcome
    const outcome = callbackPayload.status === 'PAID' || callbackPayload.outcome === 'SUCCESS' ? 'SUCCESS' : 'FAIL';
    return this.processPayment(transactionId, tx.buyerId._id.toString(), {
      outcome,
      failureReason: callbackPayload.failureReason,
    });
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

    if (tx.transactionStatus !== TransactionStatus.PAYMENT_CONFIRMED && tx.transactionStatus !== TransactionStatus.TRANSFER_PENDING) {
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
    this.validateTransactionTransition(TransactionStatus.TRANSFER_PENDING, TransactionStatus.COMPLETED);

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
      actorRole: userRole === 'ADMIN' ? 'ADMIN' : (tx.buyerId._id.toString() === userId ? 'BUYER' : 'SELLER'),
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
