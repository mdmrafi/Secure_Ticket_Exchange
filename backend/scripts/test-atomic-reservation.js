import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Reservation, ReservationStatus } from '../src/modules/listings/reservation.model.js';
import {
  AssetTypes,
  AssetStatus,
  ListingStatus,
  VerificationStatus,
} from '../src/common/constants/asset-types.constant.js';
import { env } from '../src/config/env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = `http://localhost:${env.PORT || 5000}${env.API_PREFIX || '/api/v1'}`;

// Helper: Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role || 'USER',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Helper: API caller
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

// Formatting colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName} - ${details}`);
    failedCount++;
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================`);
  console.log(`     ATOMIC LISTING RESERVATION & CONCURRENCY TEST`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set for ACID transaction testing.${colors.reset}\n`);

  await Reservation.syncIndexes();
  await Listing.syncIndexes();
  console.log(`${colors.blue}Database indexes synced and initialized.${colors.reset}\n`);

  const timestamp = Date.now();
  let seller, buyerA, buyerB, buyerC, buyerSuspended;
  let tokenSeller, tokenBuyerA, tokenBuyerB, tokenBuyerC, tokenSuspended;
  let assetActive, assetCancelled, listingActive, listingCancelled;

  try {
    // -----------------------------------------------------------------
    // SETUP: Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user fixtures...${colors.reset}`);

    seller = await User.create({
      name: 'Ticket Seller Sam',
      email: `seller.sam.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 90,
    });
    tokenSeller = generateToken(seller);

    buyerA = await User.create({
      name: 'Buyer Alice',
      email: `buyer.alice.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 95,
    });
    tokenBuyerA = generateToken(buyerA);

    buyerB = await User.create({
      name: 'Buyer Bob',
      email: `buyer.bob.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 92,
    });
    tokenBuyerB = generateToken(buyerB);

    buyerC = await User.create({
      name: 'Buyer Charlie',
      email: `buyer.charlie.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 88,
    });
    tokenBuyerC = generateToken(buyerC);

    buyerSuspended = await User.create({
      name: 'Suspended Buyer Dave',
      email: `buyer.dave.suspended.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'SUSPENDED',
      kycStatus: 'NOT_STARTED',
      trustScore: 10,
    });
    tokenSuspended = generateToken(buyerSuspended);

    // -----------------------------------------------------------------
    // SETUP: Assets & Listings
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating verified assets and listings...${colors.reset}`);

    assetActive = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `RAIL-RESERVE-${timestamp}-1`,
      title: 'Train 701: Dhaka -> Chittagong (Seat A1)',
      originalValue: 1200,
      currency: 'BDT',
      metadata: {
        trainNumber: '701',
        fromStation: 'Dhaka',
        toStation: 'Chittagong',
        journeyDate: '2026-10-25',
        seat: 'A1',
      },
    });

    listingActive = await Listing.create({
      assetId: assetActive._id,
      sellerId: seller._id,
      askingPrice: 1350,
      price: 1350,
      originalFaceValue: 1200,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    assetCancelled = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.CANCELLED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `RAIL-CANCELLED-${timestamp}-2`,
      title: 'Cancelled Train Ticket',
      originalValue: 1000,
      currency: 'BDT',
    });

    listingCancelled = await Listing.create({
      assetId: assetCancelled._id,
      sellerId: seller._id,
      askingPrice: 1100,
      price: 1100,
      currency: 'BDT',
      status: ListingStatus.CANCELLED,
    });

    console.log(`${colors.green}Fixtures created successfully.${colors.reset}\n`);

    // =================================================================
    // Scenario 1: Validation Rules (Seller, Suspended, Cancelled)
    // =================================================================
    console.log(`${colors.bold}Scenario 1: Validation Guards (Seller, Suspended, Cancelled)${colors.reset}`);

    // Rule: Seller cannot reserve own listing
    const sellerReserveRes = await apiCall(
      `/listings/${listingActive._id}/reserve`,
      'POST',
      {},
      tokenSeller
    );
    assert(
      sellerReserveRes.status === 400,
      'Seller reserving own listing rejected with 400 Bad Request'
    );
    assert(
      sellerReserveRes.body?.message?.includes('Seller cannot reserve their own listing'),
      'Clear explanation that seller cannot reserve own listing'
    );

    // Rule: Suspended user cannot reserve
    const suspendedReserveRes = await apiCall(
      `/listings/${listingActive._id}/reserve`,
      'POST',
      {},
      tokenSuspended
    );
    assert(
      suspendedReserveRes.status === 403,
      'Suspended user reserving listing rejected with 403 Forbidden'
    );
    assert(
      suspendedReserveRes.body?.message?.includes('Suspended users cannot reserve listings'),
      'Clear suspended error message returned'
    );

    // Rule: Cancelled listing cannot be reserved
    const cancelledReserveRes = await apiCall(
      `/listings/${listingCancelled._id}/reserve`,
      'POST',
      {},
      tokenBuyerA
    );
    assert(
      cancelledReserveRes.status === 400,
      'Cancelled listing reservation rejected with 400 Bad Request'
    );
    assert(
      cancelledReserveRes.body?.message?.includes('Cancelled listings cannot be reserved'),
      'Clear message that cancelled listing cannot be reserved'
    );

    // =================================================================
    // Scenario 2: High-Concurrency Simultaneous Reservation (Race Condition Test)
    // =================================================================
    console.log(`\n${colors.bold}Scenario 2: Simultaneous Race Condition (Buyer A vs Buyer B)${colors.reset}`);

    // Buyer A and Buyer B both fire concurrent reserve requests to the exact same listing
    console.log(`  ${colors.blue}Firing concurrent POST /reserve requests simultaneously via Promise.all...${colors.reset}`);
    const [raceResBuyerA, raceResBuyerB] = await Promise.all([
      apiCall(`/listings/${listingActive._id}/reserve`, 'POST', { durationMinutes: 15 }, tokenBuyerA),
      apiCall(`/listings/${listingActive._id}/reserve`, 'POST', { durationMinutes: 15 }, tokenBuyerB),
    ]);

    const successes = [raceResBuyerA, raceResBuyerB].filter((r) => r.status === 201);
    const conflicts = [raceResBuyerA, raceResBuyerB].filter((r) => r.status === 409);

    assert(
      successes.length === 1,
      'Exactly ONE concurrent buyer succeeded in reserving (201 Created)'
    );
    assert(
      conflicts.length === 1,
      'Exactly ONE concurrent buyer was blocked with 409 Conflict'
    );

    const winnerResponse = successes[0];
    const winnerData = winnerResponse.body?.data;
    assert(winnerData?.reservation != null, 'Reservation payload returned in response');
    assert(winnerData?.reservation?.status === 'ACTIVE', 'Reservation status is ACTIVE');
    assert(winnerData?.listing?.status === 'RESERVED', 'Listing status transitioned to RESERVED');

    // Identify who won and who lost
    const winnerBuyerId = winnerData?.reservation?.buyerId;
    const winnerName = winnerBuyerId === buyerA._id.toString() ? 'Buyer Alice' : 'Buyer Bob';
    const loserToken = winnerBuyerId === buyerA._id.toString() ? tokenBuyerB : tokenBuyerA;
    console.log(`  ${colors.cyan}Race condition result: ${winnerName} acquired the reservation lock.${colors.reset}`);

    // Verify Database state: exactly 1 active reservation in MongoDB
    const activeReservationsInDb = await Reservation.find({
      listingId: listingActive._id,
      status: ReservationStatus.ACTIVE,
    });
    assert(
      activeReservationsInDb.length === 1,
      'Database verifies exactly ONE active reservation exists for the listing'
    );
    assert(
      activeReservationsInDb[0].buyerId.toString() === winnerBuyerId,
      'Reservation in database is owned by the winning buyer'
    );

    // Verify Listing status in DB
    const freshListingInDb = await Listing.findById(listingActive._id);
    assert(
      freshListingInDb.status === ListingStatus.RESERVED,
      'Listing status in MongoDB is confirmed RESERVED'
    );

    // =================================================================
    // Scenario 3: Subsequent Buyer Blocked while Active
    // =================================================================
    console.log(`\n${colors.bold}Scenario 3: Subsequent Reservation Attempt by Buyer C${colors.reset}`);

    const buyerCReserveRes = await apiCall(
      `/listings/${listingActive._id}/reserve`,
      'POST',
      {},
      tokenBuyerC
    );
    assert(
      buyerCReserveRes.status === 409,
      'Third buyer is blocked with 409 Conflict'
    );
    assert(
      buyerCReserveRes.body?.message?.includes('already reserved'),
      'Conflict error states listing is already reserved'
    );

    // =================================================================
    // Scenario 4: Unauthorized Release Protection
    // =================================================================
    console.log(`\n${colors.bold}Scenario 4: Unauthorized Release Protection${colors.reset}`);

    // Buyer C attempts to release Buyer Alice/Bob's reservation
    const unauthorizedReleaseRes = await apiCall(
      `/listings/${listingActive._id}/release`,
      'POST',
      { reason: 'Malicious release attempt' },
      tokenBuyerC
    );
    assert(
      unauthorizedReleaseRes.status === 403,
      'Unauthorized release rejected with 403 Forbidden'
    );
    assert(
      unauthorizedReleaseRes.body?.message?.includes('not authorized to release'),
      'Clear authorization boundary message returned'
    );

    // =================================================================
    // Scenario 5: Voluntary Release by Winning Buyer & Re-reservation
    // =================================================================
    console.log(`\n${colors.bold}Scenario 5: Voluntary Release & Subsequent Acquisition${colors.reset}`);

    const winnerToken = winnerBuyerId === buyerA._id.toString() ? tokenBuyerA : tokenBuyerB;

    const releaseRes = await apiCall(
      `/listings/${listingActive._id}/release`,
      'POST',
      { reason: 'Buyer changed travel plans' },
      winnerToken
    );
    assert(releaseRes.status === 200, 'Winning buyer releases reservation (200 OK)');
    assert(
      releaseRes.body?.data?.reservation?.status === ReservationStatus.RELEASED,
      'Reservation status transitioned to RELEASED'
    );
    assert(
      releaseRes.body?.data?.listing?.status === ListingStatus.ACTIVE,
      'Listing status atomically reverted back to ACTIVE'
    );

    // The losing buyer from Scenario 2 can now successfully reserve the listing!
    const reacquireRes = await apiCall(
      `/listings/${listingActive._id}/reserve`,
      'POST',
      { durationMinutes: 10 },
      loserToken
    );
    assert(
      reacquireRes.status === 201,
      'Previously blocked buyer can now successfully acquire reservation (201 Created)'
    );
    assert(
      reacquireRes.body?.data?.reservation?.status === 'ACTIVE',
      'New reservation is ACTIVE'
    );

    const currentActiveRes = await Reservation.findById(reacquireRes.body.data.reservation._id);

    // =================================================================
    // Scenario 6: Automatic Expiration Handling
    // =================================================================
    console.log(`\n${colors.bold}Scenario 6: Automatic Expiration Handling${colors.reset}`);

    // Simulate expiration: update expiresAt to 10 seconds in the past
    await Reservation.findByIdAndUpdate(currentActiveRes._id, {
      expiresAt: new Date(Date.now() - 10000),
    });
    console.log(`  ${colors.blue}Artificially set reservation expiresAt to the past (expired)...${colors.reset}`);

    // Now Buyer C attempts to reserve the listing whose reservation just expired
    const expiredAcquireRes = await apiCall(
      `/listings/${listingActive._id}/reserve`,
      'POST',
      { durationMinutes: 20 },
      tokenBuyerC
    );
    assert(
      expiredAcquireRes.status === 201,
      'Buyer C acquires reservation after previous reservation expired (201 Created)'
    );
    assert(
      expiredAcquireRes.body?.data?.reservation?.buyerId === buyerC._id.toString(),
      'New reservation belongs to Buyer C'
    );

    // Verify stale reservation was marked EXPIRED
    const staleResCheck = await Reservation.findById(currentActiveRes._id);
    assert(
      staleResCheck.status === ReservationStatus.EXPIRED,
      'Stale reservation was automatically transitioned to EXPIRED'
    );

    // =================================================================
    // Scenario 7: Database Unique Partial Index Verification
    // =================================================================
    console.log(`\n${colors.bold}Scenario 7: Database Unique Partial Index Verification${colors.reset}`);

    const resIndexes = await Reservation.collection.indexes();
    const hasUniqueActiveIndex = resIndexes.some(
      (idx) =>
        (idx.key?.listingId === 1 || idx.name === 'unique_active_reservation_per_listing') &&
        idx.unique === true &&
        idx.partialFilterExpression?.status === 'ACTIVE'
    );
    assert(
      hasUniqueActiveIndex,
      'MongoDB partial unique index on { listingId: 1, status: "ACTIVE" } verified'
    );

    // Attempting raw Mongoose duplicate insert must fail at MongoDB engine level
    let duplicateIndexCaught = false;
    try {
      await Reservation.create({
        listingId: listingActive._id,
        buyerId: buyerA._id,
        expiresAt: new Date(Date.now() + 60000),
        status: ReservationStatus.ACTIVE,
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        duplicateIndexCaught = true;
      }
    }
    assert(
      duplicateIndexCaught,
      'MongoDB engine-level E11000 duplicate key error enforced for concurrent active reservations'
    );

  } catch (err) {
    console.error(`${colors.red}Unhandled test suite exception:${colors.reset}`, err);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    const userIds = [seller?._id, buyerA?._id, buyerB?._id, buyerC?._id, buyerSuspended?._id].filter(Boolean);
    const assetIds = [assetActive?._id, assetCancelled?._id].filter(Boolean);
    const listingIds = [listingActive?._id, listingCancelled?._id].filter(Boolean);

    if (listingIds.length > 0) {
      await Reservation.deleteMany({ listingId: { $in: listingIds } });
      await Listing.deleteMany({ _id: { $in: listingIds } });
    }
    if (assetIds.length > 0) {
      await Asset.deleteMany({ _id: { $in: assetIds } });
    }
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    await mongoose.disconnect();
    console.log(`${colors.blue}Database disconnected cleanly.${colors.reset}\n`);

    console.log(`${colors.bold}${colors.cyan}======================================================`);
    console.log(`TEST SUMMARY: ${colors.green}${passedCount} passed${colors.cyan}, ${failedCount > 0 ? colors.red : colors.green}${failedCount} failed${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runTests();
