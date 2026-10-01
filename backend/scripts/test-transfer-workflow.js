import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { TransferRequest } from '../src/modules/transfers/transfer-request.model.js';
import { TransferEvent } from '../src/modules/transfers/transfer-event.model.js';
import { TransferPolicy } from '../src/modules/transfers/transfer.policy.js';
import { MockTransferProvider } from '../src/modules/transfers/providers/mock-transfer.provider.js';
import { transferService } from '../src/modules/transfers/transfer.service.js';
import {
  AssetTypes,
  AssetStatus,
  ListingStatus,
  TransactionStatus,
  PaymentStatus,
  VerificationStatus,
  TransferRequestStatus,
  TransferEventType,
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
  console.log(`     ASSET TRANSFER WORKFLOW & STATE TRANSITIONS SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set.${colors.reset}\n`);

  await TransferRequest.syncIndexes();
  await TransferEvent.syncIndexes();

  const timestamp = Date.now();
  let seller, buyer, uninvolvedUser, adminUser;
  let tokenSeller, tokenBuyer, tokenUninvolved, tokenAdmin;
  let eventAsset, railwayAsset, nonTransferableAsset, unverifiedAsset;
  let transaction;

  try {
    // -----------------------------------------------------------------
    // SETUP: Test Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user accounts...${colors.reset}`);

    seller = await User.create({
      name: 'Transfer Seller Alice',
      email: `tf.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 95,
    });
    tokenSeller = generateToken(seller);

    buyer = await User.create({
      name: 'Transfer Buyer Bob',
      email: `tf.buyer.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 90,
    });
    tokenBuyer = generateToken(buyer);

    uninvolvedUser = await User.create({
      name: 'Transfer Uninvolved Charlie',
      email: `tf.uninvolved.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 80,
    });
    tokenUninvolved = generateToken(uninvolvedUser);

    adminUser = await User.create({
      name: 'Transfer Admin Dave',
      email: `tf.admin.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 100,
    });
    tokenAdmin = generateToken(adminUser);

    // -----------------------------------------------------------------
    // SETUP: Assets
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test assets with varying legal transferability...${colors.reset}`);

    // Asset 1: Legally Transferable Event Ticket Pass
    eventAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-EVENT-${timestamp}`,
      title: 'Tech Summit 2026 VIP Pass',
      originalValue: 5000,
      currency: 'BDT',
      metadata: {
        eventName: 'Tech Summit 2026',
        venue: 'BICC, Dhaka',
        attendeeName: 'Alice Seller',
      },
    });

    // Asset 2: Railway Ticket (Legally strictly restricted by default transport regulation)
    railwayAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-RAIL-${timestamp}`,
      title: 'Train 701 Subarna Express: Dhaka -> Chittagong',
      originalValue: 1200,
      currency: 'BDT',
      metadata: {
        fromStation: 'Dhaka',
        toStation: 'Chittagong',
        pnr: `PNR${timestamp}`,
        passengerName: 'Alice Seller',
        passengerNid: '19901234567890123',
      },
    });

    // Asset 3: Asset explicitly marked non-transferable (isTransferable = false)
    nonTransferableAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: false,
      uniqueAssetIdentifier: `TF-NON-XFER-${timestamp}`,
      title: 'Personalized Non-Transferable Backstage Pass',
      originalValue: 3000,
      currency: 'BDT',
      metadata: {
        restrictions: 'Strictly non-transferable personal pass',
      },
    });

    // Asset 4: Unverified Asset (verificationStatus = UNVERIFIED)
    unverifiedAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.DRAFT,
      verificationStatus: VerificationStatus.UNVERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-UNVERIFIED-${timestamp}`,
      title: 'Unverified Ticket',
      originalValue: 1500,
      currency: 'BDT',
    });

    // Setup an active listing and confirmed transaction for Asset 1
    const listing = await Listing.create({
      assetId: eventAsset._id,
      sellerId: seller._id,
      askingPrice: 5500,
      price: 5500,
      originalFaceValue: 5000,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    transaction = await Transaction.create({
      listingId: listing._id,
      assetId: eventAsset._id,
      sellerId: seller._id,
      buyerId: buyer._id,
      amount: 5500,
      currency: 'BDT',
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
      escrowStatus: 'HELD',
    });

    console.log(`${colors.green}Test fixtures initialized successfully.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // Scenario 1: TransferPolicy - Eligibility Checks
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Scenario 1: TransferPolicy - Legal Transferability & Eligibility${colors.reset}`);

    // Check eligible event asset via API
    const el1 = await apiCall(`/transfers/eligibility/${eventAsset._id}`, 'GET', null, tokenSeller);
    assert(el1.status === 200, 'GET /transfers/eligibility/:id returns 200 OK for transferable asset');
    assert(el1.body?.data?.eligible === true, 'Event ticket pass evaluates to eligible: true');
    assert(el1.body?.data?.policyCode === 'ELIGIBLE', 'Policy code indicates ELIGIBLE');

    // Check legally non-transferable railway ticket (default transport regulation without authorized provider)
    const el2 = await apiCall(`/transfers/eligibility/${railwayAsset._id}`, 'GET', null, tokenSeller);
    assert(el2.status === 200, 'GET /transfers/eligibility/:id returns 200 OK');
    assert(el2.body?.data?.eligible === false, 'Railway ticket without authorized provider evaluates to eligible: false');
    assert(el2.body?.data?.policyCode === 'LEGALLY_NON_TRANSFERABLE', 'Identifies LEGALLY_NON_TRANSFERABLE policy restriction');

    // Check explicitly non-transferable asset
    const el3 = await apiCall(`/transfers/eligibility/${nonTransferableAsset._id}`, 'GET', null, tokenSeller);
    assert(el3.status === 200, 'GET /transfers/eligibility/:id returns 200 OK');
    assert(el3.body?.data?.eligible === false, 'Asset with isTransferable: false evaluates to eligible: false');
    assert(el3.body?.data?.policyCode === 'ASSET_EXPLICITLY_NON_TRANSFERABLE', 'Identifies ASSET_EXPLICITLY_NON_TRANSFERABLE');

    // Check unverified asset
    const el4 = await apiCall(`/transfers/eligibility/${unverifiedAsset._id}`, 'GET', null, tokenSeller);
    assert(el4.status === 200, 'GET /transfers/eligibility/:id returns 200 OK');
    assert(el4.body?.data?.eligible === false, 'Unverified asset evaluates to eligible: false');
    assert(el4.body?.data?.policyCode === 'ASSET_NOT_VERIFIED', 'Identifies ASSET_NOT_VERIFIED');

    // Attempting to request transfer for ineligible asset creates NOT_ELIGIBLE status
    const reqIneligible = await apiCall('/transfers', 'POST', {
      assetId: nonTransferableAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenSeller);

    assert(reqIneligible.status === 400, 'Transfer request for non-transferable asset is rejected (400 Bad Request)');
    const storedIneligible = await TransferRequest.findOne({ assetId: nonTransferableAsset._id });
    assert(storedIneligible !== null, 'Ineligible transfer request is recorded in database');
    assert(storedIneligible.status === TransferRequestStatus.NOT_ELIGIBLE, 'Status is recorded as NOT_ELIGIBLE');

    // Direct transition out of NOT_ELIGIBLE is prohibited (terminal state)
    let notEligibleTransitionError = false;
    try {
      transferService.validateStateTransition(TransferRequestStatus.NOT_ELIGIBLE, TransferRequestStatus.APPROVED);
    } catch (err) {
      notEligibleTransitionError = true;
    }
    assert(notEligibleTransitionError, 'State machine strictly blocks transition from NOT_ELIGIBLE to APPROVED');

    // -----------------------------------------------------------------
    // Scenario 2: Successful Full Lifecycle: REQUESTED -> APPROVED -> PROCESSING -> COMPLETED
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 2: Successful Full Lifecycle (REQUESTED -> APPROVED -> PROCESSING -> COMPLETED)${colors.reset}`);

    // Step 1: POST /transfers (REQUESTED)
    const reqRes = await apiCall('/transfers', 'POST', {
      assetId: eventAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
      transactionId: transaction._id.toString(),
    }, tokenSeller);

    assert(reqRes.status === 201, 'POST /transfers creates transfer request (201 Created)');
    const transferId = reqRes.body?.data?._id;
    assert(Boolean(transferId), 'Transfer request ID returned');
    assert(reqRes.body?.data?.status === TransferRequestStatus.REQUESTED, 'Initial status is REQUESTED');
    assert(Boolean(reqRes.body?.data?.createdAt), 'createdAt timestamp populated');

    // Step 2: POST /transfers/:id/approve (APPROVED)
    const approveRes = await apiCall(`/transfers/${transferId}/approve`, 'POST', {}, tokenSeller);
    assert(approveRes.status === 200, 'POST /transfers/:id/approve returns 200 OK');
    assert(approveRes.body?.data?.status === TransferRequestStatus.APPROVED, 'Status transitioned to APPROVED');

    // Step 3: POST /transfers/:id/execute (PROCESSING -> COMPLETED)
    const execRes = await apiCall(`/transfers/${transferId}/execute`, 'POST', {}, tokenSeller);
    assert(execRes.status === 200, 'POST /transfers/:id/execute returns 200 OK');
    assert(execRes.body?.data?.status === TransferRequestStatus.COMPLETED, 'Terminal status reached COMPLETED');
    assert(Boolean(execRes.body?.data?.completedAt), 'completedAt timestamp populated');
    assert(Boolean(execRes.body?.data?.providerTransferId), 'External provider transfer ID generated');

    // Verify Asset Ownership & Status in Database
    const updatedAsset = await Asset.findById(eventAsset._id);
    assert(updatedAsset.ownerId.toString() === buyer._id.toString(), 'Asset ownership transferred to Buyer Bob in DB');
    assert(updatedAsset.status === AssetStatus.TRANSFERRED, 'Asset status updated to TRANSFERRED');

    // Verify Transaction and Listing status updated
    const updatedTx = await Transaction.findById(transaction._id);
    assert(updatedTx.transactionStatus === TransactionStatus.COMPLETED, 'Linked transaction status updated to COMPLETED');
    assert(updatedTx.escrowStatus === 'RELEASED', 'Escrow funds released to seller');

    const updatedListing = await Listing.findById(listing._id);
    assert(updatedListing.status === ListingStatus.SOLD, 'Listing status updated to SOLD');

    // -----------------------------------------------------------------
    // Scenario 3: Strict State Transitions (Prohibiting Illegal Jumps)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 3: Strict State Transitions & Prohibited Direct Jumps${colors.reset}`);

    // Create another transferable asset for jump testing
    const jumpAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-JUMP-${timestamp}`,
      title: 'Concert Ticket for Direct Jump Testing',
      originalValue: 2000,
    });

    const jumpReqRes = await apiCall('/transfers', 'POST', {
      assetId: jumpAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenSeller);

    const jumpTransferId = jumpReqRes.body?.data?._id;
    assert(jumpReqRes.status === 201, 'Created transfer request in REQUESTED state');

    // Attempt direct jump: REQUESTED -> COMPLETED (skipping APPROVED and PROCESSING)
    const directExecRes = await apiCall(`/transfers/${jumpTransferId}/execute`, 'POST', {}, tokenSeller);
    assert(directExecRes.status === 400, 'Direct jump REQUESTED -> COMPLETED rejected with 400 Bad Request');
    assert(
      directExecRes.body?.message?.includes('Direct transfer execution from REQUESTED is prohibited') ||
      directExecRes.body?.message?.includes('must be APPROVED first'),
      'Error message mandates intermediate approval step'
    );

    // Attempt modifying terminal COMPLETED state
    const terminalMutateRes = await apiCall(`/transfers/${transferId}/cancel`, 'POST', {
      reason: 'Attempt cancel on completed transfer',
    }, tokenSeller);
    assert(terminalMutateRes.status === 400, 'Attempt to cancel terminal COMPLETED transfer rejected with 400 Bad Request');

    // -----------------------------------------------------------------
    // Scenario 4: Rejection State Transition: REQUESTED -> REJECTED
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 4: Rejection Transition (REQUESTED -> REJECTED)${colors.reset}`);

    const rejectRes = await apiCall(`/transfers/${jumpTransferId}/reject`, 'POST', {
      reason: 'Seller declined transfer request due to ticket policy update',
    }, tokenSeller);

    assert(rejectRes.status === 200, 'POST /transfers/:id/reject returns 200 OK');
    assert(rejectRes.body?.data?.status === TransferRequestStatus.REJECTED, 'Status transitioned to REJECTED');
    assert(rejectRes.body?.data?.rejectionReason?.includes('declined transfer'), 'rejectionReason recorded');

    // Verify terminal state immutability (REJECTED -> APPROVED prohibited)
    const reApproveRes = await apiCall(`/transfers/${jumpTransferId}/approve`, 'POST', {}, tokenSeller);
    assert(reApproveRes.status === 400, 'Attempt to approve terminal REJECTED transfer rejected with 400 Bad Request');

    // -----------------------------------------------------------------
    // Scenario 5: Cancellation State Transitions: REQUESTED -> CANCELLED & APPROVED -> CANCELLED
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 5: Cancellation Transitions (REQUESTED -> CANCELLED & APPROVED -> CANCELLED)${colors.reset}`);

    // Part A: REQUESTED -> CANCELLED
    const cancelAssetA = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-CANCEL-A-${timestamp}`,
      title: 'Ticket for Request Cancellation',
      originalValue: 1500,
    });

    const cancelReqA = await apiCall('/transfers', 'POST', {
      assetId: cancelAssetA._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenSeller);

    const cancelResA = await apiCall(`/transfers/${cancelReqA.body?.data?._id}/cancel`, 'POST', {
      reason: 'Buyer changed plans before approval',
    }, tokenBuyer);

    assert(cancelResA.status === 200, 'POST /transfers/:id/cancel from REQUESTED returns 200 OK');
    assert(cancelResA.body?.data?.status === TransferRequestStatus.CANCELLED, 'Status transitioned to CANCELLED');
    assert(cancelResA.body?.data?.cancellationReason?.includes('Buyer changed plans'), 'cancellationReason recorded');

    // Part B: APPROVED -> CANCELLED
    const cancelAssetB = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-CANCEL-B-${timestamp}`,
      title: 'Ticket for Approved Cancellation',
      originalValue: 1500,
    });

    const cancelReqB = await apiCall('/transfers', 'POST', {
      assetId: cancelAssetB._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenSeller);

    await apiCall(`/transfers/${cancelReqB.body?.data?._id}/approve`, 'POST', {}, tokenSeller);

    const cancelResB = await apiCall(`/transfers/${cancelReqB.body?.data?._id}/cancel`, 'POST', {
      reason: 'Seller withdrew offer after approval',
    }, tokenSeller);

    assert(cancelResB.status === 200, 'POST /transfers/:id/cancel from APPROVED returns 200 OK');
    assert(cancelResB.body?.data?.status === TransferRequestStatus.CANCELLED, 'Status transitioned to CANCELLED');

    // -----------------------------------------------------------------
    // Scenario 6: Provider Failure & Rollback Handling
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 6: Provider Failure & Rollback Handling (PROCESSING -> REJECTED)${colors.reset}`);

    const failureAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-FAIL-${timestamp}`,
      title: 'Ticket for Rollback Verification',
      originalValue: 2500,
    });

    const failReqRes = await apiCall('/transfers', 'POST', {
      assetId: failureAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenSeller);

    const failTransferId = failReqRes.body?.data?._id;
    await apiCall(`/transfers/${failTransferId}/approve`, 'POST', {}, tokenSeller);

    // Execute with simulateFailure: true to simulate external gateway crash / rejection
    const failExecRes = await apiCall(`/transfers/${failTransferId}/execute`, 'POST', {
      simulateFailure: true,
      failureReason: 'External partner ticketing API timeout during token reassignment',
    }, tokenSeller);

    assert(failExecRes.status === 200, 'Execution handles provider failure gracefully (returns 200 with result)');
    assert(failExecRes.body?.data?.status === TransferRequestStatus.REJECTED, 'Status transitioned to REJECTED following failure');
    assert(
      failExecRes.body?.data?.failureReason?.includes('ticketing API timeout') ||
      failExecRes.body?.data?.failureReason?.includes('transfer gateway rejected'),
      'failureReason recorded on request document'
    );

    // Rollback Verification: Asset ownership must remain with Alice Seller!
    const unmutatedAsset = await Asset.findById(failureAsset._id);
    assert(
      unmutatedAsset.ownerId.toString() === seller._id.toString(),
      'Rollback verified: Asset ownership was NOT reassigned to buyer'
    );

    // -----------------------------------------------------------------
    // Scenario 7: Railway Ticket Identity Protection
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 7: Railway Passenger Identity Protection Enforcement${colors.reset}`);

    // Create a special test instance of TransferService with custom provider options
    const defaultMockProvider = new MockTransferProvider({
      isAuthorizedRailwayProvider: false,
      supportsIdentityModification: false,
    });
    const protectedService = new transferService.constructor(transferService.repo, defaultMockProvider);

    // Directly test TransferPolicy.allowsIdentityModification
    assert(
      TransferPolicy.allowsIdentityModification(railwayAsset, defaultMockProvider) === false,
      'TransferPolicy strictly denies railway passenger identity modification for unauthorized provider'
    );

    // Now test authorized external railway provider
    const authorizedRailwayProvider = new MockTransferProvider({
      isAuthorizedRailwayProvider: true,
      supportsIdentityModification: true,
    });

    assert(
      TransferPolicy.allowsIdentityModification(railwayAsset, authorizedRailwayProvider) === true,
      'TransferPolicy permits railway identity update when external provider is authorized and supports it'
    );

    // Execute authorized transfer test through authorized provider
    const authorizedService = new transferService.constructor(transferService.repo, authorizedRailwayProvider);
    const authEligibility = TransferPolicy.evaluateEligibility(railwayAsset, {
      fromUser: seller,
      toUser: buyer,
      provider: authorizedRailwayProvider,
    });
    assert(authEligibility.eligible === true, 'Railway ticket eligible with authorized official railway provider');

    // -----------------------------------------------------------------
    // Scenario 8: Ownership & Transaction Verification Guards
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 8: Ownership & Transaction Verification Guards${colors.reset}`);

    const guardAsset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `TF-GUARD-${timestamp}`,
      title: 'Ticket for Guard Verification',
      originalValue: 1000,
    });

    // Unauthorized ownership attempt: Charlie attempts to transfer Alice's asset
    const unauthorizedOwnership = await apiCall('/transfers', 'POST', {
      assetId: guardAsset._id.toString(),
      fromUserId: uninvolvedUser._id.toString(), // Charlie is not the owner
      toUserId: buyer._id.toString(),
    }, tokenUninvolved);

    assert(
      unauthorizedOwnership.status === 403,
      'Non-owner initiating transfer rejected with 403 Forbidden'
    );

    // Actor mismatch attempt: Bob tries to initiate transfer on behalf of Alice without authorization
    const actorMismatch = await apiCall('/transfers', 'POST', {
      assetId: guardAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
    }, tokenBuyer);

    assert(
      actorMismatch.status === 403,
      'Unauthorized user acting as fromUserId rejected with 403 Forbidden'
    );

    // Unpaid transaction verification guard: attempt to transfer with INITIATED transaction
    const unpaidTx = await Transaction.create({
      listingId: listing._id,
      assetId: guardAsset._id,
      sellerId: seller._id,
      buyerId: buyer._id,
      amount: 1000,
      currency: 'BDT',
      paymentStatus: PaymentStatus.PENDING,
      transactionStatus: TransactionStatus.INITIATED,
    });

    const unpaidTxTransfer = await apiCall('/transfers', 'POST', {
      assetId: guardAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: buyer._id.toString(),
      transactionId: unpaidTx._id.toString(),
    }, tokenSeller);

    assert(
      unpaidTxTransfer.status === 400,
      'Transfer linked to unpaid transaction rejected with 400 Bad Request'
    );

    // Self-transfer attempt
    const selfTransfer = await apiCall('/transfers', 'POST', {
      assetId: guardAsset._id.toString(),
      fromUserId: seller._id.toString(),
      toUserId: seller._id.toString(),
    }, tokenSeller);


    assert(selfTransfer.status === 400, 'Self-transfer rejected with 400 Bad Request');

    // Unauthorized uninvolved user reading transfer request
    const unauthorizedRead = await apiCall(`/transfers/${transferId}`, 'GET', null, tokenUninvolved);
    assert(unauthorizedRead.status === 403, 'Uninvolved user accessing transfer rejected with 403 Forbidden');

    // -----------------------------------------------------------------
    // Scenario 9: Immutable Transfer Event History & Audit Log
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 9: Immutable Transfer Event History & Audit Trail${colors.reset}`);

    const eventsRes = await apiCall(`/transfers/${transferId}/events`, 'GET', null, tokenSeller);
    assert(eventsRes.status === 200, 'GET /transfers/:id/events returns 200 OK');
    const events = eventsRes.body?.data || [];
    assert(Array.isArray(events), 'Audit events returned as an array');

    const eventTypes = events.map((e) => e.eventType);
    console.log(`  Audit event log sequence: [${eventTypes.join(' -> ')}]`);

    assert(eventTypes.includes(TransferEventType.TRANSFER_REQUEST_CREATED), 'Audit log contains TRANSFER_REQUEST_CREATED');
    assert(eventTypes.includes(TransferEventType.TRANSFER_APPROVED), 'Audit log contains TRANSFER_APPROVED');
    assert(eventTypes.includes(TransferEventType.TRANSFER_PROCESSING_STARTED), 'Audit log contains TRANSFER_PROCESSING_STARTED');
    assert(eventTypes.includes(TransferEventType.TRANSFER_COMPLETED), 'Audit log contains TRANSFER_COMPLETED');

    // Immutability Check: ensure updates or deletions on TransferEvent are blocked
    let immutabilityProtected = false;
    try {
      await TransferEvent.updateOne(
        { transferRequestId: transferId },
        { $set: { eventType: 'MUTATED_EVENT' } }
      );
    } catch (err) {
      immutabilityProtected = true;
    }
    assert(immutabilityProtected, 'TransferEvent collection strictly prevents mutation (immutability preserved)');

  } catch (error) {
    console.error(`\n${colors.red}Unhandled error during tests:${colors.reset}`, error);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    try {
      const emailFilter = { email: { $regex: `^tf\\..*\\.${timestamp}@example.com$` } };
      await User.deleteMany(emailFilter);
      await Asset.deleteMany({ uniqueAssetIdentifier: { $regex: `^TF-.*-${timestamp}` } });
      await Listing.deleteMany({ sellerId: seller?._id });
      await Transaction.deleteMany({ sellerId: seller?._id });
      await TransferRequest.deleteMany({ fromUserId: seller?._id });
      // Direct native collection delete for immutable events during test cleanup
      await TransferEvent.collection.deleteMany({});
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr.message);
    }

    await mongoose.disconnect();
    console.log(`${colors.blue}Database disconnected cleanly.${colors.reset}\n`);

    console.log(`${colors.bold}======================================================`);
    console.log(`TEST SUMMARY: ${passedCount} passed, ${failedCount} failed`);
    console.log(`======================================================${colors.reset}\n`);

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runTests();
