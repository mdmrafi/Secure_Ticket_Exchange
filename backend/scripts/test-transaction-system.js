import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { TransactionEvent } from '../src/modules/transactions/transaction-event.model.js';
import {
  AssetTypes,
  AssetStatus,
  ListingStatus,
  TransactionStatus,
  PaymentStatus,
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
  console.log(
    `\n${colors.bold}${colors.cyan}======================================================`
  );
  console.log(`     TRANSACTION SYSTEM & LIFECYCLE TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set.${colors.reset}\n`);

  await Transaction.syncIndexes();
  await TransactionEvent.syncIndexes();
  await Listing.syncIndexes();

  const timestamp = Date.now();
  let seller, buyerA, buyerB, uninvolvedUser;
  let tokenSeller, tokenBuyerA, tokenBuyerB, tokenUninvolved;
  let asset1, asset2, asset3, asset4;
  let listing1, listing2, listing3, listing4;

  try {
    // -----------------------------------------------------------------
    // SETUP: Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user accounts...${colors.reset}`);

    seller = await User.create({
      name: 'Transaction Seller Sam',
      email: `tx.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 95,
    });
    tokenSeller = generateToken(seller);

    buyerA = await User.create({
      name: 'Transaction Buyer Alice',
      email: `tx.buyer.alice.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 92,
    });
    tokenBuyerA = generateToken(buyerA);

    buyerB = await User.create({
      name: 'Transaction Buyer Bob',
      email: `tx.buyer.bob.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 88,
    });
    tokenBuyerB = generateToken(buyerB);

    uninvolvedUser = await User.create({
      name: 'Uninvolved Charlie',
      email: `tx.charlie.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 80,
    });
    tokenUninvolved = generateToken(uninvolvedUser);

    // -----------------------------------------------------------------
    // SETUP: Assets & Listings
    // -----------------------------------------------------------------
    console.log(
      `${colors.yellow}[SETUP] Creating verified assets and active listings...${colors.reset}`
    );

    // Asset 1 for Successful Transaction Flow
    asset1 = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `TX-ASSET-1-${timestamp}`,
      title: 'Train 701: Dhaka -> Chittagong (AC Chair)',
      originalValue: 1200,
      currency: 'BDT',
      metadata: {
        fromStation: 'Dhaka',
        toStation: 'Chittagong',
        journeyDate: '2026-11-10',
        seat: 'A1',
      },
    });

    listing1 = await Listing.create({
      assetId: asset1._id,
      sellerId: seller._id,
      askingPrice: 1350,
      price: 1350,
      originalFaceValue: 1200,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    // Asset 2 for Invalid Jump Test
    asset2 = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `TX-ASSET-2-${timestamp}`,
      title: 'Train 703: Dhaka -> Sylhet',
      originalValue: 900,
      currency: 'BDT',
    });

    listing2 = await Listing.create({
      assetId: asset2._id,
      sellerId: seller._id,
      askingPrice: 1000,
      price: 1000,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    // Asset 3 for Failed Payment Test
    asset3 = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.BUS_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `TX-ASSET-3-${timestamp}`,
      title: 'Bus Ticket: Dhaka -> Rajshahi',
      originalValue: 800,
      currency: 'BDT',
    });

    listing3 = await Listing.create({
      assetId: asset3._id,
      sellerId: seller._id,
      askingPrice: 850,
      price: 850,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    // Asset 4 for Cancellation Test
    asset4 = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `TX-ASSET-4-${timestamp}`,
      title: 'Concert Pass',
      originalValue: 2500,
      currency: 'BDT',
    });

    listing4 = await Listing.create({
      assetId: asset4._id,
      sellerId: seller._id,
      askingPrice: 2800,
      price: 2800,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    console.log(`${colors.green}Test fixtures initialized successfully.${colors.reset}\n`);

    // =================================================================
    // Scenario 1: Full Successful Transaction Flow
    // INITIATED -> PAYMENT_PENDING -> PAYMENT_CONFIRMED -> TRANSFER_PENDING -> COMPLETED
    // =================================================================
    console.log(`${colors.bold}Scenario 1: Successful Transaction Lifecycle${colors.reset}`);

    // Step 1: Initiate Transaction
    const initRes = await apiCall(
      '/transactions',
      'POST',
      { listingId: listing1._id.toString() },
      tokenBuyerA
    );
    assert(initRes.status === 201, 'POST /transactions initiates exchange (201 Created)');
    const tx1 = initRes.body?.data;
    assert(tx1 != null, 'Transaction object returned');
    assert(
      tx1.transactionStatus === TransactionStatus.INITIATED,
      'Initial transactionStatus is INITIATED'
    );
    assert(tx1.paymentStatus === PaymentStatus.PENDING, 'Initial paymentStatus is PENDING');
    assert(tx1.amount === 1350, 'Transaction amount matches listing askingPrice');
    assert(
      tx1.buyerId === buyerA._id.toString() || tx1.buyerId?._id === buyerA._id.toString(),
      'buyerId matches Alice'
    );

    // Step 2: Create Payment Session
    const payRes = await apiCall(`/transactions/${tx1._id}/pay`, 'POST', {}, tokenBuyerA);
    assert(
      payRes.status === 200,
      'POST /transactions/:id/pay initializes checkout session (200 OK)'
    );
    assert(
      payRes.body?.data?.transaction?.transactionStatus === TransactionStatus.PAYMENT_PENDING,
      'Transaction transitions to PAYMENT_PENDING'
    );
    assert(
      payRes.body?.data?.paymentSession?.paymentSessionId != null,
      'Payment session ID generated by mock payment provider'
    );

    // Step 3: Process Payment (Outcome: SUCCESS)
    const procRes = await apiCall(
      `/transactions/${tx1._id}/process-payment`,
      'POST',
      { outcome: 'SUCCESS' },
      tokenBuyerA
    );
    assert(procRes.status === 200, 'POST /transactions/:id/process-payment returns 200 OK');
    assert(
      procRes.body?.data?.paymentStatus === PaymentStatus.PAID,
      'Payment status transitioned to PAID'
    );
    assert(
      procRes.body?.data?.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED,
      'Transaction status transitioned to PAYMENT_CONFIRMED'
    );
    assert(procRes.body?.data?.escrowStatus === 'HELD', 'Escrow status updated to HELD');
    assert(
      procRes.body?.data?.paymentDetails?.transactionRef != null,
      'Payment reference recorded'
    );

    // Step 4: Transfer Asset & Finalize Transaction
    const transferRes = await apiCall(`/transactions/${tx1._id}/transfer`, 'POST', {}, tokenBuyerA);
    assert(
      transferRes.status === 200,
      'POST /transactions/:id/transfer completes exchange (200 OK)'
    );
    assert(
      transferRes.body?.data?.transactionStatus === TransactionStatus.COMPLETED,
      'Transaction status reached terminal COMPLETED state'
    );
    assert(transferRes.body?.data?.escrowStatus === 'RELEASED', 'Escrow funds released to seller');
    assert(transferRes.body?.data?.completedAt != null, 'completedAt timestamp populated');

    // Assert asset ownership transferred in MongoDB
    const transferredAsset = await Asset.findById(asset1._id);
    assert(
      transferredAsset.ownerId.toString() === buyerA._id.toString(),
      'Asset ownership transferred to Buyer Alice in database'
    );
    assert(
      transferredAsset.status === AssetStatus.TRANSFERRED,
      'Asset status updated to TRANSFERRED'
    );

    // Assert listing marked SOLD
    const soldListing = await Listing.findById(listing1._id);
    assert(soldListing.status === ListingStatus.SOLD, 'Listing status updated to SOLD');

    // =================================================================
    // Scenario 2: Strict State Transitions (Prevent Illegal Status Jump)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 2: Strict State Transitions (Prevent Illegal Jumps)${colors.reset}`
    );

    // Create fresh transaction in INITIATED state
    const jumpInitRes = await apiCall(
      '/transactions',
      'POST',
      { listingId: listing2._id.toString() },
      tokenBuyerB
    );
    const tx2 = jumpInitRes.body?.data;
    assert(
      tx2.transactionStatus === TransactionStatus.INITIATED,
      'New transaction in INITIATED status'
    );

    // Attempt direct jump: INITIATED -> COMPLETED (bypassing payment and transfer)
    const illegalJumpRes = await apiCall(
      `/transactions/${tx2._id}/transfer`,
      'POST',
      {},
      tokenBuyerB
    );
    assert(
      illegalJumpRes.status === 400,
      'Direct jump INITIATED -> COMPLETED rejected with 400 Bad Request'
    );
    assert(
      illegalJumpRes.body?.message?.includes(
        'A transaction must never jump directly from INITIATED to COMPLETED'
      ) || illegalJumpRes.body?.message?.includes('Must be PAYMENT_CONFIRMED'),
      'Strict transition guard explains required intermediate steps'
    );

    // Attempt processing payment directly while in INITIATED (without creating session / PAYMENT_PENDING)
    const illegalProcessRes = await apiCall(
      `/transactions/${tx2._id}/process-payment`,
      'POST',
      { outcome: 'SUCCESS' },
      tokenBuyerB
    );
    assert(
      illegalProcessRes.status === 400,
      'Processing payment while INITIATED rejected with 400 Bad Request'
    );

    // =================================================================
    // Scenario 3: Failed Payment Flow
    // =================================================================
    console.log(`\n${colors.bold}Scenario 3: Failed Payment Handling${colors.reset}`);

    const failInitRes = await apiCall(
      '/transactions',
      'POST',
      { listingId: listing3._id.toString() },
      tokenBuyerA
    );
    const tx3 = failInitRes.body?.data;

    // Create payment session
    await apiCall(`/transactions/${tx3._id}/pay`, 'POST', {}, tokenBuyerA);

    // Process payment with outcome FAIL
    const failProcRes = await apiCall(
      `/transactions/${tx3._id}/process-payment`,
      'POST',
      { outcome: 'FAIL', failureReason: 'Insufficient funds on credit card' },
      tokenBuyerA
    );
    assert(
      failProcRes.status === 200,
      'Failed payment processing returns 200 OK with failure status'
    );
    assert(
      failProcRes.body?.data?.paymentStatus === PaymentStatus.FAILED,
      'paymentStatus transitioned to FAILED'
    );
    assert(
      failProcRes.body?.data?.paymentDetails?.failureReason?.includes('Insufficient funds'),
      'failureReason recorded on transaction paymentDetails'
    );
    assert(
      failProcRes.body?.data?.transactionStatus === TransactionStatus.PAYMENT_PENDING,
      'transactionStatus remains in PAYMENT_PENDING to allow buyer retry'
    );

    // =================================================================
    // Scenario 4: Cancellation Flow & Resource Release
    // =================================================================
    console.log(`\n${colors.bold}Scenario 4: Cancellation Flow & Resource Release${colors.reset}`);

    const cancelInitRes = await apiCall(
      '/transactions',
      'POST',
      { listingId: listing4._id.toString() },
      tokenBuyerB
    );
    const tx4 = cancelInitRes.body?.data;

    // Cancel transaction
    const cancelRes = await apiCall(
      `/transactions/${tx4._id}/cancel`,
      'POST',
      { reason: 'Buyer found alternative flight ticket' },
      tokenBuyerB
    );
    assert(cancelRes.status === 200, 'POST /transactions/:id/cancel returns 200 OK');
    assert(
      cancelRes.body?.data?.transactionStatus === TransactionStatus.CANCELLED,
      'transactionStatus is CANCELLED'
    );
    assert(cancelRes.body?.data?.cancelledAt != null, 'cancelledAt timestamp recorded');

    // Assert listing reverted back to ACTIVE
    const restoredListing = await Listing.findById(listing4._id);
    assert(
      restoredListing.status === ListingStatus.ACTIVE,
      'Listing status reverted back to ACTIVE'
    );

    // =================================================================
    // Scenario 5: Duplicate Payment Callback (Idempotency)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 5: Duplicate Payment Callback (Idempotency)${colors.reset}`
    );

    // tx1 was already paid in Scenario 1. Send duplicate payment webhook callback:
    const dupCallbackRes = await apiCall(`/transactions/${tx1._id}/callback`, 'POST', {
      status: 'PAID',
      outcome: 'SUCCESS',
      transactionRef: procRes.body?.data?.paymentDetails?.transactionRef,
    });

    assert(dupCallbackRes.status === 200, 'Duplicate payment callback returns 200 OK');
    assert(
      dupCallbackRes.body?.data?.idempotent === true,
      'Response explicitly identifies idempotent duplicate callback handling'
    );
    assert(
      dupCallbackRes.body?.data?.message?.includes('Duplicate payment callback'),
      'Callback message explains duplicate webhook ignored'
    );

    // =================================================================
    // Scenario 6: Unauthorized Transaction Access Protection
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 6: Unauthorized Transaction Access Protection${colors.reset}`
    );

    // Charlie (uninvolved) attempts to view tx1 (between Alice and Sam)
    const unauthorizedGetRes = await apiCall(
      `/transactions/${tx1._id}`,
      'GET',
      null,
      tokenUninvolved
    );
    assert(
      unauthorizedGetRes.status === 403,
      'Uninvolved user accessing transaction rejected with 403 Forbidden'
    );
    assert(
      unauthorizedGetRes.body?.message?.includes(
        'not authorized to view or manage this transaction'
      ),
      'Access control error boundary explained'
    );

    // Charlie attempts to cancel Alice's transaction
    const unauthorizedCancelRes = await apiCall(
      `/transactions/${tx2._id}/cancel`,
      'POST',
      { reason: 'Malicious cancellation' },
      tokenUninvolved
    );
    assert(
      unauthorizedCancelRes.status === 403,
      'Uninvolved user cancelling transaction rejected with 403 Forbidden'
    );

    // Alice (buyer) successfully retrieves own transaction details
    const aliceGetRes = await apiCall(`/transactions/${tx1._id}`, 'GET', null, tokenBuyerA);
    assert(aliceGetRes.status === 200, 'Buyer Alice retrieves own transaction (200 OK)');
    assert(aliceGetRes.body?.data?._id === tx1._id, 'Returns matching transaction ID');

    // =================================================================
    // Scenario 7: Immutable Transaction History / Event Log Verification
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 7: Immutable Transaction Event History & Log${colors.reset}`
    );

    const eventsRes = await apiCall(`/transactions/${tx1._id}/events`, 'GET', null, tokenBuyerA);
    assert(eventsRes.status === 200, 'GET /transactions/:id/events returns 200 OK');
    const events = eventsRes.body?.data;
    assert(Array.isArray(events), 'Events list is an array');
    assert(events.length >= 5, 'Events audit log contains full chronological sequence');

    // Verify sequence: TRANSACTION_INITIATED -> PAYMENT_SESSION_CREATED -> PAYMENT_CONFIRMED -> TRANSFER_PENDING -> TRANSACTION_COMPLETED
    const eventTypes = events.map((e) => e.eventType);
    console.log(
      `  ${colors.cyan}Audit event log sequence: [${eventTypes.join(' -> ')}]${colors.reset}`
    );

    assert(
      eventTypes.includes('TRANSACTION_INITIATED'),
      'Audit log contains TRANSACTION_INITIATED'
    );
    assert(
      eventTypes.includes('PAYMENT_SESSION_CREATED'),
      'Audit log contains PAYMENT_SESSION_CREATED'
    );
    assert(eventTypes.includes('PAYMENT_CONFIRMED'), 'Audit log contains PAYMENT_CONFIRMED');
    assert(eventTypes.includes('TRANSFER_PENDING'), 'Audit log contains TRANSFER_PENDING');
    assert(
      eventTypes.includes('TRANSACTION_COMPLETED'),
      'Audit log contains TRANSACTION_COMPLETED'
    );

    // Verify immutability of TransactionEvent collection
    const firstEvent = await TransactionEvent.findOne({ transactionId: tx1._id });
    let immutabilityGuarded = false;
    try {
      await TransactionEvent.updateOne(
        { _id: firstEvent._id },
        { $set: { eventType: 'MUTATED_TAMPERED' } }
      );
    } catch (err) {
      if (err.message?.includes('strictly immutable')) {
        immutabilityGuarded = true;
      }
    }
    assert(
      immutabilityGuarded,
      'TransactionEvent collection strictly blocks mutation/update (immutability preserved)'
    );
  } catch (err) {
    console.error(`${colors.red}Unhandled test suite exception:${colors.reset}`, err);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    const userIds = [seller?._id, buyerA?._id, buyerB?._id, uninvolvedUser?._id].filter(Boolean);
    const assetIds = [asset1?._id, asset2?._id, asset3?._id, asset4?._id].filter(Boolean);
    const listingIds = [listing1?._id, listing2?._id, listing3?._id, listing4?._id].filter(Boolean);

    if (listingIds.length > 0) {
      const txs = await Transaction.find({ listingId: { $in: listingIds } }).select('_id');
      const txIds = txs.map((t) => t._id);
      // Clean up test events directly via native collection (bypassing Mongoose pre-hook)
      if (txIds.length > 0) {
        await TransactionEvent.collection.deleteMany({ transactionId: { $in: txIds } });
        await Transaction.deleteMany({ _id: { $in: txIds } });
      }
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
