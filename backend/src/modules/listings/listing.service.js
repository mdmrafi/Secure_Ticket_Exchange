import mongoose from 'mongoose';
import { listingRepository } from './listing.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { User } from '../users/user.model.js';
import { Listing } from './listing.model.js';
import { Reservation, ReservationStatus } from './reservation.model.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../common/errors/index.js';
import {
  AssetStatus,
  ListingStatus,
  VerificationStatus,
} from '../../common/constants/asset-types.constant.js';
import { KYCStatus } from '../kyc/kyc.constant.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { getAssetAdapter, hasAssetAdapter } from '../assets/adapters/index.js';

// Protected ticket identity and asset fields that sellers are strictly prohibited from mutating
export const PROTECTED_TICKET_IDENTITY_FIELDS = [
  'assetId',
  'sellerId',
  'pnr',
  'ticketNumber',
  'uniqueAssetIdentifier',
  'passengerName',
  'source',
  'destination',
  'fromStation',
  'toStation',
  'from',
  'to',
  'trainNumber',
  'trainName',
  'seat',
  'seats',
  'coach',
  'class',
  'seatClass',
  'journeyDate',
  'departureDate',
  'departureTime',
  'eventDate',
  'venue',
  'barcode',
  'ticketId',
  'originalFaceValue',
  'originalValue',
  'currency',
  'extractedFields',
  'ocrConfidence',
  'documentUrl',
  'metadata',
  'documents',
];

export class ListingService {
  constructor(repo = listingRepository, assetRepo = assetRepository) {
    this.repo = repo;
    this.assetRepo = assetRepo;
  }

  /**
   * Create a new marketplace listing for a verified asset
   *
   * Business Rules Enforced:
   * 1. Suspended users cannot create listings
   * 2. Only asset owner can list the asset
   * 3. Suspicious or rejected assets cannot be listed
   * 4. Asset must meet verification requirements (VERIFIED or PASSED)
   * 5. Asset must be transferable
   * 6. Same asset cannot have multiple active/reserved listings
   * 7. High-trust listing identity requirements (KYC)
   *
   * @param {string} sellerId
   * @param {object} data
   */
  async createListing(sellerId, data) {
    // 1. Verify seller account status
    const seller = await User.findById(sellerId).select('accountStatus kycStatus role');
    if (!seller) {
      throw new NotFoundError('Seller account not found');
    }

    if (seller.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Suspended users cannot create listings');
    }

    if (seller.accountStatus === 'DEACTIVATED') {
      throw new ForbiddenError('Deactivated user account cannot create listings');
    }

    // 2. Verify asset existence
    const asset = await this.assetRepo.findById(data.assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // 3. Rule: only asset owner can list
    const assetOwnerId = asset.ownerId?._id
      ? asset.ownerId._id.toString()
      : asset.ownerId.toString();
    if (assetOwnerId !== sellerId.toString()) {
      throw new ForbiddenError('You can only list assets that you own');
    }

    // 4. Rule: suspicious assets cannot be listed
    const isSuspicious =
      asset.verificationStatus === VerificationStatus.SUSPICIOUS ||
      asset.verificationStatus === VerificationStatus.FAILED ||
      asset.verificationStatus === VerificationStatus.FLAGGED ||
      asset.status === AssetStatus.REJECTED;

    if (isSuspicious) {
      throw new ForbiddenError('Suspicious or rejected assets cannot be listed on the marketplace');
    }

    // 5. Rule: asset must meet verification requirements
    const isVerified =
      asset.verificationStatus === VerificationStatus.VERIFIED ||
      asset.verificationStatus === VerificationStatus.PASSED ||
      asset.status === AssetStatus.VERIFIED;

    if (!isVerified) {
      throw new BadRequestError(
        `Asset must meet verification requirements before listing. Current status: ${asset.verificationStatus || asset.status}`
      );
    }

    // Resolve asset adapter for generic policy enforcement
    const adapter = hasAssetAdapter(asset.assetType) ? getAssetAdapter(asset.assetType) : null;

    // Check transferability (via adapter policy or asset flag)
    if (adapter && !adapter.transferPolicy.isTransferable(asset)) {
      throw new BadRequestError(
        'Asset is non-transferable and cannot be listed on the marketplace'
      );
    } else if (asset.isTransferable === false) {
      throw new BadRequestError(
        'Asset is non-transferable and cannot be listed on the marketplace'
      );
    }

    // 6. Rule: same asset cannot have multiple active listings
    const existingActiveListing = await this.repo.findOne({
      assetId: asset._id,
      status: { $in: [ListingStatus.ACTIVE, ListingStatus.RESERVED, 'PENDING_ESCROW'] },
    });

    if (existingActiveListing) {
      throw new ConflictError(
        'This asset already has an active or reserved listing on the marketplace'
      );
    }

    // Validate expiration date if provided
    let expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestError('Expiration date must be in the future');
    }

    const askingPrice = data.askingPrice !== undefined ? data.askingPrice : data.price;
    if (askingPrice === undefined || askingPrice <= 0) {
      throw new BadRequestError('A valid positive asking price is required');
    }

    // Anti-scalping & price validation via adapter policy
    if (adapter) {
      const priceValidation = adapter.transferPolicy.validateListingPrice(asset, askingPrice);
      if (!priceValidation.allowed) {
        throw new BadRequestError(priceValidation.reason || 'Invalid asking price');
      }
    }

    // 7. High-trust KYC listing verification guard (via adapter policy or default threshold)
    const isHighTrust = data.isHighTrust || asset.metadata?.isHighTrust || askingPrice >= 5000;
    const requiresKyc = adapter
      ? adapter.transferPolicy.isKycRequired(asset, askingPrice, seller)
      : isHighTrust;

    if ((requiresKyc || isHighTrust) && seller.kycStatus !== KYCStatus.VERIFIED) {
      throw new ForbiddenError(
        'Identity verification required: You must complete KYC verification before you can create high-trust asset listings.'
      );
    }

    // Delegate listing payload validation to adapter validator
    if (adapter) {
      const listingVal = adapter.validator.validateListing(asset, data, seller);
      if (!listingVal.valid) {
        throw new BadRequestError(listingVal.errors.join(', '));
      }
    }

    const status = data.status || ListingStatus.ACTIVE;

    // Create listing
    const listing = await this.repo.create({
      assetId: asset._id,
      sellerId,
      askingPrice,
      price: askingPrice,
      originalFaceValue: asset.originalValue || askingPrice,
      currency: data.currency || asset.currency || 'BDT',
      status,
      isEscrowProtected: data.isEscrowProtected !== undefined ? data.isEscrowProtected : true,
      expiresAt,
      notes: data.notes || '',
    });

    // Mark asset status as LISTED if active
    if (status === ListingStatus.ACTIVE) {
      await this.assetRepo.updateById(asset._id, { status: AssetStatus.LISTED });
    }

    // Asynchronously dispatch listing.created event for background jobs
    publishEvent(
      EventNames.LISTING_CREATED,
      {
        listingId: listing._id.toString(),
        sellerId: sellerId.toString(),
        assetId: asset._id.toString(),
        askingPrice: listing.askingPrice,
        currency: listing.currency,
        status: listing.status,
      },
      { id: sellerId.toString() }
    ).catch(() => {});

    return listing;
  }

  /**
   * Get single listing by ID
   * @param {string} id
   */
  async getListingById(id) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    return listing;
  }

  /**
   * List listings with multi-field search, asset metadata filtering, pagination, and sorting
   * @param {object} query
   */
  async listListings(query = {}) {
    const result = await this.repo.list(query);
    return {
      listings: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Backward-compatible alias for listListings
   * @param {object} query
   */
  async listActiveListings(query = {}) {
    return this.listListings(query);
  }

  /**
   * Update listing fields
   *
   * Business Rules Enforced:
   * 1. Only listing seller or admin can update
   * 2. Seller cannot modify protected ticket identity or ownership fields
   * 3. Cannot modify SOLD, EXPIRED, or CANCELLED listings
   * 4. State transitions validated
   *
   * @param {string} id
   * @param {string} userId
   * @param {object} updateData
   * @param {string} userRole
   */
  async updateListing(id, userId, updateData, userRole = 'USER') {
    // 1. Fetch existing listing
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // 2. Guard against modifications to protected identity fields (via adapter or defaults)
    const assetType = listing.assetId?.assetType;
    const adapter = assetType && hasAssetAdapter(assetType) ? getAssetAdapter(assetType) : null;
    const protectedFields = adapter
      ? adapter.transferPolicy.getProtectedFields()
      : PROTECTED_TICKET_IDENTITY_FIELDS;

    const attemptedProtected = protectedFields.filter((field) => field in updateData);

    if (attemptedProtected.length > 0) {
      throw new BadRequestError(
        `Modification of protected ticket identity or asset fields is strictly prohibited: [${attemptedProtected.join(', ')}]`
      );
    }

    // 3. Ownership / authorization check
    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    const isOwner = sellerIdStr === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to modify this listing');
    }

    // 4. Status checks on existing listing
    if (listing.status === ListingStatus.SOLD || listing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot modify a listing that has already been sold');
    }

    if (listing.status === ListingStatus.CANCELLED) {
      throw new BadRequestError('Cannot modify a listing that has been cancelled');
    }

    if (listing.status === ListingStatus.EXPIRED) {
      throw new BadRequestError('Cannot modify a listing that has expired');
    }

    if (
      listing.status === ListingStatus.RESERVED &&
      updateData.status &&
      updateData.status !== ListingStatus.RESERVED
    ) {
      if (!isAdmin) {
        throw new BadRequestError(
          'Cannot modify a listing while an active escrow transaction is pending'
        );
      }
    }

    // 5. Build sanitized update payload
    const safeUpdate = {};

    if (updateData.askingPrice !== undefined) {
      safeUpdate.askingPrice = updateData.askingPrice;
      safeUpdate.price = updateData.askingPrice;
    } else if (updateData.price !== undefined) {
      safeUpdate.askingPrice = updateData.price;
      safeUpdate.price = updateData.price;
    }

    if (updateData.notes !== undefined) {
      safeUpdate.notes = updateData.notes;
    }

    if (updateData.expiresAt !== undefined) {
      if (updateData.expiresAt) {
        const exp = new Date(updateData.expiresAt);
        if (exp <= new Date()) {
          throw new BadRequestError('Expiration date must be in the future');
        }
        safeUpdate.expiresAt = exp;
      } else {
        safeUpdate.expiresAt = null;
      }
    }

    if (updateData.status !== undefined) {
      // Validate transition
      if (listing.status === ListingStatus.DRAFT && updateData.status === ListingStatus.ACTIVE) {
        // When transitioning DRAFT -> ACTIVE, update asset status to LISTED
        const assetId = listing.assetId?._id || listing.assetId;
        await this.assetRepo.updateById(assetId, { status: AssetStatus.LISTED });
      } else if (updateData.status === ListingStatus.CANCELLED) {
        // When transitioning to CANCELLED, revert asset status back to VERIFIED
        const assetId = listing.assetId?._id || listing.assetId;
        await this.assetRepo.updateById(assetId, { status: AssetStatus.VERIFIED });
      }
      safeUpdate.status = updateData.status;
    }

    return this.repo.updateById(id, safeUpdate);
  }

  /**
   * Delete or cancel a listing
   *
   * Business Rules Enforced:
   * 1. Only listing seller or admin can delete/cancel
   * 2. Cannot delete a SOLD listing
   * 3. Reverts asset status back to VERIFIED
   *
   * @param {string} id
   * @param {string} userId
   * @param {string} userRole
   */
  async deleteListing(id, userId, userRole = 'USER') {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    const isOwner = sellerIdStr === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to cancel this listing');
    }

    if (listing.status === ListingStatus.SOLD || listing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot delete or cancel a listing that has already been sold');
    }

    // Revert asset status back to VERIFIED so the owner can list or manage it again
    const assetId = listing.assetId?._id || listing.assetId;
    await this.assetRepo.updateById(assetId, { status: AssetStatus.VERIFIED });

    // Transition listing status to CANCELLED (or delete if DRAFT)
    if (listing.status === ListingStatus.DRAFT) {
      await this.repo.deleteById(id);
      return { _id: id, status: ListingStatus.CANCELLED, deleted: true };
    }

    const updated = await this.repo.updateById(id, { status: ListingStatus.CANCELLED });
    return updated;
  }

  /**
   * Atomically reserve a listing for a buyer.
   *
   * Business Rules Enforced:
   * 1. Suspended users cannot reserve listings
   * 2. Seller cannot reserve their own listing
   * 3. Only ACTIVE listings can be reserved (CANCELLED, SOLD, EXPIRED, DRAFT rejected)
   * 4. Race condition prevention: exactly one buyer can atomically transition status ACTIVE -> RESERVED
   * 5. Partial unique compound index on Reservation enforces at database layer that only one ACTIVE reservation can exist
   * 6. Multi-document ACID transactions with MongoDB session
   * 7. Automatic lazy expiry: stale reservations (> expiresAt) are cleared and released
   *
   * @param {string} listingId
   * @param {string} buyerId
   * @param {object} [options]
   * @returns {Promise<{ reservation: object, listing: object }>}
   */
  async reserveListing(listingId, buyerId, options = {}) {
    // 1. Verify buyer account status
    const buyer = await User.findById(buyerId).select('accountStatus');
    if (!buyer) {
      throw new NotFoundError('Buyer account not found');
    }
    if (buyer.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Suspended users cannot reserve listings');
    }
    if (buyer.accountStatus === 'DEACTIVATED') {
      throw new ForbiddenError('Deactivated user account cannot reserve listings');
    }

    // 2. Fetch listing to validate eligibility
    const listing = await this.repo.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    // Rule: Seller cannot reserve own listing
    if (sellerIdStr === buyerId.toString()) {
      throw new BadRequestError('Seller cannot reserve their own listing');
    }

    // Rule: Cancelled / Sold / Expired / Draft listings cannot be reserved
    if (listing.status === ListingStatus.CANCELLED) {
      throw new BadRequestError('Cancelled listings cannot be reserved');
    }
    if (listing.status === ListingStatus.SOLD || listing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot reserve a sold listing');
    }
    if (listing.status === ListingStatus.EXPIRED) {
      throw new BadRequestError('Cannot reserve an expired listing');
    }
    if (listing.status === ListingStatus.DRAFT) {
      throw new BadRequestError('Cannot reserve a draft listing');
    }

    // Lazy expiration check for existing reservation
    if (listing.status === ListingStatus.RESERVED || listing.status === 'PENDING_ESCROW') {
      const activeRes = await Reservation.findOne({
        listingId: listing._id,
        status: ReservationStatus.ACTIVE,
      });

      if (activeRes) {
        if (activeRes.expiresAt > new Date()) {
          // Still actively reserved and not expired
          if (activeRes.buyerId.toString() === buyerId.toString()) {
            return {
              reservation: activeRes,
              listing,
              alreadyReserved: true,
            };
          }
          throw new ConflictError('Listing is already reserved by another buyer');
        } else {
          // Stale reservation has expired: mark it EXPIRED so it can be reclaimed
          activeRes.status = ReservationStatus.EXPIRED;
          await activeRes.save();
        }
      }
    }

    const durationMinutes = options.durationMinutes || 15;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // 3. Atomically acquire lock and create reservation using MongoDB ACID Session
    let session = null;
    try {
      session = await mongoose.startSession();
    } catch {
      session = null;
    }

    if (session) {
      try {
        let result = null;
        await session.withTransaction(async () => {
          // Atomic conditional update on Listing: must be ACTIVE (or reclaimed from expired RESERVED)
          const updatedListing = await Listing.findOneAndUpdate(
            {
              _id: listingId,
              $or: [{ status: ListingStatus.ACTIVE }, { status: ListingStatus.RESERVED }],
            },
            { $set: { status: ListingStatus.RESERVED } },
            { new: true, session }
          );

          if (!updatedListing) {
            throw new ConflictError('Listing is no longer available for reservation');
          }

          // Check for any concurrent active reservation within this transaction session
          const conflicting = await Reservation.findOne({
            listingId,
            status: ReservationStatus.ACTIVE,
          }).session(session);

          if (conflicting) {
            if (conflicting.expiresAt > new Date()) {
              throw new ConflictError('Listing is already reserved by another buyer');
            } else {
              conflicting.status = ReservationStatus.EXPIRED;
              await conflicting.save({ session });
            }
          }

          // Create new reservation document
          const [newReservation] = await Reservation.create(
            [
              {
                listingId,
                buyerId,
                expiresAt,
                status: ReservationStatus.ACTIVE,
              },
            ],
            { session }
          );

          result = {
            reservation: newReservation,
            listing: updatedListing,
          };
        });

        // Asynchronously dispatch listing.reserved event for background jobs
        publishEvent(
          EventNames.LISTING_RESERVED,
          {
            listingId: listingId.toString(),
            buyerId: buyerId.toString(),
            sellerId: (result.listing.sellerId?._id || result.listing.sellerId).toString(),
            reservationId: result.reservation._id.toString(),
            expiresAt,
          },
          { id: buyerId.toString() }
        ).catch(() => {});

        return result;
      } catch (err) {
        if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
          throw new ConflictError('Listing is already reserved by another buyer');
        }
        throw err;
      } finally {
        await session.endSession();
      }
    } else {
      // Standalone atomic conditional fallback
      const updatedListing = await Listing.findOneAndUpdate(
        {
          _id: listingId,
          $or: [{ status: ListingStatus.ACTIVE }, { status: ListingStatus.RESERVED }],
        },
        { $set: { status: ListingStatus.RESERVED } },
        { new: true }
      );

      if (!updatedListing) {
        throw new ConflictError('Listing is no longer available for reservation');
      }

      try {
        const newReservation = await Reservation.create({
          listingId,
          buyerId,
          expiresAt,
          status: ReservationStatus.ACTIVE,
        });

        // Asynchronously dispatch listing.reserved event for background jobs
        publishEvent(
          EventNames.LISTING_RESERVED,
          {
            listingId: listingId.toString(),
            buyerId: buyerId.toString(),
            sellerId: (updatedListing.sellerId?._id || updatedListing.sellerId).toString(),
            reservationId: newReservation._id.toString(),
            expiresAt,
          },
          { id: buyerId.toString() }
        ).catch(() => {});

        return {
          reservation: newReservation,
          listing: updatedListing,
        };
      } catch (err) {
        await Listing.findByIdAndUpdate(listingId, { status: ListingStatus.ACTIVE });
        if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
          throw new ConflictError('Listing is already reserved by another buyer');
        }
        throw err;
      }
    }
  }

  /**
   * Release an active reservation and revert listing status back to ACTIVE.
   *
   * Business Rules Enforced:
   * 1. Only reserving buyer, listing seller, or admin can release
   * 2. Atomically marks reservation as RELEASED and listing as ACTIVE
   *
   * @param {string} listingId
   * @param {string} userId
   * @param {string} userRole
   * @param {string} [reason]
   */
  async releaseReservation(listingId, userId, userRole = 'USER', reason = null) {
    let session = null;
    try {
      session = await mongoose.startSession();
    } catch {
      session = null;
    }

    if (session) {
      try {
        let result = null;
        await session.withTransaction(async () => {
          // 1. Find active reservation
          const reservation = await Reservation.findOne({
            listingId,
            status: ReservationStatus.ACTIVE,
          }).session(session);

          if (!reservation) {
            throw new NotFoundError('No active reservation found for this listing');
          }

          // 2. Fetch listing
          const listing = await Listing.findById(listingId).session(session);
          if (!listing) {
            throw new NotFoundError('Listing not found');
          }

          // 3. Authorization check
          const isBuyer = reservation.buyerId.toString() === userId.toString();
          const isSeller = listing.sellerId.toString() === userId.toString();
          const isAdmin = userRole === 'ADMIN';

          if (!isBuyer && !isSeller && !isAdmin) {
            throw new ForbiddenError('You are not authorized to release this reservation');
          }

          // 4. Update reservation
          reservation.status = ReservationStatus.RELEASED;
          reservation.releasedAt = new Date();
          reservation.releaseReason =
            reason || (isBuyer ? 'Buyer released reservation' : 'Released by seller/admin');
          await reservation.save({ session });

          // 5. Revert listing status to ACTIVE
          const updatedListing = await Listing.findOneAndUpdate(
            { _id: listingId, status: ListingStatus.RESERVED },
            { $set: { status: ListingStatus.ACTIVE } },
            { new: true, session }
          );

          result = {
            reservation,
            listing: updatedListing || listing,
          };
        });

        return result;
      } finally {
        await session.endSession();
      }
    } else {
      const reservation = await Reservation.findOne({
        listingId,
        status: ReservationStatus.ACTIVE,
      });

      if (!reservation) {
        throw new NotFoundError('No active reservation found for this listing');
      }

      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }

      const isBuyer = reservation.buyerId.toString() === userId.toString();
      const isSeller = listing.sellerId.toString() === userId.toString();
      const isAdmin = userRole === 'ADMIN';

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new ForbiddenError('You are not authorized to release this reservation');
      }

      reservation.status = ReservationStatus.RELEASED;
      reservation.releasedAt = new Date();
      reservation.releaseReason =
        reason || (isBuyer ? 'Buyer released reservation' : 'Released by seller/admin');
      await reservation.save();

      const updatedListing = await Listing.findOneAndUpdate(
        { _id: listingId, status: ListingStatus.RESERVED },
        { $set: { status: ListingStatus.ACTIVE } },
        { new: true }
      );

      return {
        reservation,
        listing: updatedListing || listing,
      };
    }
  }

  /**
   * Sweep and expire all stale reservations where expiresAt <= now
   */
  async expireStaleReservations() {
    const staleReservations = await Reservation.find({
      status: ReservationStatus.ACTIVE,
      expiresAt: { $lte: new Date() },
    });

    const expiredListings = [];
    for (const res of staleReservations) {
      res.status = ReservationStatus.EXPIRED;
      await res.save();
      await Listing.findOneAndUpdate(
        { _id: res.listingId, status: ListingStatus.RESERVED },
        { $set: { status: ListingStatus.ACTIVE } }
      );
      expiredListings.push(res.listingId);
    }

    return {
      expiredCount: staleReservations.length,
      expiredListings,
    };
  }
}

export const listingService = new ListingService();
