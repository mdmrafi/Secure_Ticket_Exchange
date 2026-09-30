import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { createAssetDomain, RailwayTicket, BusTicket, EventTicket, DocumentAsset } from '../src/modules/assets/types/index.js';
import { getAssetVerifier } from '../src/modules/verification/verifiers/asset-verifier.factory.js';
import { RailwayTicketVerifier } from '../src/modules/verification/verifiers/railway-ticket.verifier.js';
import { AssetTypes, AssetStatus, VerificationStatus } from '../src/common/constants/asset-types.constant.js';
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

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================`);
  console.log(`     GENERIC ASSET ABSTRACTION & OWNERSHIP TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  // Connect to DB for direct setup and verification
  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas for fixture assertions.${colors.reset}\n`);

  const timestamp = Date.now();
  let userA, userB, userAdmin;
  let tokenA, tokenB, tokenAdmin;
  let createdAssetA, createdAssetB;

  try {
    // -----------------------------------------------------------------
    // SETUP: Create isolated test users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test user accounts...${colors.reset}`);
    userA = await User.create({
      name: 'Asset Owner Alice',
      email: `asset.alice.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenA = generateToken(userA);

    userB = await User.create({
      name: 'Asset Competitor Bob',
      email: `asset.bob.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
    });
    tokenB = generateToken(userB);

    userAdmin = await User.create({
      name: 'Asset Inspector Admin',
      email: `asset.admin.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
    });
    tokenAdmin = generateToken(userAdmin);

    console.log(`${colors.green}Test user fixtures ready.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // TEST 1: Domain Abstraction Hierarchy Verification
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Scenario 1: Asset Domain Hierarchy & Subclasses${colors.reset}`);
    const railDomain = createAssetDomain({
      ownerId: userA._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      metadata: { pnr: 'PNR12345678', trainNumber: '701', fromStation: 'Dhaka', toStation: 'Chittagong' },
    });
    assert(railDomain instanceof RailwayTicket, 'RailwayTicket domain model instantiated correctly');
    assert(railDomain.pnr === 'PNR12345678', 'RailwayTicket exposes type-safe metadata getters (pnr)');
    assert(railDomain.generateUniqueIdentifier() === 'RAIL-PNR-PNR12345678', 'RailwayTicket derives unique PNR identifier');

    const busDomain = createAssetDomain({
      ownerId: userA._id,
      assetType: AssetTypes.BUS_TICKET,
      metadata: { operator: 'Green Line', ticketNumber: 'GL-9988' },
    });
    assert(busDomain instanceof BusTicket, 'BusTicket domain model instantiated correctly');

    const eventDomain = createAssetDomain({
      ownerId: userA._id,
      assetType: AssetTypes.EVENT_TICKET,
      metadata: { eventName: 'Tech Summit 2026', barcode: 'BC-554433' },
    });
    assert(eventDomain instanceof EventTicket, 'EventTicket domain model instantiated correctly');

    const docDomain = createAssetDomain({
      ownerId: userA._id,
      assetType: AssetTypes.DOCUMENT,
      metadata: { documentNumber: 'CERT-0099' },
    });
    assert(docDomain instanceof DocumentAsset, 'DocumentAsset domain model instantiated correctly');

    // -----------------------------------------------------------------
    // TEST 2: Asset Creation (POST /api/v1/assets)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 2: Asset Creation (POST /api/v1/assets)${colors.reset}`);
    const railwayPayload = {
      assetType: 'RAILWAY_TICKET',
      title: 'Dhaka to Chittagong Suborno Express',
      description: 'AC Chair coach Shovon Chair ticket',
      uniqueAssetIdentifier: `PNR-${timestamp}-01`,
      originalValue: 1250,
      currency: 'BDT',
      metadata: {
        pnr: `PNR-${timestamp}-01`,
        trainNumber: '702',
        trainName: 'Suborno Express',
        fromStation: 'Dhaka',
        toStation: 'Chittagong',
        journeyDate: '2026-10-15',
        seatClass: 'SNIGDHA',
        coach: 'KHA',
        seats: ['12', '13'],
      },
    };

    const createRes = await apiCall('/assets', 'POST', railwayPayload, tokenA);
    assert(createRes.status === 201, 'POST /assets returns 201 Created');
    assert(createRes.body?.success === true, 'Response indicates success: true');
    assert(createRes.body?.data?.assetType === 'RAILWAY_TICKET', 'Asset type is RAILWAY_TICKET');
    assert(createRes.body?.data?.status === 'DRAFT', 'Default status is DRAFT');
    assert(createRes.body?.data?.verificationStatus === 'NOT_REQUESTED', 'Initial verificationStatus is NOT_REQUESTED');
    assert(createRes.body?.data?.ownerId?.toString() === userA._id.toString() || createRes.body?.data?.ownerId?._id === userA._id.toString(), 'ownerId accurately assigned to authenticated user');
    assert(createRes.body?.data?.metadata?.pnr === `PNR-${timestamp}-01`, 'metadata preserved on asset');

    createdAssetA = createRes.body?.data;

    // Create a second asset for User B
    const busPayload = {
      assetType: 'BUS_TICKET',
      uniqueAssetIdentifier: `BUS-${timestamp}-02`,
      originalValue: 800,
      metadata: {
        operator: 'Shohag Elite',
        ticketNumber: `TK-${timestamp}-02`,
        from: 'Dhaka',
        to: 'Coxs Bazar',
      },
    };
    const createBRes = await apiCall('/assets', 'POST', busPayload, tokenB);
    assert(createBRes.status === 201, 'User B creates BUS_TICKET asset (201 Created)');
    createdAssetB = createBRes.body?.data;

    // -----------------------------------------------------------------
    // TEST 3: Asset Retrieval (GET /api/v1/assets/:id & GET /api/v1/assets/my)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 3: Asset Retrieval (GET /assets/:id & GET /assets/my)${colors.reset}`);
    // Owner retrieves own asset
    const getOwnerRes = await apiCall(`/assets/${createdAssetA._id}`, 'GET', null, tokenA);
    assert(getOwnerRes.status === 200, 'Owner retrieves own asset details (200 OK)');
    assert(getOwnerRes.body?.data?._id === createdAssetA._id, 'Returned asset matches requested ID');
    assert(getOwnerRes.body?.data?.verificationStatus === 'NOT_REQUESTED', 'verificationStatus is present in response');

    // GET /api/v1/assets/my retrieves caller's assets
    const myAssetsRes = await apiCall('/assets/my', 'GET', null, tokenA);
    assert(myAssetsRes.status === 200, 'GET /assets/my returns 200 OK');
    assert(Array.isArray(myAssetsRes.body?.data), 'Returns an array of assets');
    const hasOwnAsset = myAssetsRes.body?.data?.some((a) => a._id === createdAssetA._id);
    const hasOtherAsset = myAssetsRes.body?.data?.some((a) => a._id === createdAssetB._id);
    assert(hasOwnAsset, 'My assets includes User A asset');
    assert(!hasOtherAsset, 'My assets strictly excludes User B asset');

    // Backward compatibility alias /user/me
    const legacyMeRes = await apiCall('/assets/user/me', 'GET', null, tokenA);
    assert(legacyMeRes.status === 200, 'Legacy GET /assets/user/me alias supported');

    // -----------------------------------------------------------------
    // TEST 4: Ownership Checks & Unauthorized Access to Other User's Asset
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 4: Ownership Authorization Checks${colors.reset}`);
    // User B attempts to access User A's private draft asset
    const crossGetRes = await apiCall(`/assets/${createdAssetA._id}`, 'GET', null, tokenB);
    assert(crossGetRes.status === 403, 'User B accessing User A private asset rejected with 403 Forbidden');
    assert(crossGetRes.body?.message?.includes('Forbidden'), 'Forbidden message explains unauthorized private asset boundary');

    // User B attempts to modify User A's asset
    const crossPatchRes = await apiCall(`/assets/${createdAssetA._id}`, 'PATCH', { title: 'Hacked Title' }, tokenB);
    assert(crossPatchRes.status === 403, 'User B modifying User A asset rejected with 403 Forbidden');
    assert(crossPatchRes.body?.message?.includes('modify your own assets'), 'Modification strictly restricted to owner');

    // User B attempts to delete User A's asset
    const crossDeleteRes = await apiCall(`/assets/${createdAssetA._id}`, 'DELETE', null, tokenB);
    assert(crossDeleteRes.status === 403, 'User B deleting User A asset rejected with 403 Forbidden');
    assert(crossDeleteRes.body?.message?.includes('delete your own assets'), 'Deletion strictly restricted to owner');

    // Admin CAN access User A's asset for review
    const adminGetRes = await apiCall(`/assets/${createdAssetA._id}`, 'GET', null, tokenAdmin);
    assert(adminGetRes.status === 200, 'ADMIN authorized to view any asset for compliance');

    // User A can modify their own asset
    const ownerPatchRes = await apiCall(`/assets/${createdAssetA._id}`, 'PATCH', { title: 'Updated Train Title' }, tokenA);
    assert(ownerPatchRes.status === 200, 'Owner successfully updates own asset (200 OK)');
    assert(ownerPatchRes.body?.data?.title === 'Updated Train Title', 'Title updated correctly');

    // User A deletes their own asset
    const ownerDeleteRes = await apiCall(`/assets/${createdAssetA._id}`, 'DELETE', null, tokenA);
    assert(ownerDeleteRes.status === 200, 'Owner successfully deletes own asset (200 OK)');
    assert(ownerDeleteRes.body?.data?.deletedAssetId === createdAssetA._id, 'Confirmed deleted asset ID returned');

    // Subsequent retrieval yields 404
    const postDeleteGet = await apiCall(`/assets/${createdAssetA._id}`, 'GET', null, tokenA);
    assert(postDeleteGet.status === 404, 'Deleted asset no longer exists (404 Not Found)');

    // -----------------------------------------------------------------
    // TEST 5: Invalid Asset Type Validation
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 5: Invalid Asset Type Handling${colors.reset}`);
    const invalidTypePayload = {
      assetType: 'INVALID_SPACESHIP_TICKET',
      title: 'SpaceX Galactic Pass',
      uniqueAssetIdentifier: `SPACEX-${timestamp}`,
    };
    const invalidTypeRes = await apiCall('/assets', 'POST', invalidTypePayload, tokenA);
    assert(invalidTypeRes.status === 422, 'POST /assets with invalid assetType rejected with 422 Unprocessable Entity');
    assert(
      invalidTypeRes.body?.errors?.some((e) => e.field?.includes('assetType') || e.message?.includes('Invalid asset type')),
      'Validation error highlights invalid asset type'
    );

    // -----------------------------------------------------------------
    // TEST 6: Unauthorized Access (No Token)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 6: Unauthorized Access Protection${colors.reset}`);
    const unauthPost = await apiCall('/assets', 'POST', railwayPayload, null);
    assert(unauthPost.status === 401, 'POST /assets without token rejected with 401 Unauthorized');

    const unauthMy = await apiCall('/assets/my', 'GET', null, null);
    assert(unauthMy.status === 401, 'GET /assets/my without token rejected with 401 Unauthorized');

    const unauthDelete = await apiCall(`/assets/${createdAssetB._id}`, 'DELETE', null, null);
    assert(unauthDelete.status === 401, 'DELETE /assets/:id without token rejected with 401 Unauthorized');

    const unauthGet = await apiCall(`/assets/${createdAssetB._id}`, 'GET', null, null);
    assert(unauthGet.status === 401, 'GET /assets/:id private asset without token rejected with 401 Unauthorized');

    // -----------------------------------------------------------------
    // TEST 7: Modular Verifier Interface & RailwayTicketVerifier
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 7: Modular Verifier Interface & RailwayTicketVerifier${colors.reset}`);
    const railwayVerifier = getAssetVerifier(AssetTypes.RAILWAY_TICKET);
    assert(railwayVerifier instanceof RailwayTicketVerifier, 'Factory returns RailwayTicketVerifier for RAILWAY_TICKET');
    assert(railwayVerifier.getAssetType() === AssetTypes.RAILWAY_TICKET, 'getAssetType returns RAILWAY_TICKET');

    const mockAssetDoc = {
      _id: new mongoose.Types.ObjectId(),
      assetType: AssetTypes.RAILWAY_TICKET,
      uniqueAssetIdentifier: 'RAIL-PNR-77889900',
      metadata: { pnr: '77889900' },
    };

    const verifierResult = await railwayVerifier.verify(mockAssetDoc);
    assert(verifierResult.isVerified === false, 'RailwayTicketVerifier stub returns isVerified: false');
    assert(verifierResult.status === VerificationStatus.IN_REVIEW, 'RailwayTicketVerifier stub returns IN_REVIEW');
    assert(Array.isArray(verifierResult.checks), 'Verifier returns structured checks array');
    assert(verifierResult.checks.some((c) => c.checkType === 'PNR_STRUCTURE_VALIDATION'), 'Contains PNR_STRUCTURE_VALIDATION check');
    assert(verifierResult.details?.stubMode === true, 'Verifier details explicitly state stubMode: true');

    // Fallback verifier for future types
    const busVerifier = getAssetVerifier(AssetTypes.BUS_TICKET);
    const busResult = await busVerifier.verify({ assetType: AssetTypes.BUS_TICKET });
    assert(busResult.details?.stubMode === true, 'Generic fallback verifier available for future asset types');
  } finally {
    // Clean up test records
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test users and assets...${colors.reset}`);
    const userIds = [userA?._id, userB?._id, userAdmin?._id].filter(Boolean);
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
      await Asset.deleteMany({ ownerId: { $in: userIds } });
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
