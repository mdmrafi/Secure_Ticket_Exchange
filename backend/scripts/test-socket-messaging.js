import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { io as ClientIO } from 'socket.io-client';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { ChatMessage, MessageDeliveryStatus } from '../src/modules/messages/chat-message.model.js';
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

const SOCKET_URL = `http://localhost:${env.PORT || 5000}`;
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

// Helper: Connect Socket.IO client with promise
function connectSocket(token, extraOptions = {}) {
  return new Promise((resolve, reject) => {
    const auth = token ? { token } : {};
    const socket = ClientIO(SOCKET_URL, {
      auth,
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
      ...extraOptions,
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => resolve({ socket, error: err }));
  });
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================`);
  console.log(`     SOCKET.IO AUTHENTICATED MESSAGING TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target Socket.IO Server: ${SOCKET_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set.${colors.reset}\n`);

  await ChatMessage.syncIndexes();

  const timestamp = Date.now();
  let seller, buyer, eavesdropper;
  let tokenSeller, tokenBuyer, tokenEavesdropper;
  let asset, listing, transaction;

  let socketBuyer = null;
  let socketSeller = null;
  let socketEavesdropper = null;

  try {
    // -----------------------------------------------------------------
    // SETUP: Users & Transaction Fixtures
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test users, assets, and transactions...${colors.reset}`);

    seller = await User.create({
      name: 'Socket Seller Sam',
      email: `socket.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 95,
    });
    tokenSeller = generateToken(seller);

    buyer = await User.create({
      name: 'Socket Buyer Bob',
      email: `socket.buyer.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 90,
    });
    tokenBuyer = generateToken(buyer);

    eavesdropper = await User.create({
      name: 'Eavesdropper Eve',
      email: `socket.eve.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 70,
    });
    tokenEavesdropper = generateToken(eavesdropper);

    asset = await Asset.create({
      ownerId: seller._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      uniqueAssetIdentifier: `SOCKET-ASSET-${timestamp}`,
      title: 'VIP Premier League Ticket',
      originalValue: 3500,
      currency: 'BDT',
    });

    listing = await Listing.create({
      assetId: asset._id,
      sellerId: seller._id,
      askingPrice: 4000,
      price: 4000,
      originalFaceValue: 3500,
      currency: 'BDT',
      status: ListingStatus.ACTIVE,
    });

    transaction = await Transaction.create({
      listingId: listing._id,
      assetId: asset._id,
      sellerId: seller._id,
      buyerId: buyer._id,
      amount: 4000,
      currency: 'BDT',
      paymentStatus: PaymentStatus.PAID,
      transactionStatus: TransactionStatus.PAYMENT_CONFIRMED,
      escrowStatus: 'HELD',
    });

    const txRoomId = `tx:${transaction._id}`;
    console.log(`${colors.green}Test fixtures initialized successfully. Target Room: ${txRoomId}${colors.reset}\n`);

    // -----------------------------------------------------------------
    // Scenario 1: Authentication Connection & Unauthenticated Rejection
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Scenario 1: Authenticated Connection & Unauthenticated Rejection${colors.reset}`);

    // Part A: Unauthenticated connection attempt (no token)
    const unauthResult = await connectSocket(null);
    assert(
      Boolean(unauthResult.error),
      'Unauthenticated socket connection rejected'
    );
    assert(
      unauthResult.error?.message?.includes('Authentication error') ||
      unauthResult.error?.message?.includes('Missing authentication token'),
      'Clear authentication error message returned on missing token'
    );
    if (unauthResult.socket?.close) unauthResult.socket.close();

    // Part B: Invalid token connection attempt
    const invalidTokenResult = await connectSocket('invalid_malformed_token_xyz');
    assert(
      Boolean(invalidTokenResult.error),
      'Connection with invalid JWT token rejected'
    );
    if (invalidTokenResult.socket?.close) invalidTokenResult.socket.close();

    // Part C: Authenticated connections for Buyer and Seller
    socketBuyer = await connectSocket(tokenBuyer);
    assert(
      Boolean(socketBuyer.connected),
      'Authenticated Buyer Bob successfully connected to Socket.IO'
    );

    socketSeller = await connectSocket(tokenSeller);
    assert(
      Boolean(socketSeller.connected),
      'Authenticated Seller Sam successfully connected to Socket.IO'
    );

    // -----------------------------------------------------------------
    // Scenario 2: Identity Derivation (Never Trust Client-Supplied userId)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 2: Identity Derivation from Authenticated Socket${colors.reset}`);

    // Join authorized transaction room first
    await new Promise((resolve) => {
      socketBuyer.emit('room:join', { roomId: txRoomId }, (res) => resolve(res));
    });

    // Buyer sends message with spoofed senderId
    const spoofAttempt = await new Promise((resolve) => {
      socketBuyer.emit(
        'message:send',
        {
          roomId: txRoomId,
          content: 'Testing sender identity derivation.',
          senderId: 'spoofed_fake_user_id', // Malicious attempt to spoof sender
        },
        (response) => resolve(response)
      );
    });

    assert(spoofAttempt.success === true, 'Message send acknowledged');
    const sentMsg = spoofAttempt.message;

    // Verify senderId was strictly derived from socket.user.userId (Bob), NOT the spoofed payload
    const persistedMsg = await ChatMessage.findById(sentMsg._id);
    assert(
      persistedMsg.senderId.toString() === buyer._id.toString(),
      'Server derived sender identity strictly from JWT; client spoofed senderId was ignored'
    );
    assert(
      persistedMsg.senderId.toString() !== 'spoofed_fake_user_id',
      'Spoofed senderId successfully overridden'
    );

    // -----------------------------------------------------------------
    // Scenario 3: Room Access Authorization (Prevent Arbitrary Access)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 3: Room Access Authorization Checks${colors.reset}`);

    socketEavesdropper = await connectSocket(tokenEavesdropper);
    assert(socketEavesdropper.connected === true, 'Eavesdropper connected with valid JWT');

    // 1. Eavesdropper attempts to join transaction room they are NOT party to
    const unauthorizedTxJoin = await new Promise((resolve) => {
      socketEavesdropper.emit('room:join', { roomId: txRoomId }, (response) => resolve(response));
    });
    assert(
      unauthorizedTxJoin.success === false,
      'Unauthorized user blocked from joining private transaction room'
    );
    assert(
      unauthorizedTxJoin.error?.includes('Unauthorized') || unauthorizedTxJoin.error?.includes('not a party'),
      'Authorization boundary explanation returned'
    );

    // 2. Eavesdropper attempts to join an arbitrary room (e.g. secret_admin_channel)
    const arbitraryRoomJoin = await new Promise((resolve) => {
      socketEavesdropper.emit('room:join', { roomId: 'secret_admin_backdoor' }, (response) => resolve(response));
    });
    assert(
      arbitraryRoomJoin.success === false,
      'Joining arbitrary unauthorized private rooms is strictly blocked'
    );

    // 3. Eavesdropper attempts to join Buyer Bob's personal notifications room (user:<id>)
    const stolenInboxJoin = await new Promise((resolve) => {
      socketEavesdropper.emit('room:join', { roomId: `user:${buyer._id}` }, (response) => resolve(response));
    });
    assert(
      stolenInboxJoin.success === false,
      'Joining another user personal inbox room is strictly blocked'
    );

    // 4. Authorized Seller Sam joins the transaction room
    const sellerTxJoin = await new Promise((resolve) => {
      socketSeller.emit('room:join', { roomId: txRoomId }, (response) => resolve(response));
    });
    assert(sellerTxJoin.success === true, 'Authorized Seller Sam successfully joined transaction room');

    // -----------------------------------------------------------------
    // Scenario 4: Real-Time Message Delivery
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 4: Real-Time Message Delivery & Online Status${colors.reset}`);

    // Setup listener on Seller socket for real-time delivery
    const deliveryPromise = new Promise((resolve) => {
      socketSeller.once('message:received', (data) => {
        resolve(data);
      });
    });

    // Buyer sends message to Seller in txRoomId
    const sendResult = await new Promise((resolve) => {
      socketBuyer.emit(
        'message:send',
        {
          roomId: txRoomId,
          content: 'Hi Sam! Is this ticket transfer ready for tomorrow?',
          recipientId: seller._id.toString(),
        },
        (res) => resolve(res)
      );
    });

    assert(sendResult.success === true, 'Buyer message:send succeeded');

    // Wait for Seller to receive message via Socket.IO
    const receivedEvent = await Promise.race([
      deliveryPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Delivery timeout')), 4000)),
    ]);

    assert(Boolean(receivedEvent.message), 'Seller received real-time message:received event');
    assert(
      receivedEvent.message.content === 'Hi Sam! Is this ticket transfer ready for tomorrow?',
      'Message content matches exactly'
    );
    assert(
      receivedEvent.message.status === MessageDeliveryStatus.DELIVERED,
      'Message status automatically set to DELIVERED since recipient was online in room'
    );

    // -----------------------------------------------------------------
    // Scenario 5: Typing Indicators
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 5: Typing Indicators${colors.reset}`);

    const typingStartPromise = new Promise((resolve) => {
      socketSeller.once('typing:start', (data) => resolve(data));
    });

    const typingStopPromise = new Promise((resolve) => {
      socketSeller.once('typing:stop', (data) => resolve(data));
    });

    // Buyer starts typing
    socketBuyer.emit('typing:start', { roomId: txRoomId });
    const typingStartEvent = await typingStartPromise;
    assert(typingStartEvent.userId === buyer._id.toString(), 'Seller received typing:start for Buyer Bob');
    assert(typingStartEvent.roomId === txRoomId, 'Typing indicator scoped to transaction room');

    // Buyer stops typing
    socketBuyer.emit('typing:stop', { roomId: txRoomId });
    const typingStopEvent = await typingStopPromise;
    assert(typingStopEvent.userId === buyer._id.toString(), 'Seller received typing:stop for Buyer Bob');

    // -----------------------------------------------------------------
    // Scenario 6: Read Receipts
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 6: Read Receipts${colors.reset}`);

    const messageToReadId = receivedEvent.message._id;

    const readReceiptPromise = new Promise((resolve) => {
      socketBuyer.once('message:read', (data) => resolve(data));
    });

    // Seller reads the message
    const readAck = await new Promise((resolve) => {
      socketSeller.emit('message:read', { messageId: messageToReadId, roomId: txRoomId }, (res) => resolve(res));
    });
    assert(readAck.success === true, 'Seller read acknowledgement returned success');

    // Buyer receives read receipt event
    const readReceiptEvent = await readReceiptPromise;
    assert(readReceiptEvent.messageId.toString() === messageToReadId.toString(), 'Buyer received message:read event');
    assert(readReceiptEvent.readBy === seller._id.toString(), 'Read receipt specifies Seller Sam as reader');

    // Verify DB update
    const dbMsg = await ChatMessage.findById(messageToReadId);
    assert(dbMsg.status === MessageDeliveryStatus.READ, 'Database status updated to READ');
    assert(Boolean(dbMsg.readAt), 'readAt timestamp populated in MongoDB');

    // -----------------------------------------------------------------
    // Scenario 7: Offline Message Persistence & Retrieval
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 7: Offline Message Persistence & Retrieval${colors.reset}`);

    // Disconnect Seller socket to simulate going offline
    socketSeller.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // Query online status for Seller
    const statusQuery = await new Promise((resolve) => {
      socketBuyer.emit('user:status', { targetUserId: seller._id.toString() }, (res) => resolve(res));
    });
    assert(statusQuery.online === false, 'Seller status confirmed offline');

    // Buyer sends message while Seller is offline
    const offlineMsgSend = await new Promise((resolve) => {
      socketBuyer.emit(
        'message:send',
        {
          roomId: txRoomId,
          content: 'Sam, I will be at the gate at 5 PM. See you there.',
          recipientId: seller._id.toString(),
        },
        (res) => resolve(res)
      );
    });

    assert(offlineMsgSend.success === true, 'Message successfully queued and persisted while recipient was offline');
    assert(
      offlineMsgSend.message.status === MessageDeliveryStatus.SENT,
      'Initial status for offline recipient is SENT (not delivered)'
    );

    // Verify persistence in MongoDB
    const persistedOfflineMsg = await ChatMessage.findById(offlineMsgSend.message._id);
    assert(Boolean(persistedOfflineMsg), 'Offline message successfully persisted in MongoDB');
    assert(persistedOfflineMsg.status === MessageDeliveryStatus.SENT, 'Persisted status in DB is SENT');

    // Seller reconnects
    socketSeller = await connectSocket(tokenSeller);
    assert(socketSeller.connected === true, 'Seller reconnected after being offline');

    // Seller queries message history for txRoomId
    const historyResult = await new Promise((resolve) => {
      socketSeller.emit('message:history', { roomId: txRoomId, limit: 10 }, (res) => resolve(res));
    });

    assert(historyResult.success === true, 'Reconnected Seller retrieved message history');
    assert(Array.isArray(historyResult.messages), 'History returns an array of messages');
    const totalCount = historyResult.pagination?.total ?? historyResult.messages?.length ?? 0;
    assert(totalCount >= 3, 'All persisted messages are retrieved from MongoDB');

    const retrievedOfflineMsg = historyResult.messages.find(
      (m) => m.content === 'Sam, I will be at the gate at 5 PM. See you there.'
    );
    assert(Boolean(retrievedOfflineMsg), 'Retrieved history contains the offline message');

    // -----------------------------------------------------------------
    // Scenario 8: REST API History & Access Control
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Scenario 8: REST API Message Endpoints & Authorization${colors.reset}`);

    const restHeaders = { 'Authorization': `Bearer ${tokenBuyer}` };
    const restRes = await fetch(`${BASE_URL}/messages/history?roomId=${encodeURIComponent(txRoomId)}`, {
      headers: restHeaders,
    });
    const restJson = await restRes.json();

    assert(restRes.status === 200, 'GET /api/v1/messages/history returns 200 OK for Buyer');
    assert(restJson.data?.messages?.length >= 3, 'REST API returns complete conversation history');

    // Eavesdropper attempting to fetch history via REST
    const unauthRestRes = await fetch(`${BASE_URL}/messages/history?roomId=${encodeURIComponent(txRoomId)}`, {
      headers: { 'Authorization': `Bearer ${tokenEavesdropper}` },
    });
    assert(unauthRestRes.status === 403, 'Unauthorized user fetching history via REST rejected with 403 Forbidden');

  } catch (error) {
    console.error(`\n${colors.red}Unhandled error during tests:${colors.reset}`, error);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Disconnecting sockets and cleaning up test fixtures...${colors.reset}`);
    try {
      if (socketBuyer?.connected) socketBuyer.disconnect();
      if (socketSeller?.connected) socketSeller.disconnect();
      if (socketEavesdropper?.connected) socketEavesdropper.disconnect();

      const emailFilter = { email: { $regex: `^socket\\..*\\.${timestamp}@example.com$` } };
      await User.deleteMany(emailFilter);
      await Asset.deleteMany({ uniqueAssetIdentifier: { $regex: `^SOCKET-ASSET-${timestamp}` } });
      await Listing.deleteMany({ sellerId: seller?._id });
      await Transaction.deleteMany({ sellerId: seller?._id });
      await ChatMessage.deleteMany({ roomId: `tx:${transaction?._id}` });
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
