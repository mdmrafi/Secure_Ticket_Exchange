import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { KYCRecord } from '../src/modules/kyc/kyc.model.js';
import { KYCAuditLog } from '../src/modules/kyc/kyc-audit.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { env } from '../src/config/env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = `http://localhost:${env.PORT || 5000}${env.API_PREFIX || '/api/v1'}`;

// Helper: Generate JWT access token for testing
function generateTestToken(user) {
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

// Colors for output
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
  console.log(`     PRODUCTION IDENTITY VERIFICATION (KYC) TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  // Connect to MongoDB for fixture setup & verification assertions
  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB for fixture assertions.${colors.reset}\n`);

  const timestamp = Date.now();
  const testEmailA = `test.kyc.user.a.${timestamp}@example.com`;
  const testEmailB = `test.kyc.user.b.${timestamp}@example.com`;
  const testEmailReject = `test.kyc.user.reject.${timestamp}@example.com`;
  const testEmailAdmin = `test.kyc.admin.${timestamp}@example.com`;

  let userA, userB, userReject, userAdmin;
  let tokenA, tokenB, tokenReject, tokenAdmin;

  try {
    // -----------------------------------------------------------------
    // SETUP: Create test users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating isolated synthetic test users...${colors.reset}`);

    userA = await User.create({
      name: 'Alice Synthetic User',
      email: testEmailA,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });
    tokenA = generateTestToken(userA);

    userB = await User.create({
      name: 'Bob Synthetic User',
      email: testEmailB,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });
    tokenB = generateTestToken(userB);

    userReject = await User.create({
      name: 'Charlie Synthetic Reject',
      email: testEmailReject,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });
    tokenReject = generateTestToken(userReject);

    userAdmin = await User.create({
      name: 'Admin Inspector',
      email: testEmailAdmin,
      passwordHash: 'dummy_hash_for_testing',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });
    tokenAdmin = generateTestToken(userAdmin);

    console.log(`${colors.green}Test fixtures initialized successfully.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // TEST 1: Initial KYC status before starting
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Scenario 1: Initial KYC Status (Not Started)${colors.reset}`);
    const initRes = await apiCall('/kyc/status', 'GET', null, tokenA);
    assert(initRes.status === 200, 'GET /kyc/status returns 200 OK');
    assert(initRes.body?.data?.status === 'NOT_STARTED', 'Initial status is NOT_STARTED');
    assert(initRes.body?.data?.isVerified === false, 'isVerified is false initially');

    // -----------------------------------------------------------------
    // TEST 2: Starting KYC (POST /api/v1/kyc/start)
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 2: Starting KYC Session (POST /kyc/start)${colors.reset}`
    );
    const startRes = await apiCall('/kyc/start', 'POST', { documentType: 'NATIONAL_ID' }, tokenA);

    assert(startRes.status === 201, 'POST /kyc/start returns 201 Created');
    assert(startRes.body?.success === true, 'Response payload marked success: true');
    assert(startRes.body?.data?.status === 'PENDING', 'KYC status transitioned to PENDING');
    assert(startRes.body?.data?.provider === 'mock', 'Provider is registered mock KYC provider');
    assert(
      Boolean(startRes.body?.data?.providerReferenceId),
      'Provider reference inquiry ID generated'
    );
    assert(Boolean(startRes.body?.data?.startedAt), 'startedAt timestamp correctly populated');
    assert(Boolean(startRes.body?.data?.providerSession), 'Provider session instructions provided');

    // Verify KYC Audit Log created for session start
    const auditStart = await KYCAuditLog.findOne({
      userId: userA._id,
      action: 'SESSION_STARTED',
    });
    assert(Boolean(auditStart), 'KYCAuditLog recorded SESSION_STARTED transition');
    assert(auditStart?.fromStatus === 'NOT_STARTED', 'Audit fromStatus is NOT_STARTED');
    assert(auditStart?.toStatus === 'PENDING', 'Audit toStatus is PENDING');

    // -----------------------------------------------------------------
    // TEST 3: Submitting Mock KYC & Successful Verification
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 3: Submitting Mock KYC & Successful Verification (POST /kyc/submit)${colors.reset}`
    );
    const submitPayload = {
      documentType: 'NATIONAL_ID',
      syntheticData: {
        firstName: 'Alice',
        lastName: 'Synthetic',
        dateOfBirth: '1995-04-12',
        documentNumber: 'SYN-NID-9876543210',
        countryCode: 'BD',
        testOutcome: 'VERIFIED',
      },
    };

    const submitRes = await apiCall('/kyc/submit', 'POST', submitPayload, tokenA);
    assert(submitRes.status === 200, 'POST /kyc/submit returns 200 OK');
    assert(submitRes.body?.data?.status === 'VERIFIED', 'Verification status is VERIFIED');
    assert(submitRes.body?.data?.isVerified === true, 'isVerified flag is true');
    assert(Boolean(submitRes.body?.data?.verifiedAt), 'verifiedAt timestamp populated');
    assert(Boolean(submitRes.body?.data?.submittedAt), 'submittedAt timestamp populated');
    assert(Boolean(submitRes.body?.data?.expiresAt), 'expiresAt validity date calculated');
    assert(
      submitRes.body?.data?.documentNumberMasked === '******3210',
      'documentNumber is safely masked'
    );

    // Verify sensitive PII is NEVER exposed in the API response
    assert(
      submitRes.body?.data?.encryptedIdentityData === undefined,
      'encryptedIdentityData is strictly excluded from API response'
    );
    assert(
      submitRes.body?.data?.documentHash === undefined,
      'documentHash is strictly excluded from API response'
    );
    assert(
      submitRes.body?.data?.syntheticData === undefined,
      'raw syntheticData is not leaked in response'
    );

    // Verify User model was updated with summary status
    const dbUserA = await User.findById(userA._id);
    assert(dbUserA.kycStatus === 'VERIFIED', 'User document kycStatus updated to VERIFIED');
    assert(Boolean(dbUserA.kycVerifiedAt), 'User document kycVerifiedAt recorded');

    // Verify KYCRecord in database has AES-256-GCM encrypted payload
    const rawKycRecordA = await KYCRecord.findOne({ userId: userA._id }).select(
      '+encryptedIdentityData +documentHash'
    );
    assert(Boolean(rawKycRecordA.encryptedIdentityData), 'PII is encrypted at rest in KYCRecord');
    assert(
      rawKycRecordA.encryptedIdentityData.includes(':'),
      'Encrypted payload matches IV:AuthTag:Ciphertext structure'
    );

    // Verify Audit Log for verification
    const auditVerified = await KYCAuditLog.findOne({
      userId: userA._id,
      toStatus: 'VERIFIED',
    });
    assert(Boolean(auditVerified), 'KYCAuditLog recorded VERIFIED transition');
    assert(auditVerified?.fromStatus === 'PENDING', 'Audit fromStatus was PENDING');

    // Verify GET /kyc/status now reports VERIFIED
    const statusResA = await apiCall('/kyc/status', 'GET', null, tokenA);
    assert(statusResA.body?.data?.status === 'VERIFIED', 'GET /kyc/status returns VERIFIED');
    assert(statusResA.body?.data?.isVerified === true, 'GET /kyc/status reports isVerified: true');

    // -----------------------------------------------------------------
    // TEST 4: Submitting Mock KYC with Rejection
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 4: Submitting Mock KYC with Rejection Outcome${colors.reset}`
    );
    // Start KYC for User Charlie
    await apiCall('/kyc/start', 'POST', { documentType: 'PASSPORT' }, tokenReject);

    // Submit with synthetic rejection indicator (ending in 0000 or testOutcome: REJECT)
    const rejectPayload = {
      documentType: 'PASSPORT',
      syntheticData: {
        firstName: 'Charlie',
        lastName: 'RejectTest',
        dateOfBirth: '1990-01-01',
        documentNumber: 'SYN-PASS-REJECT-0000',
        countryCode: 'BD',
        testOutcome: 'REJECT',
        rejectionReason: 'Synthetic fraud pattern: flagged test passport',
      },
    };

    const rejectRes = await apiCall('/kyc/submit', 'POST', rejectPayload, tokenReject);
    assert(rejectRes.status === 200, 'POST /kyc/submit returns 200 OK');
    assert(rejectRes.body?.data?.status === 'REJECTED', 'Status is REJECTED');
    assert(rejectRes.body?.data?.isVerified === false, 'isVerified is false');
    assert(Boolean(rejectRes.body?.data?.rejectedAt), 'rejectedAt timestamp is set');
    assert(
      Boolean(rejectRes.body?.data?.rejectionReason),
      'Sanitized rejectionReason is returned to caller'
    );

    // Verify User document kycStatus updated to REJECTED
    const dbUserReject = await User.findById(userReject._id);
    assert(dbUserReject.kycStatus === 'REJECTED', 'User document kycStatus set to REJECTED');

    // Verify Audit Log for rejection
    const auditReject = await KYCAuditLog.findOne({
      userId: userReject._id,
      toStatus: 'REJECTED',
    });
    assert(Boolean(auditReject), 'KYCAuditLog recorded REJECTED transition');
    assert(auditReject?.reason?.length > 0, 'Audit record contains rejection reason');

    // -----------------------------------------------------------------
    // TEST 5: Unauthorized Access (Missing/Invalid Token)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 5: Unauthorized Access Protection${colors.reset}`);
    const noTokenStatus = await apiCall('/kyc/status', 'GET', null, null);
    assert(
      noTokenStatus.status === 401,
      'GET /kyc/status without token rejected with 401 Unauthorized'
    );

    const badTokenStart = await apiCall('/kyc/start', 'POST', {}, 'invalid.bearer.token');
    assert(
      badTokenStart.status === 401,
      'POST /kyc/start with bogus token rejected with 401 Unauthorized'
    );

    const noTokenSubmit = await apiCall('/kyc/submit', 'POST', submitPayload, null);
    assert(
      noTokenSubmit.status === 401,
      'POST /kyc/submit without token rejected with 401 Unauthorized'
    );

    // -----------------------------------------------------------------
    // TEST 6: Access to Another User's KYC (Authorization Boundary)
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 6: Access to Another User's KYC Record (RBAC & Isolation)${colors.reset}`
    );
    // User B tries to view User A's KYC status by user ID
    const crossAccessRes = await apiCall(`/kyc/status/${userA._id}`, 'GET', null, tokenB);
    assert(
      crossAccessRes.status === 403,
      'User B accessing User A KYC status rejected with 403 Forbidden'
    );
    assert(
      crossAccessRes.body?.message?.includes('Forbidden'),
      'Forbidden error message clearly explains unauthorized boundary'
    );

    // User A can access their own record
    const selfAccessRes = await apiCall(`/kyc/status/${userA._id}`, 'GET', null, tokenA);
    assert(selfAccessRes.status === 200, 'User A accessing own record by user ID returns 200 OK');

    // Admin CAN access User A's KYC status for verification/review operations
    const adminAccessRes = await apiCall(`/kyc/status/${userA._id}`, 'GET', null, tokenAdmin);
    assert(adminAccessRes.status === 200, 'ADMIN accessing User A KYC status authorized (200 OK)');
    assert(
      adminAccessRes.body?.data?.status === 'VERIFIED',
      'Admin receives verified KYC overview'
    );

    // -----------------------------------------------------------------
    // TEST 7: High-Trust Listing Guard Integration
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 7: High-Trust Asset Listing Creation Guard${colors.reset}`
    );
    // Create test assets: Asset owned by User A (verified) and Asset owned by User B (unverified)
    const assetA = await Asset.create({
      ownerId: userA._id,
      assetType: 'EVENT_TICKET',
      title: 'VIP Gala Pass (High Value)',
      description: 'Exclusive gala invitation',
      uniqueAssetIdentifier: `EVENT-TICKET-${timestamp}-A`,
      status: 'VERIFIED',
      originalValue: 10000,
      currency: 'BDT',
    });

    const assetB = await Asset.create({
      ownerId: userB._id,
      assetType: 'EVENT_TICKET',
      title: 'Unverified Seller Pass',
      description: 'Gala invitation from unverified user',
      uniqueAssetIdentifier: `EVENT-TICKET-${timestamp}-B`,
      status: 'VERIFIED',
      originalValue: 10000,
      currency: 'BDT',
    });

    // Unverified User B attempts to create high-trust listing
    const unverifiedListingRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: assetB._id.toString(),
        price: 8000,
        isHighTrust: true,
      },
      tokenB
    );

    assert(
      unverifiedListingRes.status === 403,
      'Unverified User B blocked from creating high-trust listing (403 Forbidden)'
    );
    assert(
      unverifiedListingRes.body?.message?.includes('Identity verification required'),
      'Listing creation requires KYC verification message'
    );

    // Verified User A creates high-trust listing
    const verifiedListingRes = await apiCall(
      '/listings',
      'POST',
      {
        assetId: assetA._id.toString(),
        price: 8000,
        isHighTrust: true,
      },
      tokenA
    );

    assert(
      verifiedListingRes.status === 201,
      'Verified User A successfully creates high-trust listing (201 Created)'
    );

    // Clean up test assets
    await Asset.deleteMany({ _id: { $in: [assetA._id, assetB._id] } });
  } finally {
    // Clean up test records
    console.log(
      `\n${colors.yellow}[CLEANUP] Cleaning up test users, KYC records, and audit logs...${colors.reset}`
    );
    const testUserIds = [userA?._id, userB?._id, userReject?._id, userAdmin?._id].filter(Boolean);
    if (testUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: testUserIds } });
      await KYCRecord.deleteMany({ userId: { $in: testUserIds } });
      await KYCAuditLog.deleteMany({ userId: { $in: testUserIds } });
    }
    await mongoose.disconnect();
    console.log(`${colors.blue}Database disconnected cleanly.${colors.reset}\n`);
  }

  console.log(`${colors.bold}======================================================`);
  console.log(`TEST SUMMARY: ${passedCount} passed, ${failedCount} failed`);
  console.log(`======================================================${colors.reset}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\nUnhandled test runner error:', err);
  process.exit(1);
});
