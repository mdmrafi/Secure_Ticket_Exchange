import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Verification } from '../src/modules/verification/verification.model.js';
import { TICKET_UPLOAD_DIR } from '../src/common/middlewares/upload.middleware.js';
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

// Helper: Create a real dummy file with valid PNG header so Layer 1 passes
function createDummyTicketFile(filename) {
  const filePath = path.join(TICKET_UPLOAD_DIR, filename);
  // PNG Magic bytes
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const content = Buffer.from('TICKET_DUMMY_BINARY_DATA', 'utf8');
  fs.writeFileSync(filePath, Buffer.concat([header, content]));
  return filePath;
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================`);
  console.log(`   MULTI-LAYER RAILWAY VERIFICATION ENGINE TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas for fixture assertions.${colors.reset}\n`);

  const timestamp = Date.now();
  let userA, userB, userAdmin;
  let tokenA, tokenB, tokenAdmin;
  const createdFiles = [];

  try {
    // -----------------------------------------------------------------
    // SETUP: Test Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user accounts...${colors.reset}`);
    userA = await User.create({
      name: 'Ticket Seller Alice',
      email: `engine.alice.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenA = generateToken(userA);

    userB = await User.create({
      name: 'Ticket Seller Bob',
      email: `engine.bob.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenB = generateToken(userB);

    userAdmin = await User.create({
      name: 'Auditor Admin',
      email: `engine.admin.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
    });
    tokenAdmin = generateToken(userAdmin);

    console.log(`${colors.green}Test users ready.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // TEST 1: Valid Mock Ticket (All 6 signals pass)
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Scenario 1: Valid Mock Ticket Verification${colors.reset}`);
    const validFile = createDummyTicketFile(`valid_ticket_${timestamp}.png`);
    createdFiles.push(validFile);

    const validAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Train 702: Dhaka -> Chittagong',
      uniqueAssetIdentifier: `RAIL-PNR-VALID-${timestamp}`,
      documentUrl: validFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 96.5,
      metadata: {
        pnr: `VALID-${timestamp}`,
        ticketNumber: `BR-${timestamp}`,
        passengerName: 'Mohammad Rafiqul Islam',
        trainName: 'Suborno Express',
        trainNumber: '702',
        source: 'Dhaka',
        destination: 'Chittagong',
        journeyDate: '2026-10-25',
        departureTime: '16:30',
        coach: 'KHA',
        seat: '15',
        fare: 1250,
      },
    });

    const validRes = await apiCall(`/verification/railway/${validAsset._id}`, 'POST', {}, tokenA);
    assert(validRes.status === 200, 'POST /verification/railway/:id returns 200 OK');
    assert(validRes.body?.data?.status === 'VERIFIED', 'Verification status is VERIFIED');
    assert(validRes.body?.data?.isVerified === true, 'isVerified flag is true');
    assert(validRes.body?.data?.overallConfidenceScore >= 80, `Confidence score is high (${validRes.body?.data?.overallConfidenceScore}%)`);

    // Verify all 6 check layers are reported
    const checks = validRes.body?.data?.checks || [];
    assert(checks.length >= 6, 'Verification result explains all check layers');
    assert(checks.find((c) => c.layer === 'DOCUMENT_VALIDATION')?.status === 'PASSED', 'DOCUMENT_VALIDATION passed');
    assert(checks.find((c) => c.layer === 'OCR_CONSISTENCY')?.status === 'PASSED', 'OCR_CONSISTENCY passed');
    assert(checks.find((c) => c.layer === 'TICKET_FORMAT')?.status === 'PASSED', 'TICKET_FORMAT passed');
    assert(checks.find((c) => c.layer === 'DUPLICATE_DETECTION')?.status === 'PASSED', 'DUPLICATE_DETECTION passed');
    assert(checks.find((c) => c.layer === 'RAILWAY_PROVIDER')?.status === 'PASSED', 'RAILWAY_PROVIDER passed');
    assert(checks.find((c) => c.layer === 'MANUAL_REVIEW_FALLBACK')?.status === 'NOT_NEEDED', 'MANUAL_REVIEW_FALLBACK is NOT_NEEDED');

    // Verify DB Asset state updated
    const updatedValidAsset = await Asset.findById(validAsset._id);
    assert(updatedValidAsset.verificationStatus === 'VERIFIED', 'Asset verificationStatus is VERIFIED');
    assert(updatedValidAsset.status === 'VERIFIED', 'Asset status transitioned to VERIFIED');

    // -----------------------------------------------------------------
    // TEST 2: Nonexistent Ticket in Railway Registry
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 2: Nonexistent Ticket in Railway Registry${colors.reset}`);
    const nonExistFile = createDummyTicketFile(`nonexist_ticket_${timestamp}.png`);
    createdFiles.push(nonExistFile);

    const nonExistAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Train 701: Dhaka -> Sylhet',
      uniqueAssetIdentifier: `RAIL-PNR-NOT_FOUND-${timestamp}`,
      documentUrl: nonExistFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 94.0,
      metadata: {
        pnr: `NOT_FOUND_${timestamp}_0000`,
        ticketNumber: `BR-NONEXIST-${timestamp}`,
        passengerName: 'Fake User',
        trainName: 'Parabat Express',
        trainNumber: '701',
        source: 'Dhaka',
        destination: 'Sylhet',
        journeyDate: '2026-10-25',
      },
    });

    const nonExistRes = await apiCall(`/verification/railway/${nonExistAsset._id}`, 'POST', {}, tokenA);
    assert(nonExistRes.status === 200, 'POST /verification/railway returns 200 with failure verdict');
    assert(nonExistRes.body?.data?.status === 'FAILED', 'Verification status is FAILED');
    assert(nonExistRes.body?.data?.isVerified === false, 'isVerified is false');
    assert(nonExistRes.body?.data?.providerResponse?.ticketExists === false, 'providerResponse reports ticketExists: false');
    assert(
      nonExistRes.body?.data?.checks?.find((c) => c.layer === 'RAILWAY_PROVIDER')?.status === 'FAILED',
      'RAILWAY_PROVIDER check marked as FAILED'
    );

    // -----------------------------------------------------------------
    // TEST 3: Passenger Identity Mismatch
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 3: Passenger Identity Mismatch Detection${colors.reset}`);
    const mismatchFile = createDummyTicketFile(`mismatch_ticket_${timestamp}.png`);
    createdFiles.push(mismatchFile);

    const mismatchAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Train 702: Dhaka -> Chittagong',
      uniqueAssetIdentifier: `RAIL-PNR-MISMATCH-${timestamp}`,
      documentUrl: mismatchFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 95.0,
      metadata: {
        pnr: `MISMATCH_PASS_${timestamp}`,
        ticketNumber: `BR-${timestamp}`,
        passengerName: 'MISMATCH_HACKER_NAME',
        trainName: 'Suborno Express',
        trainNumber: '702',
        source: 'Dhaka',
        destination: 'Chittagong',
        journeyDate: '2026-10-25',
      },
    });

    const mismatchRes = await apiCall(`/verification/railway/${mismatchAsset._id}`, 'POST', {}, tokenA);
    assert(mismatchRes.body?.data?.status === 'SUSPICIOUS', 'Status marked as SUSPICIOUS');
    assert(mismatchRes.body?.data?.providerResponse?.passengerMatch === false, 'providerResponse reports passengerMatch: false');
    assert(
      mismatchRes.body?.data?.fraudFlags?.some((f) => f.code === 'PASSENGER_NAME_MISMATCH'),
      'Fraud flag PASSENGER_NAME_MISMATCH recorded'
    );

    // -----------------------------------------------------------------
    // TEST 4: Duplicate Ticket Detection
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 4: Duplicate Ticket Detection (Anti Double-Spending)${colors.reset}`);
    const dupFile = createDummyTicketFile(`dup_ticket_${timestamp}.png`);
    createdFiles.push(dupFile);

    // Asset A holds the legitimate PNR
    const sharedPnr = `PNR_SHARED_${timestamp}`;
    const originalAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Original Registered Ticket',
      uniqueAssetIdentifier: `RAIL-PNR-${sharedPnr}`,
      documentUrl: dupFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 97.0,
      metadata: { pnr: sharedPnr },
      status: 'VERIFIED',
    });

    // Asset B (Bob) attempts to re-register the exact same PNR
    const duplicateAsset = await Asset.create({
      ownerId: userB._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Duplicate Attempt Ticket',
      uniqueAssetIdentifier: `RAIL-PNR-${sharedPnr}-DUPLICATE`,
      documentUrl: dupFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 97.0,
      metadata: { pnr: sharedPnr, source: 'Dhaka', destination: 'Chittagong' },
      status: 'DRAFT',
    });

    const dupRes = await apiCall(`/verification/railway/${duplicateAsset._id}`, 'POST', {}, tokenB);
    assert(dupRes.body?.data?.status === 'SUSPICIOUS', 'Duplicate ticket marked SUSPICIOUS');
    assert(
      dupRes.body?.data?.checks?.find((c) => c.layer === 'DUPLICATE_DETECTION')?.status === 'FAILED',
      'DUPLICATE_DETECTION layer failed'
    );
    assert(
      dupRes.body?.data?.fraudFlags?.some((f) => f.code === 'DUPLICATE_TICKET_DETECTED'),
      'Fraud flag DUPLICATE_TICKET_DETECTED recorded'
    );

    // -----------------------------------------------------------------
    // TEST 5: Malformed Ticket Format Handling
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 5: Malformed Ticket Format Validation${colors.reset}`);
    const malformedFile = createDummyTicketFile(`malformed_${timestamp}.png`);
    createdFiles.push(malformedFile);

    const malformedAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Malformed Route Ticket',
      uniqueAssetIdentifier: `RAIL-PNR-MALFORMED-${timestamp}`,
      documentUrl: malformedFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 90.0,
      metadata: {
        pnr: 'MALFORMED#123',
        source: 'Dhaka',
        destination: 'Dhaka', // Invalid: Origin and destination are identical!
        journeyDate: '2026-10-25',
      },
    });

    const malformedRes = await apiCall(`/verification/railway/${malformedAsset._id}`, 'POST', {}, tokenA);
    assert(malformedRes.body?.data?.status === 'FAILED', 'Malformed ticket marked FAILED');
    assert(
      malformedRes.body?.data?.checks?.find((c) => c.layer === 'TICKET_FORMAT')?.status === 'FAILED',
      'TICKET_FORMAT layer failed'
    );
    assert(
      malformedRes.body?.data?.primaryReason?.includes('format validation failed') ||
      malformedRes.body?.data?.primaryReason?.includes('Origin and destination'),
      'Primary reason highlights ticket format discrepancy'
    );

    // -----------------------------------------------------------------
    // TEST 6: Provider Failure (Graceful Fallback to Manual Review)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 6: Railway Provider Failure / Gateway Timeout${colors.reset}`);
    const provFailFile = createDummyTicketFile(`prov_fail_${timestamp}.png`);
    createdFiles.push(provFailFile);

    const provFailAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Gateway Timeout Ticket',
      uniqueAssetIdentifier: `RAIL-PNR-PROV_FAIL-${timestamp}`,
      documentUrl: provFailFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 95.0,
      metadata: {
        pnr: `PROV_FAIL_${timestamp}`,
        source: 'Dhaka',
        destination: 'Chittagong',
        journeyDate: '2026-10-25',
      },
    });

    const provFailRes = await apiCall(`/verification/railway/${provFailAsset._id}`, 'POST', {}, tokenA);
    assert(provFailRes.body?.data?.status === 'MANUAL_REVIEW', 'Provider timeout gracefully falls back to MANUAL_REVIEW');
    assert(
      provFailRes.body?.data?.checks?.find((c) => c.layer === 'MANUAL_REVIEW_FALLBACK')?.status === 'ACTIVE',
      'MANUAL_REVIEW_FALLBACK is active'
    );
    assert(
      provFailRes.body?.data?.providerResponse?.isProviderFailure === true,
      'providerResponse explicitly records isProviderFailure: true'
    );

    // -----------------------------------------------------------------
    // TEST 7: Manual Review Explicit Trigger
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 7: Manual Review Trigger & Audit Recording${colors.reset}`);
    const reviewFile = createDummyTicketFile(`review_${timestamp}.png`);
    createdFiles.push(reviewFile);

    const reviewAsset = await Asset.create({
      ownerId: userA._id,
      assetType: 'RAILWAY_TICKET',
      title: 'Audit Inspection Ticket',
      uniqueAssetIdentifier: `RAIL-PNR-REVIEW-${timestamp}`,
      documentUrl: reviewFile,
      extractionStatus: 'EXTRACTED',
      ocrConfidence: 94.0,
      metadata: {
        pnr: `REVIEW_${timestamp}_9999`,
        source: 'Dhaka',
        destination: 'Rajshahi',
        journeyDate: '2026-10-25',
      },
    });

    const reviewRes = await apiCall(`/verification/railway/${reviewAsset._id}`, 'POST', {}, tokenA);
    assert(reviewRes.body?.data?.status === 'MANUAL_REVIEW', 'Ticket routed to MANUAL_REVIEW');

    // Verify Verification record in database
    const dbVerification = await Verification.findOne({ assetId: reviewAsset._id });
    assert(Boolean(dbVerification), 'Verification record stored in MongoDB');
    assert(dbVerification.status === 'MANUAL_REVIEW', 'Verification record has status MANUAL_REVIEW');
    assert(dbVerification.checks?.length >= 5, 'Verification record contains layer breakdown in database');
  } finally {
    // Clean up test records and files
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test records and mock files...${colors.reset}`);
    for (const f of createdFiles) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {}
      }
    }
    const userIds = [userA?._id, userB?._id, userAdmin?._id].filter(Boolean);
    if (userIds.length > 0) {
      await Verification.deleteMany({ requestedBy: { $in: userIds } });
      await Asset.deleteMany({ ownerId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
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
