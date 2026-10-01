import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { env } from '../src/config/env.config.js';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Reservation, ReservationStatus } from '../src/modules/listings/reservation.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { Report } from '../src/modules/reports/report.model.js';
import { Verification } from '../src/modules/verification/verification.model.js';
import { KYCRecord } from '../src/modules/kyc/kyc.model.js';
import { FraudAssessment } from '../src/modules/fraud/fraud-assessment.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import {
  AssetStatus,
  ListingStatus,
  VerificationStatus,
  TransactionStatus,
  PaymentStatus,
} from '../src/common/constants/asset-types.constant.js';
import { KYCStatus } from '../src/modules/kyc/kyc.constant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = `http://localhost:${env.PORT || 5000}${env.API_PREFIX || '/api/v1'}`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passedTests = 0;
let failedTests = 0;

function logTest(name, passed, message = '') {
  if (passed) {
    passedTests++;
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${name}${message ? ` (${message})` : ''}`);
  } else {
    failedTests++;
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${name}${message ? ` - ${message}` : ''}`);
  }
}

function assert(condition, testName, message = '') {
  logTest(testName, Boolean(condition), message);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

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

async function runTestSuite() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}${colors.bold}  ADMINISTRATIVE MODERATION SYSTEM & RBAC TEST SUITE${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_asset_exchange';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`${colors.blue}ℹ Connected to MongoDB Atlas for moderation test fixtures${colors.reset}\n`);

  const runId = Date.now();

  // Test Accounts
  let adminUser = null;
  let modUser = null;
  let regularUser = null;
  let sellerUser = null;

  // Test Entities
  let testAsset = null;
  let testListing = null;
  let testTransaction = null;
  let testReport = null;
  let testVerification = null;
  let testKYC = null;
  let testFraud = null;

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------------------
    console.log(`${colors.blue}Creating test user roles and domain fixtures...${colors.reset}`);

    adminUser = await User.create({
      name: 'Super Admin',
      email: `admin_${runId}@example.com`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });

    modUser = await User.create({
      name: 'Content Moderator',
      email: `moderator_${runId}@example.com`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'MODERATOR',
      accountStatus: 'ACTIVE',
    });

    regularUser = await User.create({
      name: 'Regular Customer',
      email: `user_${runId}@example.com`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });

    sellerUser = await User.create({
      name: 'Marketplace Seller',
      email: `seller_${runId}@example.com`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });

    const adminToken = generateToken(adminUser);
    const modToken = generateToken(modUser);
    const userToken = generateToken(regularUser);

    testAsset = await Asset.create({
      ownerId: sellerUser._id,
      title: `Admin Test Ticket #${runId}`,
      assetType: 'RAILWAY_TICKET',
      uniqueAssetIdentifier: `PNR_ADMIN_${runId}`,
      status: AssetStatus.LISTED,
      verificationStatus: VerificationStatus.MANUAL_REVIEW,
      currency: 'BDT',
      originalValue: 1200,
    });

    testListing = await Listing.create({
      sellerId: sellerUser._id,
      assetId: testAsset._id,
      askingPrice: 1500,
      price: 1500,
      originalFaceValue: 1200,
      status: ListingStatus.ACTIVE,
      currency: 'BDT',
    });

    testTransaction = await Transaction.create({
      listingId: testListing._id,
      assetId: testAsset._id,
      buyerId: regularUser._id,
      sellerId: sellerUser._id,
      amount: 1500,
      currency: 'BDT',
      transactionStatus: TransactionStatus.INITIATED,
      paymentStatus: PaymentStatus.PENDING,
      escrowStatus: 'NONE',
    });

    testReport = await Report.create({
      reporterId: regularUser._id,
      targetType: 'LISTING',
      targetId: testListing._id,
      category: 'SCAM',
      reason: 'Suspicious duplicate seat numbers',
      description: 'Listing seems fraudulent or duplicate',
      status: 'PENDING',
    });

    testVerification = await Verification.create({
      assetId: testAsset._id,
      requestedBy: sellerUser._id,
      status: VerificationStatus.MANUAL_REVIEW,
      confidenceScore: 65,
      notes: 'Requires manual inspector sign-off',
    });

    testKYC = await KYCRecord.create({
      userId: regularUser._id,
      status: KYCStatus.MANUAL_REVIEW,
      provider: 'mock',
      documentType: 'NATIONAL_ID',
      documentNumberMasked: '******1234',
    });

    testFraud = await FraudAssessment.create({
      targetType: 'ASSET',
      targetId: testAsset._id,
      userId: sellerUser._id,
      riskLevel: 'HIGH',
      overallScore: 82,
      confidence: 90,
      individualSignals: [
        {
          code: 'ABNORMAL_LISTING_FREQUENCY',
          name: 'Velocity Spike',
          triggered: true,
          severity: 'HIGH',
          score: 80,
          weight: 0.5,
          explanation: 'User created multiple tickets within 5 minutes',
        },
      ],
      summaryExplanation: 'High risk detected during automated screening',
      recommendedAction: 'MANUAL_REVIEW',
      status: 'PENDING_REVIEW',
    });

    console.log(`${colors.green}✔ Fixtures initialized successfully.${colors.reset}\n`);

    // =========================================================================
    // SECTION 1: Admin Dashboard APIs (All 8 Resource Queries)
    // =========================================================================
    console.log(`${colors.yellow}${colors.bold}1. Admin Dashboard APIs (Observability & Queries)${colors.reset}`);

    // Overview Metrics
    const metricsRes = await apiCall('/admin/metrics', 'GET', null, adminToken);
    assert(metricsRes.status === 200, 'GET /admin/metrics returns 200 OK');
    assert(typeof metricsRes.body?.data?.totalUsers === 'number', 'Metrics contain totalUsers count');

    // 1. Users
    const usersRes = await apiCall('/admin/users?limit=10', 'GET', null, adminToken);
    assert(usersRes.status === 200, 'GET /admin/users returns 200 OK');
    assert(Array.isArray(usersRes.body?.data?.items), 'Users returned as paginated items array');
    const userDetailRes = await apiCall(`/admin/users/${regularUser._id}`, 'GET', null, adminToken);
    assert(userDetailRes.status === 200, 'GET /admin/users/:id returns user details');
    assert(userDetailRes.body?.data?.activity !== undefined, 'User details include activity summary');

    // 2. KYC Reviews
    const kycRes = await apiCall('/admin/kyc?limit=10', 'GET', null, adminToken);
    assert(kycRes.status === 200, 'GET /admin/kyc returns 200 OK');
    assert(Array.isArray(kycRes.body?.data?.items), 'KYC reviews returned as paginated items');
    const kycDetailRes = await apiCall(`/admin/kyc/${testKYC._id}`, 'GET', null, adminToken);
    assert(kycDetailRes.status === 200, 'GET /admin/kyc/:id returns KYC record details');

    // 3. Assets
    const assetsRes = await apiCall('/admin/assets?limit=10', 'GET', null, adminToken);
    assert(assetsRes.status === 200, 'GET /admin/assets returns 200 OK');
    assert(Array.isArray(assetsRes.body?.data?.items), 'Assets returned as paginated items');
    const assetDetailRes = await apiCall(`/admin/assets/${testAsset._id}`, 'GET', null, adminToken);
    assert(assetDetailRes.status === 200, 'GET /admin/assets/:id returns asset details');

    // 4. Listings
    const listingsRes = await apiCall('/admin/listings?limit=10', 'GET', null, adminToken);
    assert(listingsRes.status === 200, 'GET /admin/listings returns 200 OK');
    assert(Array.isArray(listingsRes.body?.data?.items), 'Listings returned as paginated items');
    const listingDetailRes = await apiCall(`/admin/listings/${testListing._id}`, 'GET', null, adminToken);
    assert(listingDetailRes.status === 200, 'GET /admin/listings/:id returns listing details');

    // 5. Transactions
    const txRes = await apiCall('/admin/transactions?limit=10', 'GET', null, adminToken);
    assert(txRes.status === 200, 'GET /admin/transactions returns 200 OK');
    assert(Array.isArray(txRes.body?.data?.items), 'Transactions returned as paginated items');
    const txDetailRes = await apiCall(`/admin/transactions/${testTransaction._id}`, 'GET', null, adminToken);
    assert(txDetailRes.status === 200, 'GET /admin/transactions/:id returns transaction details');

    // 6. Reports
    const reportsRes = await apiCall('/admin/reports?limit=10', 'GET', null, adminToken);
    assert(reportsRes.status === 200, 'GET /admin/reports returns 200 OK');
    assert(Array.isArray(reportsRes.body?.data?.items), 'Reports returned as paginated items');
    const reportDetailRes = await apiCall(`/admin/reports/${testReport._id}`, 'GET', null, adminToken);
    assert(reportDetailRes.status === 200, 'GET /admin/reports/:id returns report details');

    // 7. Fraud Alerts
    const fraudRes = await apiCall('/admin/fraud-alerts?limit=10', 'GET', null, adminToken);
    assert(fraudRes.status === 200, 'GET /admin/fraud-alerts returns 200 OK');
    assert(Array.isArray(fraudRes.body?.data?.items), 'Fraud alerts returned as paginated items');
    const fraudDetailRes = await apiCall(`/admin/fraud-alerts/${testFraud._id}`, 'GET', null, adminToken);
    assert(fraudDetailRes.status === 200, 'GET /admin/fraud-alerts/:id returns fraud alert details');

    // 8. Audit Logs
    const auditRes = await apiCall('/admin/audit-logs?limit=10', 'GET', null, adminToken);
    assert(auditRes.status === 200, 'GET /admin/audit-logs returns 200 OK');
    assert(Array.isArray(auditRes.body?.data?.items), 'Audit logs returned as paginated items');

    // Verifications Review Queue
    const verifRes = await apiCall('/admin/verification-reviews?limit=10', 'GET', null, adminToken);
    assert(verifRes.status === 200, 'GET /admin/verification-reviews returns 200 OK');

    // =========================================================================
    // SECTION 2: Admin Actions & Immutable Audit Event Verification (All 7 Actions)
    // =========================================================================
    console.log(`\n${colors.yellow}${colors.bold}2. Administrative Actions & Immutable Audit Events${colors.reset}`);

    // Action 1: Suspend User (ADMIN)
    console.log(`  ${colors.cyan}Action 1: Suspend User...${colors.reset}`);
    const suspendReason = 'Multiple fraudulent ticket listing attempts detected';
    const suspendRes = await apiCall(
      `/admin/users/${sellerUser._id}/suspend`,
      'PATCH',
      { reason: suspendReason },
      adminToken
    );
    assert(suspendRes.status === 200, 'ADMIN suspend user returns 200 OK');
    const suspendedUserDoc = await User.findById(sellerUser._id);
    assert(suspendedUserDoc.accountStatus === 'SUSPENDED', 'Target user accountStatus transitioned to SUSPENDED');
    const suspendedUserListing = await Listing.findById(testListing._id);
    assert(suspendedUserListing.status === ListingStatus.SUSPENDED, 'User listings automatically suspended');

    // Verify immutable audit log created for suspension
    const suspendAudit = await AuditLog.findOne({
      eventName: 'admin.user.suspended',
      entityId: sellerUser._id.toString(),
    });
    assert(suspendAudit !== null, 'Immutable audit log created for user suspension');
    assert(suspendAudit?.actorRole === 'ADMIN', 'Audit log records actorRole as ADMIN');
    assert(suspendAudit?.data?.reason === suspendReason, 'Audit log records exact suspension reason');

    // Action 2: Unsuspend User (ADMIN)
    console.log(`  ${colors.cyan}Action 2: Unsuspend User...${colors.reset}`);
    const unsuspendReason = 'Identity clarified and verified via compliance call';
    const unsuspendRes = await apiCall(
      `/admin/users/${sellerUser._id}/unsuspend`,
      'PATCH',
      { reason: unsuspendReason },
      adminToken
    );
    assert(unsuspendRes.status === 200, 'ADMIN unsuspend user returns 200 OK');
    const unsuspendedUserDoc = await User.findById(sellerUser._id);
    assert(unsuspendedUserDoc.accountStatus === 'ACTIVE', 'Target user accountStatus restored to ACTIVE');

    // Verify immutable audit log created for unsuspension
    const unsuspendAudit = await AuditLog.findOne({
      eventName: 'admin.user.unsuspended',
      entityId: sellerUser._id.toString(),
    });
    assert(unsuspendAudit !== null, 'Immutable audit log created for user unsuspension');
    assert(unsuspendAudit?.data?.reason === unsuspendReason, 'Audit log records exact unsuspension reason');

    // Action 3: Suspend Listing (MODERATOR or ADMIN)
    console.log(`  ${colors.cyan}Action 3: Suspend Listing (by Moderator)...${colors.reset}`);
    // Reactivate listing first for test
    await Listing.findByIdAndUpdate(testListing._id, { status: ListingStatus.ACTIVE });
    const listingSuspendReason = 'Potential duplicate barcode detected by ticket checker';
    const suspendListingRes = await apiCall(
      `/admin/listings/${testListing._id}/suspend`,
      'PATCH',
      { reason: listingSuspendReason },
      modToken // Moderator authorized for listing suspension
    );
    assert(suspendListingRes.status === 200, 'MODERATOR suspend listing returns 200 OK');
    const reloadedListing = await Listing.findById(testListing._id);
    assert(reloadedListing.status === ListingStatus.SUSPENDED, 'Listing status transitioned to SUSPENDED');

    // Verify immutable audit log for listing suspension
    const listingAudit = await AuditLog.findOne({
      eventName: 'admin.listing.suspended',
      entityId: testListing._id.toString(),
    });
    assert(listingAudit !== null, 'Immutable audit log created for listing suspension');
    assert(listingAudit?.actorRole === 'MODERATOR', 'Audit log records actorRole as MODERATOR');
    assert(listingAudit?.data?.reason === listingSuspendReason, 'Audit log records listing suspension reason');

    // Action 4: Approve Manual Verification (MODERATOR or ADMIN)
    console.log(`  ${colors.cyan}Action 4: Approve Manual Verification (by Moderator)...${colors.reset}`);
    const approveNotes = 'Verified physical ticket with authentic watermark';
    const approveVerifRes = await apiCall(
      `/admin/verification/${testVerification._id}/approve`,
      'PATCH',
      { notes: approveNotes, confidenceScore: 98 },
      modToken
    );
    assert(approveVerifRes.status === 200, 'MODERATOR approve verification returns 200 OK');
    const approvedVerifDoc = await Verification.findById(testVerification._id);
    const approvedAssetDoc = await Asset.findById(testAsset._id);
    assert(approvedVerifDoc.status === VerificationStatus.VERIFIED, 'Verification status transitioned to VERIFIED');
    assert(approvedAssetDoc.status === AssetStatus.VERIFIED, 'Associated Asset status transitioned to VERIFIED');

    // Verify immutable audit log for approval
    const approveAudit = await AuditLog.findOne({
      eventName: 'admin.verification.approved',
      entityId: testVerification._id.toString(),
    });
    assert(approveAudit !== null, 'Immutable audit log created for verification approval');
    assert(approveAudit?.data?.confidenceScore === 98, 'Audit log records verification confidence score');

    // Action 5: Reject Verification (MODERATOR or ADMIN)
    console.log(`  ${colors.cyan}Action 5: Reject Verification (by Moderator)...${colors.reset}`);
    // Create new pending verification to test rejection
    const secondVerif = await Verification.create({
      assetId: testAsset._id,
      requestedBy: sellerUser._id,
      status: VerificationStatus.MANUAL_REVIEW,
      notes: 'Second check',
    });
    const rejectReason = 'Document failed font consistency inspection';
    const rejectVerifRes = await apiCall(
      `/admin/verification/${secondVerif._id}/reject`,
      'PATCH',
      { reason: rejectReason, notes: 'Non-matching font identified' },
      modToken
    );
    assert(rejectVerifRes.status === 200, 'MODERATOR reject verification returns 200 OK');
    const rejectedVerifDoc = await Verification.findById(secondVerif._id);
    const rejectedAssetDoc = await Asset.findById(testAsset._id);
    assert(rejectedVerifDoc.status === VerificationStatus.FAILED, 'Verification status transitioned to FAILED');
    assert(rejectedAssetDoc.status === AssetStatus.REJECTED, 'Asset status transitioned to REJECTED');

    // Verify immutable audit log for rejection
    const rejectAudit = await AuditLog.findOne({
      eventName: 'admin.verification.rejected',
      entityId: secondVerif._id.toString(),
    });
    assert(rejectAudit !== null, 'Immutable audit log created for verification rejection');
    assert(rejectAudit?.data?.reason === rejectReason, 'Audit log records rejection reason');

    // Action 6: Resolve Report (MODERATOR or ADMIN)
    console.log(`  ${colors.cyan}Action 6: Resolve Report (by Moderator)...${colors.reset}`);
    const reportNotes = 'Seller contacted, duplicate resolved, listing delisted';
    const resolveReportRes = await apiCall(
      `/admin/reports/${testReport._id}/resolve`,
      'PATCH',
      { status: 'RESOLVED', notes: reportNotes },
      modToken
    );
    assert(resolveReportRes.status === 200, 'MODERATOR resolve report returns 200 OK');
    const resolvedReportDoc = await Report.findById(testReport._id);
    assert(resolvedReportDoc.status === 'RESOLVED', 'Report status transitioned to RESOLVED');
    assert(resolvedReportDoc.resolutionNotes === reportNotes, 'Report resolution notes recorded');

    // Verify immutable audit log for report resolution
    const reportAudit = await AuditLog.findOne({
      eventName: 'admin.report.resolved',
      entityId: testReport._id.toString(),
    });
    assert(reportAudit !== null, 'Immutable audit log created for report resolution');
    assert(reportAudit?.data?.status === 'RESOLVED', 'Audit log records resolution status');

    // Action 7: Freeze Transaction (ADMIN ONLY)
    console.log(`  ${colors.cyan}Action 7: Freeze Transaction (by Admin)...${colors.reset}`);
    const freezeReason = 'Suspected stolen card chargeback dispute reported by issuing bank';
    const freezeRes = await apiCall(
      `/admin/transactions/${testTransaction._id}/freeze`,
      'PATCH',
      { reason: freezeReason },
      adminToken
    );
    assert(freezeRes.status === 200, 'ADMIN freeze transaction returns 200 OK');
    const frozenTxDoc = await Transaction.findById(testTransaction._id);
    assert(frozenTxDoc.transactionStatus === TransactionStatus.DISPUTED, 'Transaction status transitioned to DISPUTED');
    assert(frozenTxDoc.escrowStatus === 'HELD', 'Escrow funds secured and status set to HELD');
    assert(frozenTxDoc.disputeReason.includes(freezeReason), 'Dispute reason stored in transaction record');

    // Verify immutable audit log for transaction freeze
    const freezeAudit = await AuditLog.findOne({
      eventName: 'admin.transaction.frozen',
      entityId: testTransaction._id.toString(),
    });
    assert(freezeAudit !== null, 'Immutable audit log created for transaction freeze');
    assert(freezeAudit?.actorRole === 'ADMIN', 'Audit log records actorRole as ADMIN');
    assert(freezeAudit?.data?.reason === freezeReason, 'Audit log records freeze reason');

    // =========================================================================
    // SECTION 3: Role-Based Permissions & Privilege Escalation Tests
    // =========================================================================
    console.log(`\n${colors.yellow}${colors.bold}3. Role-Based Permissions & Privilege Escalation Tests${colors.reset}`);

    // Privilege Escalation Test 1: Unauthenticated request to /admin
    const noAuthRes = await apiCall('/admin/metrics', 'GET', null, null);
    assert(noAuthRes.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    // Privilege Escalation Test 2: Regular USER attempting to access Admin Dashboard
    const userMetricsRes = await apiCall('/admin/metrics', 'GET', null, userToken);
    assert(userMetricsRes.status === 403, 'USER accessing /admin/metrics blocked with 403 Forbidden');

    const userUsersRes = await apiCall('/admin/users', 'GET', null, userToken);
    assert(userUsersRes.status === 403, 'USER accessing /admin/users blocked with 403 Forbidden');

    const userAuditRes = await apiCall('/admin/audit-logs', 'GET', null, userToken);
    assert(userAuditRes.status === 403, 'USER accessing /admin/audit-logs blocked with 403 Forbidden');

    // Privilege Escalation Test 3: Regular USER attempting Moderation Actions
    const userSuspendListingRes = await apiCall(
      `/admin/listings/${testListing._id}/suspend`,
      'PATCH',
      { reason: 'User attempt' },
      userToken
    );
    assert(userSuspendListingRes.status === 403, 'USER attempting to suspend listing blocked with 403 Forbidden');

    const userSuspendUserRes = await apiCall(
      `/admin/users/${sellerUser._id}/suspend`,
      'PATCH',
      { reason: 'User attempt' },
      userToken
    );
    assert(userSuspendUserRes.status === 403, 'USER attempting to suspend user blocked with 403 Forbidden');

    const userFreezeTxRes = await apiCall(
      `/admin/transactions/${testTransaction._id}/freeze`,
      'PATCH',
      { reason: 'User attempt' },
      userToken
    );
    assert(userFreezeTxRes.status === 403, 'USER attempting to freeze transaction blocked with 403 Forbidden');

    // Privilege Escalation Test 4: MODERATOR attempting ADMIN-ONLY actions
    // Moderator must NOT be able to suspend user accounts
    const modSuspendUserRes = await apiCall(
      `/admin/users/${sellerUser._id}/suspend`,
      'PATCH',
      { reason: 'Moderator escalation attempt' },
      modToken
    );
    assert(modSuspendUserRes.status === 403, 'MODERATOR attempting to suspend user blocked with 403 Forbidden');

    // Moderator must NOT be able to unsuspend user accounts
    const modUnsuspendUserRes = await apiCall(
      `/admin/users/${sellerUser._id}/unsuspend`,
      'PATCH',
      { reason: 'Moderator escalation attempt' },
      modToken
    );
    assert(modUnsuspendUserRes.status === 403, 'MODERATOR attempting to unsuspend user blocked with 403 Forbidden');

    // Moderator must NOT be able to freeze financial transactions
    const modFreezeTxRes = await apiCall(
      `/admin/transactions/${testTransaction._id}/freeze`,
      'PATCH',
      { reason: 'Moderator escalation attempt' },
      modToken
    );
    assert(modFreezeTxRes.status === 403, 'MODERATOR attempting to freeze transaction blocked with 403 Forbidden');

    // Privilege Escalation Test 5: ADMIN self-suspension guard
    const adminSelfSuspendRes = await apiCall(
      `/admin/users/${adminUser._id}/suspend`,
      'PATCH',
      { reason: 'Admin self suspend' },
      adminToken
    );
    assert(adminSelfSuspendRes.status === 400, 'ADMIN self-suspension blocked with 400 Bad Request');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log(`\n${colors.blue}Cleaning up test fixtures...${colors.reset}`);
    await User.deleteMany({ _id: { $in: [adminUser._id, modUser._id, regularUser._id, sellerUser._id] } });
    await Asset.deleteMany({ _id: testAsset._id });
    await Listing.deleteMany({ _id: testListing._id });
    await Transaction.deleteMany({ _id: testTransaction._id });
    await Report.deleteMany({ _id: testReport._id });
    await Verification.deleteMany({ assetId: testAsset._id });
    await KYCRecord.deleteMany({ userId: regularUser._id });
    await FraudAssessment.deleteMany({ _id: testFraud._id });
    await AuditLog.deleteMany({
      entityId: {
        $in: [
          sellerUser._id.toString(),
          testListing._id.toString(),
          testVerification._id.toString(),
          secondVerif._id.toString(),
          testReport._id.toString(),
          testTransaction._id.toString(),
        ],
      },
    });
    console.log(`${colors.blue}✔ Test fixtures cleanly removed.${colors.reset}`);
  } catch (err) {
    console.error(`\n${colors.red}Fatal test suite error: ${err.message}${colors.reset}`);
    console.error(err);
    failedTests++;
  } finally {
    await mongoose.disconnect();
    console.log(`\n${colors.blue}Disconnected from MongoDB${colors.reset}`);

    console.log('\n' + '='.repeat(70));
    console.log(
      `  ${colors.bold}TEST RESULTS:${colors.reset} ${colors.green}${passedTests} passed${colors.reset}, ${
        failedTests > 0 ? `${colors.red}${failedTests} failed` : `${colors.green}0 failed`
      }`
    );
    console.log('='.repeat(70) + '\n');

    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTestSuite();
