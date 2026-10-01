import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
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

// Colors for terminal output
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
  console.log(
    `\n${colors.bold}${colors.cyan}======================================================`
  );
  console.log(`     MARKETPLACE LISTING SYSTEM TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas for fixture assertions.${colors.reset}\n`);

  const timestamp = Date.now();
  let userOwnerA, userOwnerB, userSuspended, userAdmin;
  let tokenOwnerA, tokenOwnerB, tokenSuspended, tokenAdmin;
  let verifiedAssetA, unverifiedAsset, suspiciousAsset, busAsset, eventAsset;

  try {
    // -----------------------------------------------------------------
    // SETUP: Test Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user fixtures...${colors.reset}`);

    userOwnerA = await User.create({
      name: 'Ticket Seller Alice',
      email: `alice.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 95,
    });
    tokenOwnerA = generateToken(userOwnerA);

    userOwnerB = await User.create({
      name: 'Ticket Seller Bob',
      email: `bob.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 90,
    });
    tokenOwnerB = generateToken(userOwnerB);

    userSuspended = await User.create({
      name: 'Suspended Seller Mallory',
      email: `mallory.bad.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'SUSPENDED',
      kycStatus: 'VERIFIED',
      trustScore: 20,
    });
    tokenSuspended = generateToken(userSuspended);

    userAdmin = await User.create({
      name: 'Exchange Admin',
      email: `admin.market.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 100,
    });
    tokenAdmin = generateToken(userAdmin);

    // -----------------------------------------------------------------
    // SETUP: Test Assets
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test asset fixtures...${colors.reset}`);

    // Verified Railway Ticket belonging to Alice
    verifiedAssetA = await Asset.create({
      ownerId: userOwnerA._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `RAIL-TEST-${timestamp}-1`,
      title: 'Train 701: Dhaka -> Chittagong',
      originalValue: 1200,
      currency: 'BDT',
      metadata: {
        trainNumber: '701',
        fromStation: 'Dhaka',
        toStation: 'Chittagong',
        journeyDate: '2026-10-15',
        departureTime: '07:00 AM',
        coach: 'KHA',
        seat: '12',
        class: 'AC_CHAIR',
        pnr: `PNR-${timestamp}-1`,
      },
    });

    // Unverified Asset
    unverifiedAsset = await Asset.create({
      ownerId: userOwnerA._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.DRAFT,
      verificationStatus: VerificationStatus.NOT_REQUESTED,
      uniqueAssetIdentifier: `RAIL-TEST-${timestamp}-2`,
      title: 'Unverified Ticket',
      originalValue: 800,
      currency: 'BDT',
      metadata: {
        fromStation: 'Dhaka',
        toStation: 'Sylhet',
        journeyDate: '2026-10-20',
      },
    });

    // Suspicious Asset
    suspiciousAsset = await Asset.create({
      ownerId: userOwnerA._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.REJECTED,
      verificationStatus: VerificationStatus.SUSPICIOUS,
      uniqueAssetIdentifier: `RAIL-TEST-${timestamp}-3`,
      title: 'Suspicious Ticket',
      originalValue: 1500,
      currency: 'BDT',
      metadata: {
        fromStation: 'Dhaka',
        toStation: 'Rajshahi',
        journeyDate: '2026-10-18',
      },
    });

    // Verified Bus Ticket
    busAsset = await Asset.create({
      ownerId: userOwnerB._id,
      assetType: AssetTypes.BUS_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `BUS-TEST-${timestamp}-4`,
      title: 'Green Line: Dhaka -> Coxs Bazar',
      originalValue: 2000,
      currency: 'BDT',
      metadata: {
        operator: 'Green Line',
        source: 'Dhaka',
        destination: 'Coxs Bazar',
        journeyDate: '2026-10-15',
        seat: 'A1',
      },
    });

    // Verified Event Ticket
    eventAsset = await Asset.create({
      ownerId: userOwnerB._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `EVENT-TEST-${timestamp}-5`,
      title: 'Tech Summit 2026',
      originalValue: 5000,
      currency: 'BDT',
      metadata: {
        eventName: 'Tech Summit 2026',
        venue: 'BICC Dhaka',
        eventDate: '2026-11-01',
      },
    });

    console.log(`${colors.green}Fixtures created successfully.${colors.reset}\n`);

    // =================================================================
    // Scenario 1: Authorization & User Status Listing Rules
    // =================================================================
    console.log(
      `${colors.bold}Scenario 1: Authorization & User Status Listing Rules${colors.reset}`
    );

    // Rule: Suspended users cannot create listings
    const suspendedRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: verifiedAssetA._id.toString(),
        askingPrice: 1200,
      },
      tokenSuspended
    );
    assert(suspendedRes.status === 403, 'Suspended users cannot create listings (403 Forbidden)');
    assert(
      suspendedRes.body?.message?.includes('Suspended users cannot create listings'),
      'Clear suspended error message returned'
    );

    // Rule: Only asset owner can list
    const nonOwnerRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: verifiedAssetA._id.toString(),
        askingPrice: 1200,
      },
      tokenOwnerB
    );
    assert(
      nonOwnerRes.status === 403,
      'Non-owner blocked from listing another user asset (403 Forbidden)'
    );
    assert(
      nonOwnerRes.body?.message?.includes('You can only list assets that you own'),
      'Clear ownership error message returned'
    );

    // Rule: Unauthenticated user cannot create listing
    const unauthRes = await apiCall('/listings', 'POST', {
      assetId: verifiedAssetA._id.toString(),
      askingPrice: 1200,
    });
    assert(unauthRes.status === 401, 'Unauthenticated user rejected with 401 Unauthorized');

    // =================================================================
    // Scenario 2: Verification Requirements & Suspicious Asset Guards
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 2: Verification Requirements & Suspicious Asset Guards${colors.reset}`
    );

    // Rule: Asset must meet verification requirements
    const unverifiedRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: unverifiedAsset._id.toString(),
        askingPrice: 800,
      },
      tokenOwnerA
    );
    assert(unverifiedRes.status === 400, 'Unverified asset listing rejected with 400 Bad Request');
    assert(
      unverifiedRes.body?.message?.includes('verification requirements'),
      'Explanation of verification requirement returned'
    );

    // Rule: Suspicious assets cannot be listed
    const suspiciousRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: suspiciousAsset._id.toString(),
        askingPrice: 1500,
      },
      tokenOwnerA
    );
    assert(
      suspiciousRes.status === 403,
      'Suspicious or rejected asset rejected with 403 Forbidden'
    );
    assert(
      suspiciousRes.body?.message?.includes('Suspicious or rejected assets cannot be listed'),
      'Fraud prevention error message returned'
    );

    // =================================================================
    // Scenario 3: Successful Listing Creation & State Transitions
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 3: Successful Listing Creation & State Transitions${colors.reset}`
    );

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const createRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: verifiedAssetA._id.toString(),
        askingPrice: 1350,
        currency: 'BDT',
        status: 'ACTIVE',
        expiresAt: futureDate,
        notes: 'Includes reserved window seat and AC coach',
      },
      tokenOwnerA
    );

    assert(createRes.status === 201, 'POST /listings creates listing (201 Created)');
    const createdListing = createRes.body?.data;
    assert(createdListing != null, 'Listing data object returned in response');
    assert(createdListing.askingPrice === 1350, 'askingPrice matches payload (1350)');
    assert(createdListing.price === 1350, 'price alias correctly synchronizes with askingPrice');
    assert(createdListing.status === 'ACTIVE', 'status is ACTIVE');
    assert(createdListing.currency === 'BDT', 'currency is BDT');
    assert(createdListing.expiresAt != null, 'expiresAt is populated');
    assert(createdListing.createdAt != null, 'createdAt timestamp generated');
    assert(createdListing.updatedAt != null, 'updatedAt timestamp generated');

    // Verify Asset status transitioned to LISTED
    const updatedAssetInDb = await Asset.findById(verifiedAssetA._id);
    assert(
      updatedAssetInDb.status === AssetStatus.LISTED,
      'Asset status updated to LISTED in database'
    );

    // =================================================================
    // Scenario 4: Concurrency & Duplicate Active Listing Prevention
    // =================================================================
    console.log(`\n${colors.bold}Scenario 4: Duplicate Active Listing Rule${colors.reset}`);

    // Rule: Same asset cannot have multiple active listings
    const duplicateRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: verifiedAssetA._id.toString(),
        askingPrice: 1400,
      },
      tokenOwnerA
    );
    assert(duplicateRes.status === 409, 'Duplicate active listing blocked with 409 Conflict');
    assert(
      duplicateRes.body?.message?.includes('already has an active or reserved listing'),
      'Conflict error specifies active listing already exists'
    );

    // Create listings for busAsset and eventAsset for multi-asset marketplace testing
    const createBusListingRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: busAsset._id.toString(),
        askingPrice: 2200,
        currency: 'BDT',
        status: 'ACTIVE',
      },
      tokenOwnerB
    );
    assert(createBusListingRes.status === 201, 'Bus ticket listed successfully (201 Created)');
    const busListing = createBusListingRes.body?.data;

    const createEventListingRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: eventAsset._id.toString(),
        askingPrice: 4800,
        currency: 'BDT',
        status: 'ACTIVE',
      },
      tokenOwnerB
    );
    assert(createEventListingRes.status === 201, 'Event pass listed successfully (201 Created)');
    const eventListing = createEventListingRes.body?.data;

    // =================================================================
    // Scenario 5: Single Listing Retrieval (GET /listings/:id)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 5: Single Listing Retrieval (GET /listings/:id)${colors.reset}`
    );

    const getRes = await apiCall(`/listings/${createdListing._id}`);
    assert(getRes.status === 200, 'GET /listings/:id returns 200 OK');
    assert(getRes.body?.data?._id === createdListing._id, 'Returns matching listing ID');
    assert(
      getRes.body?.data?.assetId?.title === 'Train 701: Dhaka -> Chittagong',
      'Populates asset details'
    );
    assert(getRes.body?.data?.sellerId?.name === 'Ticket Seller Alice', 'Populates seller details');

    // =================================================================
    // Scenario 6: Protected Ticket Identity Fields Immutability
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 6: Protected Ticket Identity Fields Immutability${colors.reset}`
    );

    // Attempting to modify PNR
    const modifyPnrRes = await apiCall(
      `/listings/${createdListing._id}`,
      'PATCH',
      { pnr: 'HACKED-PNR-999' },
      tokenOwnerA
    );
    assert(modifyPnrRes.status === 400, 'Modifying protected PNR rejected with 400 Bad Request');
    assert(
      modifyPnrRes.body?.message?.includes('protected ticket identity or asset fields'),
      'Protected field error explains immutability'
    );

    // Attempting to modify seat / coach
    const modifySeatRes = await apiCall(
      `/listings/${createdListing._id}`,
      'PATCH',
      { seat: 'KA-99', coach: 'KA' },
      tokenOwnerA
    );
    assert(
      modifySeatRes.status === 400,
      'Modifying protected seat/coach rejected with 400 Bad Request'
    );

    // Attempting to modify assetId
    const modifyAssetRes = await apiCall(
      `/listings/${createdListing._id}`,
      'PATCH',
      { assetId: busAsset._id.toString() },
      tokenOwnerA
    );
    assert(
      modifyAssetRes.status === 400,
      'Modifying protected assetId rejected with 400 Bad Request'
    );

    // Non-owner updating listing
    const nonOwnerUpdateRes = await apiCall(
      `/listings/${createdListing._id}`,
      'PATCH',
      { askingPrice: 999 },
      tokenOwnerB
    );
    assert(
      nonOwnerUpdateRes.status === 403,
      'Non-owner updating listing rejected with 403 Forbidden'
    );

    // Valid update of listing parameters (askingPrice, notes)
    const validUpdateRes = await apiCall(
      `/listings/${createdListing._id}`,
      'PATCH',
      {
        askingPrice: 1250,
        notes: 'Discounted price for quick sale',
      },
      tokenOwnerA
    );
    assert(validUpdateRes.status === 200, 'Owner successfully updates askingPrice (200 OK)');
    assert(validUpdateRes.body?.data?.askingPrice === 1250, 'Updated askingPrice reflected');
    assert(
      validUpdateRes.body?.data?.notes === 'Discounted price for quick sale',
      'Updated notes reflected'
    );

    // =================================================================
    // Scenario 7: Multi-Field Search & Filtering (GET /listings)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 7: Multi-Field Search & Filtering (GET /listings)${colors.reset}`
    );

    // Filter by assetType = RAILWAY_TICKET
    const filterRailway = await apiCall('/listings?assetType=RAILWAY_TICKET');
    assert(filterRailway.status === 200, 'Filter by assetType=RAILWAY_TICKET returns 200 OK');
    assert(filterRailway.body?.data?.length >= 1, 'Returns at least 1 railway ticket');
    assert(
      filterRailway.body?.data?.every((l) => l.assetId?.assetType === 'RAILWAY_TICKET'),
      'All returned listings have assetType RAILWAY_TICKET'
    );

    // Filter by source = Dhaka
    const filterSource = await apiCall('/listings?source=Dhaka');
    assert(filterSource.status === 200, 'Filter by source=Dhaka returns 200 OK');
    assert(
      filterSource.body?.data?.length >= 2,
      'Returns both railway and bus tickets originating from Dhaka'
    );

    // Filter by destination = Chittagong
    const filterDest = await apiCall('/listings?destination=Chittagong');
    assert(filterDest.status === 200, 'Filter by destination=Chittagong returns 200 OK');
    assert(filterDest.body?.data?.length === 1, 'Only Alice Chittagong ticket returned');
    assert(filterDest.body?.data?.[0]?._id === createdListing._id, 'Matches Alice listing ID');

    // Filter by date = 2026-10-15
    const filterDate = await apiCall('/listings?date=2026-10-15');
    assert(filterDate.status === 200, 'Filter by date=2026-10-15 returns 200 OK');
    assert(filterDate.body?.data?.length >= 2, 'Returns listings with travel date 2026-10-15');

    // Filter by price range: minPrice=2000 & maxPrice=3000
    const filterPrice = await apiCall('/listings?minPrice=2000&maxPrice=3000');
    assert(filterPrice.status === 200, 'Filter by price range [2000-3000] returns 200 OK');
    assert(filterPrice.body?.data?.length === 1, 'Only bus ticket (price 2200) returned');
    assert(filterPrice.body?.data?.[0]?.askingPrice === 2200, 'Returned listing price is 2200');

    // Filter by verificationStatus = VERIFIED
    const filterVerification = await apiCall('/listings?verificationStatus=VERIFIED');
    assert(
      filterVerification.status === 200,
      'Filter by verificationStatus=VERIFIED returns 200 OK'
    );
    assert(filterVerification.body?.data?.length >= 3, 'Returns all verified asset listings');

    // =================================================================
    // Scenario 8: Pagination and Sorting
    // =================================================================
    console.log(`\n${colors.bold}Scenario 8: Pagination and Sorting${colors.reset}`);

    // Pagination: page=1, limit=2
    const pagedRes = await apiCall('/listings?page=1&limit=2');
    assert(pagedRes.status === 200, 'Pagination page=1&limit=2 returns 200 OK');
    assert(pagedRes.body?.data?.length === 2, 'Returns exactly 2 items for page limit 2');
    assert(pagedRes.body?.meta?.page === 1, 'meta.page is 1');
    assert(pagedRes.body?.meta?.limit === 2, 'meta.limit is 2');
    assert(pagedRes.body?.meta?.total >= 3, 'meta.total counts all matching listings');
    assert(pagedRes.body?.meta?.totalPages >= 2, 'meta.totalPages calculated properly');

    // Sorting by price ascending
    const sortAscRes = await apiCall('/listings?sortBy=price&sortOrder=asc');
    assert(sortAscRes.status === 200, 'Sort by price asc returns 200 OK');
    const ascPrices = sortAscRes.body?.data?.map((l) => l.askingPrice);
    let isSortedAsc = true;
    for (let i = 0; i < ascPrices.length - 1; i++) {
      if (ascPrices[i] > ascPrices[i + 1]) isSortedAsc = false;
    }
    assert(isSortedAsc, 'Listings are sorted by price in ascending order');

    // Sorting by price descending
    const sortDescRes = await apiCall('/listings?sortBy=price&sortOrder=desc');
    assert(sortDescRes.status === 200, 'Sort by price desc returns 200 OK');
    const descPrices = sortDescRes.body?.data?.map((l) => l.askingPrice);
    let isSortedDesc = true;
    for (let i = 0; i < descPrices.length - 1; i++) {
      if (descPrices[i] < descPrices[i + 1]) isSortedDesc = false;
    }
    assert(isSortedDesc, 'Listings are sorted by price in descending order');

    // =================================================================
    // Scenario 9: Deletion & Cancellation (DELETE /listings/:id)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 9: Deletion & Cancellation (DELETE /listings/:id)${colors.reset}`
    );

    // Non-owner unauthorized deletion attempt
    const nonOwnerDeleteRes = await apiCall(
      `/listings/${createdListing._id}`,
      'DELETE',
      null,
      tokenOwnerB
    );
    assert(nonOwnerDeleteRes.status === 403, 'Non-owner delete rejected with 403 Forbidden');

    // Owner deletes / cancels listing
    const deleteRes = await apiCall(`/listings/${createdListing._id}`, 'DELETE', null, tokenOwnerA);
    assert(deleteRes.status === 200, 'Owner cancels listing (200 OK)');
    assert(
      deleteRes.body?.data?.status === ListingStatus.CANCELLED,
      'Listing status transitioned to CANCELLED'
    );

    // Verify Asset status is reverted to VERIFIED in DB
    const revertedAsset = await Asset.findById(verifiedAssetA._id);
    assert(
      revertedAsset.status === AssetStatus.VERIFIED,
      'Asset status successfully reverted back to VERIFIED'
    );

    // Owner can now re-list the asset because there is no conflicting ACTIVE listing
    const relistRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: verifiedAssetA._id.toString(),
        askingPrice: 1100,
        currency: 'BDT',
      },
      tokenOwnerA
    );
    assert(
      relistRes.status === 201,
      'Asset can be successfully re-listed after previous listing was cancelled'
    );

    // Clean up re-listed item
    if (relistRes.body?.data?._id) {
      await Listing.findByIdAndDelete(relistRes.body.data._id);
    }

    // =================================================================
    // Scenario 10: Database Index Verification
    // =================================================================
    console.log(`\n${colors.bold}Scenario 10: Database Index Verification${colors.reset}`);

    const listingIndexes = await Listing.collection.indexes();
    const indexNames = listingIndexes.map((idx) => idx.name);

    assert(
      indexNames.some((name) => name.includes('status') && name.includes('askingPrice')),
      'Database index verified: status + askingPrice'
    );
    assert(
      indexNames.some((name) => name.includes('status') && name.includes('createdAt')),
      'Database index verified: status + createdAt'
    );
    assert(
      indexNames.some((name) => name.includes('sellerId') && name.includes('status')),
      'Database index verified: sellerId + status'
    );
    assert(
      indexNames.some((name) => name.includes('assetId')),
      'Database index verified: assetId uniqueness guard'
    );
  } catch (err) {
    console.error(`${colors.red}Unhandled test suite exception:${colors.reset}`, err);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    const userIds = [userOwnerA?._id, userOwnerB?._id, userSuspended?._id, userAdmin?._id].filter(
      Boolean
    );
    const assetIds = [
      verifiedAssetA?._id,
      unverifiedAsset?._id,
      suspiciousAsset?._id,
      busAsset?._id,
      eventAsset?._id,
    ].filter(Boolean);

    if (assetIds.length > 0) {
      await Listing.deleteMany({ assetId: { $in: assetIds } });
      await Asset.deleteMany({ _id: { $in: assetIds } });
    }
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    await mongoose.disconnect();
    console.log(`${colors.blue}Database disconnected cleanly.${colors.reset}\n`);

    console.log(
      `${colors.bold}${colors.cyan}======================================================`
    );
    console.log(
      `TEST SUMMARY: ${colors.green}${passedCount} passed${colors.cyan}, ${failedCount > 0 ? colors.red : colors.green}${failedCount} failed${colors.reset}`
    );
    console.log(
      `${colors.bold}${colors.cyan}======================================================${colors.reset}\n`
    );

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runTests();
