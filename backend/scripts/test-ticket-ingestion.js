import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
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

// Helper: Multipart file upload caller using native Node 24 FormData & Blob
async function uploadFile(
  endpoint,
  fileBuffer,
  filename,
  mimeType,
  token = null,
  extraFields = {}
) {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('ticket', blob, filename);

  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

// Helper: Standard API caller
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
  return { status: response.status, body: json, rawResponse: response };
}

// Colors for terminal formatting
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

// Helper to create valid PNG buffer
function createValidPNGBuffer(customText = '') {
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  const header = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const textPayload = Buffer.from(customText || 'SYNTHETIC_RAILWAY_TICKET_PNG_IMAGE_DATA', 'utf8');
  return Buffer.concat([header, textPayload]);
}

// Helper to create valid PDF buffer
function createValidPDFBuffer(customText = '') {
  // PDF Magic Header: %PDF-1.4
  const header = Buffer.from('%PDF-1.4\n%âãÏÓ\n', 'utf8');
  const textPayload = Buffer.from(
    customText || 'SYNTHETIC_RAILWAY_TICKET_PDF_DOCUMENT_DATA',
    'utf8'
  );
  return Buffer.concat([header, textPayload]);
}

async function runTests() {
  console.log(
    `\n${colors.bold}${colors.cyan}======================================================`
  );
  console.log(`   RAILWAY TICKET DOCUMENT INGESTION & OCR TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas for fixture assertions.${colors.reset}\n`);

  const timestamp = Date.now();
  let userA, userB;
  let tokenA, tokenB;
  let ingestedAssetA, ingestedFailedAsset;

  try {
    // -----------------------------------------------------------------
    // SETUP: Test Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating isolated test users...${colors.reset}`);
    userA = await User.create({
      name: 'Ingestion Passenger Alice',
      email: `ingest.alice.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenA = generateToken(userA);

    userB = await User.create({
      name: 'Competitor Bob',
      email: `ingest.bob.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenB = generateToken(userB);

    console.log(`${colors.green}Test user fixtures ready.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // TEST 1: Valid Upload (Valid Image / PDF Ingestion)
    // -----------------------------------------------------------------
    console.log(
      `${colors.bold}Scenario 1: Valid Railway Ticket Upload & Ingestion (POST /assets/railway/ingest)${colors.reset}`
    );
    const validPngBuffer = createValidPNGBuffer('STANDARD_TICKET_TEST');
    const uploadRes = await uploadFile(
      '/assets/railway/ingest',
      validPngBuffer,
      'bangladesh_railway_eticket.png',
      'image/png',
      tokenA
    );

    assert(uploadRes.status === 201, 'POST /assets/railway/ingest returns 201 Created');
    assert(uploadRes.body?.success === true, 'Response payload marked success: true');
    assert(uploadRes.body?.data?.assetType === 'RAILWAY_TICKET', 'Asset type is RAILWAY_TICKET');
    assert(uploadRes.body?.data?.status === 'DRAFT', 'Asset status is DRAFT');
    assert(
      uploadRes.body?.data?.verificationStatus === 'NOT_REQUESTED',
      'verificationStatus is NOT_REQUESTED (OCR does not claim authenticity)'
    );
    assert(Boolean(uploadRes.body?.data?.documentUrl), 'documentUrl is recorded on asset');
    assert(
      !uploadRes.body?.data?.documentUrl.includes('public'),
      'documentUrl is stored in private storage (not in public web root)'
    );

    ingestedAssetA = uploadRes.body?.data;

    // -----------------------------------------------------------------
    // TEST 2: OCR Success & Field Extraction
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 2: OCR Extraction Success & Field Verification${colors.reset}`
    );
    assert(ingestedAssetA.extractionStatus === 'EXTRACTED', 'extractionStatus is EXTRACTED');
    assert(
      ingestedAssetA.ocrConfidence >= 75,
      `ocrConfidence is high (observed: ${ingestedAssetA.ocrConfidence}%)`
    );

    const meta = ingestedAssetA.metadata || {};
    assert(Boolean(meta.ticketNumber), `ticketNumber extracted: ${meta.ticketNumber}`);
    assert(Boolean(meta.pnr), `pnr extracted: ${meta.pnr}`);
    assert(Boolean(meta.passengerName), `passengerName extracted: ${meta.passengerName}`);
    assert(Boolean(meta.trainName), `trainName extracted: ${meta.trainName}`);
    assert(Boolean(meta.source), `source station extracted: ${meta.source}`);
    assert(Boolean(meta.destination), `destination station extracted: ${meta.destination}`);
    assert(Boolean(meta.journeyDate), `journeyDate extracted: ${meta.journeyDate}`);
    assert(Boolean(meta.departureTime), `departureTime extracted: ${meta.departureTime}`);
    assert(Boolean(meta.coach), `coach extracted: ${meta.coach}`);
    assert(Boolean(meta.seat), `seat extracted: ${meta.seat}`);
    assert(Boolean(meta.class), `class extracted: ${meta.class}`);
    assert(meta.fare > 0, `fare extracted: BDT ${meta.fare}`);

    // Verify database persistence
    const dbAssetA = await Asset.findById(ingestedAssetA._id);
    assert(
      dbAssetA.extractionStatus === 'EXTRACTED',
      'Database record has extractionStatus EXTRACTED'
    );
    assert(dbAssetA.originalValue === meta.fare, 'Asset originalValue synced with extracted fare');

    // -----------------------------------------------------------------
    // TEST 3: Invalid File Type & Prohibited Executables
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 3: Invalid File Type & Executable Prevention${colors.reset}`
    );
    // 3a. Prohibited executable extension (.exe)
    const exeBuffer = Buffer.from('MZ_DUMMY_EXECUTABLE_BINARY', 'utf8');
    const exeRes = await uploadFile(
      '/assets/railway/ingest',
      exeBuffer,
      'trojan_payload.exe',
      'application/x-msdownload',
      tokenA
    );
    assert(exeRes.status === 400, 'Executable (.exe) rejected with 400 Bad Request');
    assert(
      exeRes.body?.message?.includes('prohibited') ||
        exeRes.body?.message?.includes('Invalid file type'),
      'Security error message explains prohibited executable files'
    );

    // 3b. Script file (.sh)
    const scriptBuffer = Buffer.from('#!/bin/bash\nrm -rf /', 'utf8');
    const scriptRes = await uploadFile(
      '/assets/railway/ingest',
      scriptBuffer,
      'attack_script.sh',
      'text/x-sh',
      tokenA
    );
    assert(scriptRes.status === 400, 'Shell script (.sh) rejected with 400 Bad Request');

    // 3c. Spoofed file: .png extension but invalid header bytes
    const spoofedBuffer = Buffer.from('NOT_A_PNG_FILE_PLAIN_TEXT', 'utf8');
    const spoofedRes = await uploadFile(
      '/assets/railway/ingest',
      spoofedBuffer,
      'spoofed_image.png',
      'image/png',
      tokenA
    );
    assert(
      spoofedRes.status === 400,
      'Spoofed file with invalid magic bytes rejected with 400 Bad Request'
    );
    assert(
      spoofedRes.body?.message?.includes('header signature') ||
        spoofedRes.body?.message?.includes('Corrupted'),
      'Magic byte validation caught disguised file'
    );

    // -----------------------------------------------------------------
    // TEST 4: Oversized File Rejection
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 4: Oversized File Upload Rejection${colors.reset}`);
    // 5.5 Megabytes exceeds the 5MB maximum limit
    const oversizedSize = 5.5 * 1024 * 1024;
    const oversizedBuffer = Buffer.alloc(oversizedSize);
    // Write valid PNG header at start
    oversizedBuffer[0] = 0x89;
    oversizedBuffer[1] = 0x50;
    oversizedBuffer[2] = 0x4e;
    oversizedBuffer[3] = 0x47;
    oversizedBuffer[4] = 0x0d;
    oversizedBuffer[5] = 0x0a;
    oversizedBuffer[6] = 0x1a;
    oversizedBuffer[7] = 0x0a;

    const oversizedRes = await uploadFile(
      '/assets/railway/ingest',
      oversizedBuffer,
      'massive_oversized_ticket.png',
      'image/png',
      tokenA
    );
    assert(oversizedRes.status === 400, 'Oversized file (>5MB) rejected with 400 Bad Request');
    assert(
      oversizedRes.body?.message?.includes('too large') ||
        oversizedRes.body?.message?.includes('Maximum allowed size'),
      'Error message highlights file size constraint'
    );

    // -----------------------------------------------------------------
    // TEST 5: OCR Failure Handling (Unreadable / Corrupt Document)
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 5: OCR Failure & Unreadable Document Handling${colors.reset}`
    );
    const corruptPdfBuffer = createValidPDFBuffer('SIMULATE_OCR_FAILURE: Corrupt blur artifact');
    const failRes = await uploadFile(
      '/assets/railway/ingest',
      corruptPdfBuffer,
      'OCR_FAIL_corrupt_scan.pdf',
      'application/pdf',
      tokenA
    );

    assert(failRes.status === 201, 'Corrupted document ingested and asset created (201 Created)');
    assert(failRes.body?.data?.extractionStatus === 'FAILED', 'extractionStatus marked as FAILED');
    assert(failRes.body?.data?.ocrConfidence < 30, 'ocrConfidence is low (< 30%)');
    assert(Boolean(failRes.body?.data?.metadata?.ocrNotes), 'ocrNotes explains extraction failure');

    ingestedFailedAsset = failRes.body?.data;

    // -----------------------------------------------------------------
    // TEST 6: Unauthorized Access & Cross-User Document Protection
    // -----------------------------------------------------------------
    console.log(
      `\n${colors.bold}Scenario 6: Unauthorized Access & Document Boundary Protection${colors.reset}`
    );
    // 6a. Upload without token
    const unauthUpload = await uploadFile(
      '/assets/railway/ingest',
      validPngBuffer,
      'unauth_ticket.png',
      'image/png',
      null
    );
    assert(unauthUpload.status === 401, 'Upload without token rejected with 401 Unauthorized');

    // 6b. Download document without token
    const unauthDoc = await apiCall(`/assets/${ingestedAssetA._id}/document`, 'GET', null, null);
    assert(
      unauthDoc.status === 401,
      'GET /assets/:id/document without token rejected with 401 Unauthorized'
    );

    // 6c. User B attempts to access User A's uploaded private ticket document
    const crossDoc = await apiCall(`/assets/${ingestedAssetA._id}/document`, 'GET', null, tokenB);
    assert(crossDoc.status === 403, 'User B accessing User A document rejected with 403 Forbidden');
    assert(
      crossDoc.body?.message?.includes('Forbidden'),
      'Forbidden error message confirms ownership authorization boundary'
    );

    // 6d. User A successfully accesses own document
    const ownerDoc = await apiCall(`/assets/${ingestedAssetA._id}/document`, 'GET', null, tokenA);
    assert(ownerDoc.status === 200, 'Owner successfully downloads own ticket document (200 OK)');
  } finally {
    // Clean up test records and uploaded files
    console.log(
      `\n${colors.yellow}[CLEANUP] Cleaning up test records and temporary upload files...${colors.reset}`
    );
    const userIds = [userA?._id, userB?._id].filter(Boolean);
    if (userIds.length > 0) {
      const assets = await Asset.find({ ownerId: { $in: userIds } });
      for (const a of assets) {
        if (a.documentUrl && fs.existsSync(a.documentUrl)) {
          try {
            fs.unlinkSync(a.documentUrl);
          } catch {}
        }
      }
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
