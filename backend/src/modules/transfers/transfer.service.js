import mongoose from 'mongoose';
import { TransferRepository } from './transfer.repository.js';
import { TransferPolicy } from './transfer.policy.js';
import { MockTransferProvider } from './providers/mock-transfer.provider.js';
import {
  TransferRequestStatus,
  TransferEventType,
  AssetStatus,
  TransactionStatus,
  ListingStatus,
} from '../../common/constants/asset-types.constant.js';
import { Asset } from '../assets/asset.model.js';
import { User } from '../users/user.model.js';
import { Transaction } from '../transactions/transaction.model.js';
import { Listing } from '../listings/listing.model.js';
import { Reservation, ReservationStatus } from '../listings/reservation.model.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors/index.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { getAssetAdapter, hasAssetAdapter } from '../assets/adapters/index.js';

/**
 * Strict State Transition Matrix for Asset Transfers
 * A transfer request must follow strict lifecycle progressions:
 * REQUESTED -> APPROVED -> PROCESSING -> COMPLETED
 *
 * Terminal states (COMPLETED, REJECTED, CANCELLED, NOT_ELIGIBLE) cannot transition further.
 * Direct jumps like REQUESTED -> COMPLETED are prohibited.
 */
export const ALLOWED_TRANSFER_TRANSITIONS = {
  [TransferRequestStatus.NOT_ELIGIBLE]: [], // Terminal state
  [TransferRequestStatus.REQUESTED]: [
    TransferRequestStatus.APPROVED,
    TransferRequestStatus.REJECTED,
    TransferRequestStatus.CANCELLED,
    TransferRequestStatus.NOT_ELIGIBLE,
  ],
  [TransferRequestStatus.APPROVED]: [
    TransferRequestStatus.PROCESSING,
    TransferRequestStatus.REJECTED,
    TransferRequestStatus.CANCELLED,
  ],
  [TransferRequestStatus.PROCESSING]: [
    TransferRequestStatus.COMPLETED,
    TransferRequestStatus.REJECTED,
  ],
  [TransferRequestStatus.COMPLETED]: [], // Terminal state
  [TransferRequestStatus.REJECTED]: [], // Terminal state
  [TransferRequestStatus.CANCELLED]: [], // Terminal state
};

export class TransferService {
  /**
   * @param {TransferRepository} [repo]
   * @param {object} [provider]
   */
  constructor(repo = new TransferRepository(), provider = new MockTransferProvider()) {
    this.repo = repo;
    this.provider = provider;
  }

  /**
   * Validate strict state transition according to transition matrix
   *
   * @param {string} currentStatus
   * @param {string} targetStatus
   */
  validateStateTransition(currentStatus, targetStatus) {
    const allowedNext = ALLOWED_TRANSFER_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      throw new BadRequestError(
        `Invalid transfer state transition: Cannot transition from ${currentStatus} to ${targetStatus}. ` +
          (allowedNext.length > 0
            ? `Allowed next states: [${allowedNext.join(', ')}]. Intermediate steps must be observed.`
            : 'This state is terminal and cannot transition further.')
      );
    }
  }

  /**
   * Check access permissions for a transfer request
   *
   * @param {object} transferReq
   * @param {string} userId
   * @param {string} [userRole='USER']
   */
  checkAccess(transferReq, userId, userRole = 'USER') {
    if (userRole === 'ADMIN') return true;

    const uId = userId ? userId.toString() : '';
    const fromId = transferReq.fromUserId?._id
      ? transferReq.fromUserId._id.toString()
      : transferReq.fromUserId?.toString();
    const toId = transferReq.toUserId?._id
      ? transferReq.toUserId._id.toString()
      : transferReq.toUserId?.toString();

    if (uId !== fromId && uId !== toId) {
      throw new ForbiddenError('You are not authorized to access this asset transfer request');
    }
    return true;
  }

  /**
   * Evaluate eligibility of an asset for transfer
   *
   * @param {string} assetId
   * @param {object} [context]
   * @param {string} [context.fromUserId]
   * @param {string} [context.toUserId]
   */
  async checkEligibility(assetId, context = {}) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    let fromUser = null;
    let toUser = null;

    if (context.fromUserId) {
      fromUser = await User.findById(context.fromUserId);
    }
    if (context.toUserId) {
      toUser = await User.findById(context.toUserId);
    }

    let activeProvider = this.provider;
    if (hasAssetAdapter(asset.assetType)) {
      const adapter = getAssetAdapter(asset.assetType);
      if (adapter.transferProvider) {
        activeProvider = adapter.transferProvider;
      }
    }

    const result = TransferPolicy.evaluateEligibility(asset, {
      fromUser,
      toUser,
      provider: activeProvider,
    });

    return {
      assetId: asset._id,
      assetType: asset.assetType,
      isTransferable: asset.isTransferable,
      ...result,
    };
  }

  /**
   * Initiate / Request an Asset Transfer
   *
   * Enforces:
   * 1. Asset existence and verification status.
   * 2. Legal / policy eligibility check (TransferPolicy).
   * 3. Ownership verification (fromUser must be current asset owner).
   * 4. Transaction verification (if linked to a transaction, transaction must be paid/escrowed).
   * 5. Prevention of concurrent active transfers for the same asset.
   *
   * @param {object} params
   * @param {string} params.assetId
   * @param {string} params.fromUserId
   * @param {string} params.toUserId
   * @param {string} [params.transactionId]
   * @param {object} [params.metadata]
   * @param {string} actorId
   * @param {string} [actorRole='USER']
   */
  async requestTransfer(params, actorId, actorRole = 'USER') {
    const { assetId, fromUserId, toUserId, transactionId, metadata = {} } = params;

    // 1. Fetch Asset
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // 2. Fetch Users
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
    ]);

    if (!fromUser) throw new NotFoundError('Originating owner user not found');
    if (!toUser) throw new NotFoundError('Recipient user not found');

    if (fromUserId.toString() === toUserId.toString()) {
      throw new BadRequestError('Cannot transfer asset to oneself');
    }

    // 3. Ownership Verification
    if (asset.ownerId.toString() !== fromUserId.toString()) {
      throw new ForbiddenError(
        'Ownership verification failed: fromUserId is not the current legal owner of this asset'
      );
    }

    // Actor must be the owner or an admin
    if (actorRole !== 'ADMIN' && actorId.toString() !== fromUserId.toString()) {
      throw new ForbiddenError('Only the asset owner or an admin can initiate a transfer request');
    }

    // 4. Transaction Verification (if linked)
    let transaction = null;
    if (transactionId) {
      transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new NotFoundError('Linked transaction not found');
      }

      if (transaction.sellerId.toString() !== fromUserId.toString()) {
        throw new BadRequestError('Transaction sellerId does not match transfer fromUserId');
      }
      if (transaction.buyerId.toString() !== toUserId.toString()) {
        throw new BadRequestError('Transaction buyerId does not match transfer toUserId');
      }
      if (transaction.assetId.toString() !== assetId.toString()) {
        throw new BadRequestError('Transaction assetId does not match transfer assetId');
      }

      const validTxStatuses = [
        TransactionStatus.PAYMENT_CONFIRMED,
        TransactionStatus.TRANSFER_PENDING,
      ];
      if (!validTxStatuses.includes(transaction.transactionStatus)) {
        throw new BadRequestError(
          `Cannot transfer asset for transaction in status ${transaction.transactionStatus}. Payment must be confirmed first.`
        );
      }
    }

    // 5. Evaluate Legal & Policy Transferability (TransferPolicy)
    let activeProvider = this.provider;
    if (hasAssetAdapter(asset.assetType)) {
      const adapter = getAssetAdapter(asset.assetType);
      if (adapter.transferProvider) {
        activeProvider = adapter.transferProvider;
      }
    }

    const eligibility = TransferPolicy.evaluateEligibility(asset, {
      fromUser,
      toUser,
      provider: activeProvider,
    });

    if (!eligibility.eligible) {
      // Create request in NOT_ELIGIBLE state to maintain complete audit history
      const ineligibleRequest = await this.repo.create({
        assetId: asset._id,
        fromUserId: fromUser._id,
        toUserId: toUser._id,
        transactionId: transaction ? transaction._id : null,
        status: TransferRequestStatus.NOT_ELIGIBLE,
        provider: activeProvider.providerId,
        eligibilityResult: eligibility,
        rejectionReason: eligibility.reason,
        metadata: {
          ...metadata,
          policyCode: eligibility.policyCode,
        },
      });

      await this.repo.recordEvent({
        transferRequestId: ineligibleRequest._id,
        assetId: asset._id,
        eventType: TransferEventType.TRANSFER_ELIGIBILITY_EVALUATED,
        fromStatus: 'NONE',
        toStatus: TransferRequestStatus.NOT_ELIGIBLE,
        actorId,
        actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
        metadata: {
          eligible: false,
          policyCode: eligibility.policyCode,
          reason: eligibility.reason,
        },
      });

      throw new BadRequestError(
        `Asset transfer ineligible: ${eligibility.reason} (Policy Code: ${eligibility.policyCode})`
      );
    }

    // 6. Check for concurrent active transfer for the same asset
    const activeTransfer = await this.repo.findActiveByAssetId(assetId);
    if (activeTransfer) {
      throw new ConflictError(
        `An active transfer request (${activeTransfer._id}) is already in progress for this asset`
      );
    }

    // 7. Create TransferRequest in REQUESTED status
    const transferReq = await this.repo.create({
      assetId: asset._id,
      fromUserId: fromUser._id,
      toUserId: toUser._id,
      transactionId: transaction ? transaction._id : null,
      status: TransferRequestStatus.REQUESTED,
      provider: activeProvider.providerId,
      eligibilityResult: eligibility,
      metadata,
    });

    // 8. Record audit event
    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: asset._id,
      eventType: TransferEventType.TRANSFER_REQUEST_CREATED,
      fromStatus: 'NONE',
      toStatus: TransferRequestStatus.REQUESTED,
      actorId,
      actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SELLER',
      metadata: {
        fromUserId: fromUser._id,
        toUserId: toUser._id,
        transactionId: transaction ? transaction._id : null,
      },
    });

    return transferReq;
  }

  /**
   * Approve a transfer request
   * Step: REQUESTED -> APPROVED
   *
   * @param {string} requestId
   * @param {string} actorId
   * @param {string} [actorRole='USER']
   */
  async approveTransfer(requestId, actorId, actorRole = 'USER') {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }

    this.checkAccess(transferReq, actorId, actorRole);
    this.validateStateTransition(transferReq.status, TransferRequestStatus.APPROVED);

    const previousStatus = transferReq.status;
    const updated = await this.repo.updateById(requestId, {
      status: TransferRequestStatus.APPROVED,
    });

    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: transferReq.assetId._id,
      eventType: TransferEventType.TRANSFER_APPROVED,
      fromStatus: previousStatus,
      toStatus: TransferRequestStatus.APPROVED,
      actorId,
      actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SELLER',
      metadata: { approvedBy: actorId },
    });

    return updated;
  }

  /**
   * Execute asset transfer workflow
   * Sequence: APPROVED -> PROCESSING -> COMPLETED (or REJECTED with rollback on provider failure)
   *
   * Requirements:
   * 1. Never jump directly from REQUESTED -> COMPLETED without intermediate steps.
   * 2. The system must never modify railway identity information directly unless an authorized
   *    external provider explicitly supports it.
   * 3. Rollback & failure handling: if external provider fails, asset ownership is not mutated,
   *    request transitions to REJECTED, and audit log records failure.
   *
   * @param {string} requestId
   * @param {string} actorId
   * @param {object} [options]
   * @param {boolean} [options.simulateFailure]
   * @param {boolean} [options.modifyRailwayIdentity]
   * @param {string} [actorRole='USER']
   */
  async executeTransfer(requestId, actorId, options = {}, actorRole = 'USER') {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }

    this.checkAccess(transferReq, actorId, actorRole);

    // Rule: Direct jumps (e.g. REQUESTED -> COMPLETED) strictly prohibited
    if (transferReq.status === TransferRequestStatus.REQUESTED) {
      throw new BadRequestError(
        'Direct transfer execution from REQUESTED is prohibited. Transfer must be APPROVED first.'
      );
    }

    // Step 1: Transition APPROVED -> PROCESSING
    if (transferReq.status === TransferRequestStatus.APPROVED) {
      this.validateStateTransition(transferReq.status, TransferRequestStatus.PROCESSING);

      await this.repo.updateById(requestId, {
        status: TransferRequestStatus.PROCESSING,
      });

      await this.repo.recordEvent({
        transferRequestId: transferReq._id,
        assetId: transferReq.assetId._id,
        eventType: TransferEventType.TRANSFER_PROCESSING_STARTED,
        fromStatus: TransferRequestStatus.APPROVED,
        toStatus: TransferRequestStatus.PROCESSING,
        actorId,
        actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
        metadata: { initiatedAt: new Date().toISOString() },
      });
    } else if (transferReq.status !== TransferRequestStatus.PROCESSING) {
      this.validateStateTransition(transferReq.status, TransferRequestStatus.PROCESSING);
    }

    // Refresh transfer request state
    const processingReq = await this.repo.findById(requestId);
    const asset = processingReq.assetId;
    const fromUser = processingReq.fromUserId;
    const toUser = processingReq.toUserId;

    // Step 2: Railway Identity Protection Enforcement
    // "The system must never modify railway identity information directly unless an authorized
    // external provider explicitly supports it."
    if (TransferPolicy.isRailwayTicket(asset)) {
      const allowsModification = TransferPolicy.allowsIdentityModification(asset, this.provider);
      if (options.modifyRailwayIdentity && !allowsModification) {
        // Rollback & reject
        await this.handleFailureAndRollback(
          processingReq,
          'Unauthorized direct modification of railway ticket passenger identity is strictly prohibited',
          actorId,
          actorRole
        );
        throw new ForbiddenError(
          'Unauthorized direct modification of railway ticket passenger identity is strictly prohibited'
        );
      }
    }

    // Step 3: Call Transfer Provider (via AssetAdapter if registered, or default provider)
    try {
      let activeProvider = this.provider;
      if (hasAssetAdapter(asset.assetType)) {
        const adapter = getAssetAdapter(asset.assetType);
        if (adapter.transferProvider) {
          activeProvider = adapter.transferProvider;
        }
      }

      const providerResult = await activeProvider.transfer(asset, fromUser, toUser, options);

      if (!providerResult.success) {
        // Step 4A: Provider failure -> Rollback handling & transition to REJECTED
        const rejectedReq = await this.handleFailureAndRollback(
          processingReq,
          providerResult.error || 'Transfer provider failed to complete asset transfer',
          actorId,
          actorRole
        );
        return rejectedReq;
      }

      // Step 4B: Provider succeeded -> Transition to COMPLETED
      this.validateStateTransition(
        TransferRequestStatus.PROCESSING,
        TransferRequestStatus.COMPLETED
      );

      // Reassign asset ownership and status
      const updatedMetadata = {
        ...(asset.metadata || {}),
        ...(providerResult.updatedMetadata || {}),
      };

      await Asset.findByIdAndUpdate(asset._id, {
        $set: {
          ownerId: toUser._id,
          status: AssetStatus.TRANSFERRED,
          metadata: updatedMetadata,
        },
      });

      // If linked to transaction, finalize transaction & listing
      if (processingReq.transactionId) {
        await Transaction.findByIdAndUpdate(processingReq.transactionId._id, {
          $set: {
            transactionStatus: TransactionStatus.COMPLETED,
            escrowStatus: 'RELEASED',
            completedAt: new Date(),
          },
        });

        if (processingReq.transactionId.listingId) {
          await Listing.findByIdAndUpdate(processingReq.transactionId.listingId, {
            $set: { status: ListingStatus.SOLD },
          });

          await Reservation.findOneAndUpdate(
            { listingId: processingReq.transactionId.listingId, status: ReservationStatus.ACTIVE },
            { $set: { status: ReservationStatus.COMPLETED } }
          );
        }
      }

      // Finalize transfer request
      const completedReq = await this.repo.updateById(requestId, {
        status: TransferRequestStatus.COMPLETED,
        completedAt: new Date(),
        providerTransferId: providerResult.externalTransferId,
        metadata: {
          ...(processingReq.metadata || {}),
          providerResponse: providerResult.providerResponse,
        },
      });

      await this.repo.recordEvent({
        transferRequestId: completedReq._id,
        assetId: asset._id,
        eventType: TransferEventType.TRANSFER_COMPLETED,
        fromStatus: TransferRequestStatus.PROCESSING,
        toStatus: TransferRequestStatus.COMPLETED,
        actorId,
        actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
        metadata: {
          externalTransferId: providerResult.externalTransferId,
          previousOwnerId: fromUser._id,
          newOwnerId: toUser._id,
          completedAt: completedReq.completedAt,
        },
      });

      // Asynchronously dispatch transfer.completed event for background jobs
      publishEvent(
        EventNames.TRANSFER_COMPLETED,
        {
          transferId: completedReq._id.toString(),
          assetId: asset._id.toString(),
          fromUserId: fromUser._id.toString(),
          toUserId: toUser._id.toString(),
          transactionId:
            processingReq.transactionId?._id?.toString() ||
            processingReq.transactionId?.toString() ||
            null,
          toUserName: toUser.name,
          toUserEmail: toUser.email,
        },
        { id: actorId }
      ).catch(() => {});

      return completedReq;
    } catch (err) {
      // Step 4C: Uncaught exception / crash -> Rollback handling & transition to REJECTED
      return this.handleFailureAndRollback(
        processingReq,
        err.message || 'Unexpected error occurred during transfer execution',
        actorId,
        actorRole
      );
    }
  }

  /**
   * Rollback & failure handler
   * Restores asset state, transitions request to REJECTED, and records immutable audit events
   *
   * @param {object} transferReq
   * @param {string} failureReason
   * @param {string} actorId
   * @param {string} actorRole
   */
  async handleFailureAndRollback(transferReq, failureReason, actorId, actorRole = 'SYSTEM') {
    // 1. Verify and ensure asset ownership remains with original owner
    await Asset.findByIdAndUpdate(transferReq.assetId._id, {
      $set: {
        ownerId: transferReq.fromUserId._id,
        // Status remains unchanged or reverts to verified/listed
      },
    });

    // 2. Transition request to REJECTED
    this.validateStateTransition(transferReq.status, TransferRequestStatus.REJECTED);

    const updated = await this.repo.updateById(transferReq._id, {
      status: TransferRequestStatus.REJECTED,
      failureReason,
    });

    // 3. Record Rollback audit event
    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: transferReq.assetId._id,
      eventType: TransferEventType.TRANSFER_FAILED_ROLLBACK,
      fromStatus: transferReq.status,
      toStatus: TransferRequestStatus.REJECTED,
      actorId,
      actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
      metadata: {
        failureReason,
        rollbackAction: 'ASSET_OWNERSHIP_RETAINED',
        retainedOwnerId: transferReq.fromUserId._id,
      },
    });

    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: transferReq.assetId._id,
      eventType: TransferEventType.TRANSFER_REJECTED,
      fromStatus: transferReq.status,
      toStatus: TransferRequestStatus.REJECTED,
      actorId,
      actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
      metadata: { reason: failureReason },
    });

    return updated;
  }

  /**
   * Reject a transfer request
   * Step: REQUESTED -> REJECTED or APPROVED -> REJECTED
   *
   * @param {string} requestId
   * @param {string} actorId
   * @param {string} reason
   * @param {string} [actorRole='USER']
   */
  async rejectTransfer(requestId, actorId, reason = 'Transfer rejected', actorRole = 'USER') {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }

    this.checkAccess(transferReq, actorId, actorRole);
    this.validateStateTransition(transferReq.status, TransferRequestStatus.REJECTED);

    const previousStatus = transferReq.status;
    const updated = await this.repo.updateById(requestId, {
      status: TransferRequestStatus.REJECTED,
      rejectionReason: reason,
    });

    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: transferReq.assetId._id,
      eventType: TransferEventType.TRANSFER_REJECTED,
      fromStatus: previousStatus,
      toStatus: TransferRequestStatus.REJECTED,
      actorId,
      actorRole: actorRole === 'ADMIN' ? 'ADMIN' : 'SELLER',
      metadata: { reason, rejectedBy: actorId },
    });

    return updated;
  }

  /**
   * Cancel a transfer request
   * Step: REQUESTED -> CANCELLED or APPROVED -> CANCELLED
   *
   * @param {string} requestId
   * @param {string} actorId
   * @param {string} reason
   * @param {string} [actorRole='USER']
   */
  async cancelTransfer(
    requestId,
    actorId,
    reason = 'Transfer cancelled by user',
    actorRole = 'USER'
  ) {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }

    this.checkAccess(transferReq, actorId, actorRole);
    this.validateStateTransition(transferReq.status, TransferRequestStatus.CANCELLED);

    const previousStatus = transferReq.status;
    const updated = await this.repo.updateById(requestId, {
      status: TransferRequestStatus.CANCELLED,
      cancellationReason: reason,
    });

    await this.repo.recordEvent({
      transferRequestId: transferReq._id,
      assetId: transferReq.assetId._id,
      eventType: TransferEventType.TRANSFER_CANCELLED,
      fromStatus: previousStatus,
      toStatus: TransferRequestStatus.CANCELLED,
      actorId,
      actorRole:
        actorRole === 'ADMIN'
          ? 'ADMIN'
          : actorId.toString() === transferReq.fromUserId._id.toString()
            ? 'SELLER'
            : 'BUYER',
      metadata: { reason, cancelledBy: actorId },
    });

    return updated;
  }

  /**
   * Get transfer request by ID
   *
   * @param {string} requestId
   * @param {string} userId
   * @param {string} [userRole='USER']
   */
  async getTransferById(requestId, userId, userRole = 'USER') {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }
    this.checkAccess(transferReq, userId, userRole);
    return transferReq;
  }

  /**
   * Retrieve immutable event history for a transfer request
   *
   * @param {string} requestId
   * @param {string} userId
   * @param {string} [userRole='USER']
   */
  async getTransferEvents(requestId, userId, userRole = 'USER') {
    const transferReq = await this.repo.findById(requestId);
    if (!transferReq) {
      throw new NotFoundError('Transfer request not found');
    }
    this.checkAccess(transferReq, userId, userRole);
    return this.repo.getEventsByRequestId(requestId);
  }
}

export const transferService = new TransferService();
