import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { env } from '../src/config/env.config.js';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Report } from '../src/modules/reports/report.model.js';
import { KYCRecord } from '../src/modules/kyc/kyc.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import {
  AssetStatus,
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

function generateToken(user, options = {}) {
  const secret = options.secret !== undefined ? options.secret : env.JWT_SECRET;
  const algorithm = options.algorithm || 'HS256';

  const signOptions = {
    expiresIn: options.expiresIn || '1h',
  };
  if (algorithm !== 'none') {
    signOptions.algorithm = algorithm;
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    algorithm === 'none' ? '' : secret,
    signOptions
  );
}

async function apiCall(endpoint, method = 'GET', body = null, token = null, customHeaders = {}) {
  const headers = {
    'x-test-bypass-auth-limit': 'true',
    'x-test-bypass-global-limit': 'true',
    ...customHeaders,
  };
  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = undefined;
  if (body) {
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: response.status, body: json, headers: response.headers };
}

async function runSecurityTestSuite() {
  console.log(
    `\n${colors.bold}${colors.blue}======================================================================${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.blue}  DEFENSIVE BACKEND SECURITY HARDENING & ATTACK SIMULATION SUITE     ${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.blue}======================================================================${colors.reset}\n`
  );

  await mongoose.connect(env.MONGODB_URI);
  console.log(
    `${colors.cyan}ℹ Connected to MongoDB Atlas for security attack simulations${colors.reset}\n`
  );

  const timestamp = Date.now();
  const testUsers = {
    userA: null,
    userB: null,
    moderator: null,
    admin: null,
  };
  const testTokens = {};
  const testFixtures = {
    assetUserA: null,
    reportUserA: null,
    kycUserA: null,
    transactionUserA: null,
  };

  try {
    console.log(`Setting up isolated user fixtures...`);

    testUsers.userA = await User.create({
      name: 'Victim User A',
      email: `victim_a_${timestamp}@test.sec`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
      trustScore: 90,
    });
    testTokens.userA = generateToken(testUsers.userA);

    testUsers.userB = await User.create({
      name: 'Attacker User B',
      email: `attacker_b_${timestamp}@test.sec`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'USER',
      accountStatus: 'ACTIVE',
      trustScore: 85,
    });
    testTokens.userB = generateToken(testUsers.userB);

    testUsers.moderator = await User.create({
      name: 'Platform Moderator',
      email: `moderator_${timestamp}@test.sec`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'MODERATOR',
      accountStatus: 'ACTIVE',
    });
    testTokens.moderator = generateToken(testUsers.moderator);

    testUsers.admin = await User.create({
      name: 'Platform Admin',
      email: `admin_${timestamp}@test.sec`,
      passwordHash: 'dummy_hash_for_testing',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });
    testTokens.admin = generateToken(testUsers.admin);

    // Create private asset owned by User A
    testFixtures.assetUserA = await Asset.create({
      ownerId: testUsers.userA._id,
      assetType: 'EVENT_TICKET',
      title: 'Private VIP Ticket A',
      description: 'Private confidential ticket',
      uniqueAssetIdentifier: `SEC-TKT-A-${timestamp}`,
      status: AssetStatus.DRAFT, // Draft = private
      verificationStatus: 'NOT_REQUESTED',
      documentUrl: 'storage/uploads/tickets/sample_ticket.pdf',
    });

    // Create report submitted by User A
    testFixtures.reportUserA = await Report.create({
      reporterId: testUsers.userA._id,
      targetType: 'USER',
      targetId: testUsers.userB._id,
      category: 'HARASSMENT',
      reason: 'Confidential user complaint details',
      status: 'PENDING',
    });

    // Create KYC record for User A
    testFixtures.kycUserA = await KYCRecord.create({
      userId: testUsers.userA._id,
      status: KYCStatus.VERIFIED,
      provider: 'mock',
      verificationLevel: 'TIER_1_STANDARD',
      documentType: 'NATIONAL_ID',
      documentNumberHash: 'mock_hashed_id',
      documentNumberMasked: '****-****-1234',
      encryptedIdentityData: 'aes-encrypted-sensitive-pii',
      verifiedAt: new Date(),
    });

    // Create dummy listing & transaction involving User A
    const listingA = await Listing.create({
      assetId: testFixtures.assetUserA._id,
      sellerId: testUsers.userA._id,
      askingPrice: 500,
      currency: 'BDT',
      status: 'ACTIVE',
    });

    testFixtures.transactionUserA = await Transaction.create({
      listingId: listingA._id,
      assetId: testFixtures.assetUserA._id,
      sellerId: testUsers.userA._id,
      buyerId: testUsers.moderator._id,
      amount: 500,
      currency: 'BDT',
      transactionStatus: TransactionStatus.INITIATED,
      paymentStatus: PaymentStatus.PENDING,
    });

    console.log(`${colors.green}✔ Fixtures initialized successfully.${colors.reset}\n`);

    // =========================================================================
    // 1. ATTACK VECTOR: INVALID JWT
    // =========================================================================
    console.log(`${colors.bold}1. Attack Vector: Invalid JWT Validation${colors.reset}`);

    const res1a = await apiCall('/users/profile', 'GET', null, 'completely-bogus-token-string');
    assert(res1a.status === 401, 'Arbitrary string token rejected with 401 Unauthorized');

    const res1b = await apiCall(
      '/users/profile',
      'GET',
      null,
      'eyJhbGciOiJIUzI1NiJ9.invalid-payload.invalid-signature'
    );
    assert(res1b.status === 401, 'Malformed JWT structure rejected with 401 Unauthorized');

    const res1c = await apiCall('/auth/me', 'GET', null, '');
    assert(
      res1c.status === 401,
      'Missing token on protected endpoint rejected with 401 Unauthorized'
    );

    // =========================================================================
    // 2. ATTACK VECTOR: MODIFIED JWT (TAMPERING & ALGORITHM CONFUSION)
    // =========================================================================
    console.log(
      `\n${colors.bold}2. Attack Vector: Modified JWT & Algorithm Attacks${colors.reset}`
    );

    // Tampered payload with original signature
    const validUserToken = testTokens.userA;
    const [headerB64, payloadB64, signatureB64] = validUserToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decodedPayload.role = 'ADMIN'; // Attempting to forge admin role
    const forgedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const tamperedToken = `${headerB64}.${forgedPayloadB64}.${signatureB64}`;

    const res2a = await apiCall('/admin/metrics', 'GET', null, tamperedToken);
    assert(
      res2a.status === 401,
      'JWT with forged role & tampered payload rejected with 401 Unauthorized'
    );

    // Token signed with attacker's rogue secret
    const rogueToken = jwt.sign(
      { userId: testUsers.userA._id.toString(), role: 'ADMIN' },
      'attacker_compromised_secret_key_12345',
      { algorithm: 'HS256' }
    );
    const res2b = await apiCall('/admin/metrics', 'GET', null, rogueToken);
    assert(
      res2b.status === 401,
      'JWT signed with untrusted secret key rejected with 401 Unauthorized'
    );

    // Algorithm 'none' attack: unsigned token header
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url'
    );
    const nonePayload = Buffer.from(
      JSON.stringify({ userId: testUsers.admin._id.toString(), role: 'ADMIN' })
    ).toString('base64url');
    const noneToken = `${noneHeader}.${nonePayload}.`;
    const res2c = await apiCall('/admin/metrics', 'GET', null, noneToken);
    assert(res2c.status === 401, "JWT algorithm 'none' spoofing rejected with 401 Unauthorized");

    // =========================================================================
    // 3. ATTACK VECTOR: ANOTHER USER'S RESOURCE ID (IDOR DEFENSE)
    // =========================================================================
    console.log(
      `\n${colors.bold}3. Attack Vector: Another User's Resource ID (IDOR Attacks)${colors.reset}`
    );

    // User B tries to view User A's private/draft asset
    const res3a = await apiCall(
      `/assets/${testFixtures.assetUserA._id}`,
      'GET',
      null,
      testTokens.userB
    );
    assert(
      res3a.status === 403,
      "IDOR: User B viewing User A's private asset blocked with 403 Forbidden"
    );

    // User B tries to modify User A's asset
    const res3b = await apiCall(
      `/assets/${testFixtures.assetUserA._id}`,
      'PATCH',
      { title: 'Compromised Title' },
      testTokens.userB
    );
    assert(
      res3b.status === 403,
      "IDOR: User B modifying User A's asset blocked with 403 Forbidden"
    );

    // User B tries to delete User A's asset
    const res3c = await apiCall(
      `/assets/${testFixtures.assetUserA._id}`,
      'DELETE',
      null,
      testTokens.userB
    );
    assert(res3c.status === 403, "IDOR: User B deleting User A's asset blocked with 403 Forbidden");

    // User B tries to download User A's ticket document
    const res3d = await apiCall(
      `/assets/${testFixtures.assetUserA._id}/document`,
      'GET',
      null,
      testTokens.userB
    );
    assert(
      res3d.status === 403,
      "IDOR: User B accessing User A's ticket document blocked with 403 Forbidden"
    );

    // User B tries to view User A's report details
    const res3e = await apiCall(
      `/reports/${testFixtures.reportUserA._id}`,
      'GET',
      null,
      testTokens.userB
    );
    assert(
      res3e.status === 403,
      "IDOR: User B reading User A's private report blocked with 403 Forbidden"
    );

    // User B tries to view User A's KYC verification status
    const res3f = await apiCall(
      `/kyc/status/${testUsers.userA._id}`,
      'GET',
      null,
      testTokens.userB
    );
    assert(
      res3f.status === 403,
      "IDOR: User B querying User A's KYC status blocked with 403 Forbidden"
    );

    // User B tries to access User A's transaction
    const res3g = await apiCall(
      `/transactions/${testFixtures.transactionUserA._id}`,
      'GET',
      null,
      testTokens.userB
    );
    assert(
      res3g.status === 403,
      "IDOR: User B accessing User A's transaction blocked with 403 Forbidden"
    );

    // Owner (User A) CAN access their own report
    const res3h = await apiCall(
      `/reports/${testFixtures.reportUserA._id}`,
      'GET',
      null,
      testTokens.userA
    );
    assert(res3h.status === 200, 'Legitimate Access: Owner User A can retrieve own report');

    // =========================================================================
    // 4. ATTACK VECTOR: MALFORMED MONGODB INPUT (NOSQL INJECTION)
    // =========================================================================
    console.log(
      `\n${colors.bold}4. Attack Vector: Malformed MongoDB Input (NoSQL Injection)${colors.reset}`
    );

    // NoSQL operator injection in login: { "email": { "$gt": "" }, "password": "any" }
    const res4a = await apiCall('/auth/login', 'POST', {
      email: { $gt: '' },
      password: 'Password123!',
    });
    assert(
      res4a.status === 400 || res4a.status === 422,
      'NoSQL injection payload with $gt operator rejected',
      `Status: ${res4a.status}`
    );

    // Operator injection in query params: ?status[$ne]=CANCELLED
    const res4b = await apiCall('/assets?status[$ne]=CANCELLED', 'GET', null, testTokens.userA);
    assert(
      res4b.status === 200 || res4b.status === 400 || res4b.status === 422,
      'Query param $ne operator stripped/sanitized cleanly',
      `Status: ${res4b.status}`
    );

    // Code injection / $where simulation
    const res4c = await apiCall('/auth/login', 'POST', {
      email: 'victim@test.sec',
      $where: 'sleep(5000)',
      password: 'Password123!',
    });
    assert(
      res4c.status === 400 || res4c.status === 401,
      '$where operator injection stripped & rejected safely'
    );

    // =========================================================================
    // 5. ATTACK VECTOR: OVERSIZED REQUEST (DOS PAYLOAD BOMB)
    // =========================================================================
    console.log(
      `\n${colors.bold}5. Attack Vector: Oversized Request Payload (DoS Prevention)${colors.reset}`
    );

    // Generate payload larger than 200KB limit (approx 350KB)
    const largeBomb = 'A'.repeat(350 * 1024);
    const res5 = await apiCall('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'Password123!',
      bomb: largeBomb,
    });
    assert(
      res5.status === 413,
      'Oversized JSON payload (>200KB) rejected with 413 Payload Too Large'
    );

    // =========================================================================
    // 6. ATTACK VECTOR: MALICIOUS FILE UPLOAD HANDLING
    // =========================================================================
    console.log(`\n${colors.bold}6. Attack Vector: Malicious File Upload Attacks${colors.reset}`);

    // A. Prohibited executable script: shell.php
    const phpFormData = new FormData();
    const phpBlob = new Blob(['<?php echo "vulnerable"; ?>'], { type: 'application/x-php' });
    phpFormData.append('ticket', phpBlob, 'shell.php');

    const res6a = await fetch(`${BASE_URL}/assets/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testTokens.userA}`,
        'x-test-bypass-global-limit': 'true',
      },
      body: phpFormData,
    });
    const phpBody = await res6a.json().catch(() => null);
    assert(
      res6a.status === 400,
      'Prohibited executable file extension (.php) rejected with 400 Bad Request'
    );

    // B. Prohibited shell script: attack.sh
    const shFormData = new FormData();
    const shBlob = new Blob(['#!/bin/bash\nrm -rf /'], { type: 'application/x-sh' });
    shFormData.append('ticket', shBlob, 'attack.sh');

    const res6b = await fetch(`${BASE_URL}/assets/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testTokens.userA}`,
        'x-test-bypass-global-limit': 'true',
      },
      body: shFormData,
    });
    assert(res6b.status === 400, 'Prohibited shell script (.sh) rejected with 400 Bad Request');

    // C. Disguised file: fake.jpg with shellcode and invalid magic bytes
    const fakeJpgFormData = new FormData();
    // Valid JPEG starts with FF D8 FF; this disguised file starts with ASCII "MALICIOUS_SHELLCODE"
    const fakeJpgBlob = new Blob(['MALICIOUS_SHELLCODE_HERE_NOT_AN_IMAGE'], { type: 'image/jpeg' });
    fakeJpgFormData.append('ticket', fakeJpgBlob, 'fake.jpg');

    const res6c = await fetch(`${BASE_URL}/assets/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testTokens.userA}`,
        'x-test-bypass-global-limit': 'true',
      },
      body: fakeJpgFormData,
    });
    const fakeJpgBody = await res6c.json().catch(() => null);
    assert(
      res6c.status === 400,
      'MIME-spoofed file with corrupted/fake magic bytes rejected with 400 Bad Request'
    );

    // =========================================================================
    // 7. ATTACK VECTOR: UNAUTHORIZED ADMIN ENDPOINT & PRIVILEGE ESCALATION
    // =========================================================================
    console.log(
      `\n${colors.bold}7. Attack Vector: Unauthorized Admin Endpoints & Privilege Escalation${colors.reset}`
    );

    // Regular user attempting to access admin metrics
    const res7a = await apiCall('/admin/metrics', 'GET', null, testTokens.userA);
    assert(res7a.status === 403, 'Regular USER calling /admin/metrics blocked with 403 Forbidden');

    // Regular user attempting to list all users
    const res7b = await apiCall('/admin/users', 'GET', null, testTokens.userA);
    assert(res7b.status === 403, 'Regular USER calling /admin/users blocked with 403 Forbidden');

    // Regular user attempting to suspend user
    const res7c = await apiCall(
      `/admin/users/${testUsers.userB._id}/suspend`,
      'PATCH',
      { reason: 'malicious' },
      testTokens.userA
    );
    assert(
      res7c.status === 403,
      'Regular USER attempting user suspension blocked with 403 Forbidden'
    );

    // Moderator attempting admin-only user suspension
    const res7d = await apiCall(
      `/admin/users/${testUsers.userB._id}/suspend`,
      'PATCH',
      { reason: 'unauthorized mod' },
      testTokens.moderator
    );
    assert(
      res7d.status === 403,
      'MODERATOR attempting ADMIN-only suspension blocked with 403 Forbidden'
    );

    // Moderator attempting admin-only transaction freeze
    const res7e = await apiCall(
      `/admin/transactions/${testFixtures.transactionUserA._id}/freeze`,
      'PATCH',
      { reason: 'unauthorized mod' },
      testTokens.moderator
    );
    assert(
      res7e.status === 403,
      'MODERATOR attempting ADMIN-only transaction freeze blocked with 403 Forbidden'
    );

    // Privilege escalation on registration: attempting to register with role 'ADMIN'
    const res7f = await apiCall('/auth/register', 'POST', {
      name: 'Escalation Attempt User',
      email: `escalation_${timestamp}@test.sec`,
      password: 'StrongPassword123!',
      role: 'ADMIN', // Attacker attempts to assign themselves ADMIN
    });
    assert(res7f.status === 201, 'Registration succeeded');
    assert(
      res7f.body?.data?.user?.role === 'USER',
      "Privilege Escalation Blocked: Registered user role forced to 'USER' despite 'ADMIN' input payload"
    );

    // Clean up escalation user
    if (res7f.body?.data?.user?.id) {
      await User.findByIdAndDelete(res7f.body.data.user.id);
    }

    // =========================================================================
    // 8. SECURITY HTTP HEADERS & SENSITIVE DATA REDACTION
    // =========================================================================
    console.log(
      `\n${colors.bold}8. Security HTTP Headers, CORS & Sensitive Data Redaction${colors.reset}`
    );

    // Verify security headers
    const res8a = await apiCall('/health', 'GET');
    const xFrameOptions = res8a.headers.get('x-frame-options');
    const xContentTypeOptions = res8a.headers.get('x-content-type-options');
    const csp = res8a.headers.get('content-security-policy');

    assert(xFrameOptions === 'DENY', `X-Frame-Options is DENY (Actual: ${xFrameOptions})`);
    assert(
      xContentTypeOptions === 'nosniff',
      `X-Content-Type-Options is nosniff (Actual: ${xContentTypeOptions})`
    );
    assert(Boolean(csp), 'Content-Security-Policy header is present');

    // Verify CORS rejection on untrusted origin
    const res8b = await apiCall('/health', 'GET', null, null, {
      Origin: 'http://evil-attacker-site.com',
    });
    // In express cors, an origin rejection either throws an error (returning 500/CORS error) or omits Access-Control-Allow-Origin
    const acao = res8b.headers.get('access-control-allow-origin');
    assert(
      acao !== 'http://evil-attacker-site.com',
      'CORS restricts access: untrusted origin not allowed'
    );

    // Verify passwordHash is never returned in /auth/me or /users/profile
    const res8c = await apiCall('/auth/me', 'GET', null, testTokens.userA);
    assert(
      res8c.body?.data?.passwordHash === undefined,
      'Password hash redacted: never present in /auth/me profile response'
    );

    // =========================================================================
    // 9. PASSWORD COMPLEXITY ENFORCEMENT
    // =========================================================================
    console.log(`\n${colors.bold}9. Password Complexity Enforcement${colors.reset}`);

    // Weak password: no uppercase
    const res9a = await apiCall('/auth/register', 'POST', {
      name: 'Weak Pass User',
      email: `weak1_${timestamp}@test.sec`,
      password: 'password123!',
    });
    assert(
      res9a.status === 400 || res9a.status === 422,
      'Password without uppercase letter rejected with validation error'
    );

    // Weak password: no number
    const res9b = await apiCall('/auth/register', 'POST', {
      name: 'Weak Pass User',
      email: `weak2_${timestamp}@test.sec`,
      password: 'Password!',
    });
    assert(
      res9b.status === 400 || res9b.status === 422,
      'Password without numeric digit rejected with validation error'
    );

    // Weak password: no special character
    const res9c = await apiCall('/auth/register', 'POST', {
      name: 'Weak Pass User',
      email: `weak3_${timestamp}@test.sec`,
      password: 'Password123',
    });
    assert(
      res9c.status === 400 || res9c.status === 422,
      'Password without special character rejected with validation error'
    );

    // Weak password: too short (<8)
    const res9d = await apiCall('/auth/register', 'POST', {
      name: 'Weak Pass User',
      email: `weak4_${timestamp}@test.sec`,
      password: 'P1!',
    });
    assert(
      res9d.status === 400 || res9d.status === 422,
      'Password shorter than 8 characters rejected with validation error'
    );

    // =========================================================================
    // 10. ATTACK VECTOR: REPEATED LOGIN ATTEMPTS (BRUTE-FORCE RATE LIMITING)
    // =========================================================================
    console.log(
      `\n${colors.bold}10. Attack Vector: Repeated Login Attempts (Brute-Force Rate Limiting)${colors.reset}`
    );

    console.log(
      `  Executing rapid repeated login attempts to trigger rate limit (threshold: 20)...`
    );
    let hit429 = false;
    let attemptsCount = 0;
    const attackerIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

    for (let i = 1; i <= 25; i++) {
      const res = await apiCall(
        '/auth/login',
        'POST',
        {
          email: `nonexistent_${timestamp}@test.sec`,
          password: 'Password123!',
        },
        null,
        {
          'x-test-bypass-auth-limit': 'false',
          'x-test-bypass-global-limit': 'true',
          'X-Forwarded-For': attackerIp,
        }
      );
      attemptsCount++;
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }

    assert(
      hit429,
      `Repeated login brute-force triggered 429 Too Many Requests (Triggered on attempt #${attemptsCount})`
    );
  } catch (err) {
    console.error(`${colors.red}Critical test runner exception:${colors.reset}`, err);
    failedTests++;
  } finally {
    console.log(`\nCleaning up test fixtures...`);
    try {
      if (testUsers.userA) await User.findByIdAndDelete(testUsers.userA._id);
      if (testUsers.userB) await User.findByIdAndDelete(testUsers.userB._id);
      if (testUsers.moderator) await User.findByIdAndDelete(testUsers.moderator._id);
      if (testUsers.admin) await User.findByIdAndDelete(testUsers.admin._id);
      if (testFixtures.assetUserA) await Asset.findByIdAndDelete(testFixtures.assetUserA._id);
      if (testFixtures.reportUserA) await Report.findByIdAndDelete(testFixtures.reportUserA._id);
      if (testFixtures.kycUserA) await KYCRecord.findByIdAndDelete(testFixtures.kycUserA._id);
      if (testFixtures.transactionUserA)
        await Transaction.findByIdAndDelete(testFixtures.transactionUserA._id);
      console.log(`${colors.green}✔ Fixtures cleaned up.${colors.reset}`);
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    await mongoose.disconnect();
    console.log(`Disconnected from MongoDB\n`);

    console.log(
      `${colors.bold}${colors.blue}======================================================================${colors.reset}`
    );
    console.log(
      `  ${colors.bold}SECURITY TEST RESULTS:${colors.reset} ${colors.green}${passedTests} passed${colors.reset}, ${failedTests > 0 ? `${colors.red}${failedTests} failed${colors.reset}` : `0 failed`}`
    );
    console.log(
      `${colors.bold}${colors.blue}======================================================================${colors.reset}\n`
    );

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

runSecurityTestSuite();
