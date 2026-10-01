import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import {
  TransactionEvent,
  TransactionEventType,
} from '../src/modules/transactions/transaction-event.model.js';
import { PaymentProvider } from '../src/modules/transactions/providers/payment-provider.interface.js';
import {
  MockPaymentProvider,
  mockPaymentProvider,
} from '../src/modules/transactions/providers/mock-payment.provider.js';
import {
  getPaymentProvider,
  registerPaymentProvider,
} from '../src/modules/transactions/providers/payment-provider.factory.js';
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

// Helper: API caller with custom headers
async function apiCall(endpoint, method = 'GET', body = null, token = null, extraHeaders = {}) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (k.toLowerCase() === 'content-type') {
      headers['Content-Type'] = v;
    } else {
      headers[k] = v;
    }
  }
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
  magenta: '\x1b[35m',
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

async function runPaymentAbstractionTests() {
  console.log(
    `\n${colors.bold}${colors.cyan}======================================================`
  );
  console.log(`  PAYMENT PROVIDER ABSTRACTION & SECURITY TEST SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set.${colors.reset}\n`);

  const createdUserIds = [];
  const createdAssetIds = [];
  const createdListingIds = [];
  const createdTransactionIds = [];

  try {
    const timestamp = Date.now();

    // =================================================================
    // Scenario 1: PaymentProvider Contract & Factory Extensibility
    // =================================================================
    console.log(
      `${colors.bold}Scenario 1: PaymentProvider Interface & Pluggability Contract${colors.reset}`
    );

    // Verify PaymentProvider base class throws when un-implemented
    const baseProvider = new PaymentProvider();
    let throwsProviderName = false;
    try {
      baseProvider.providerName;
    } catch {
      throwsProviderName = true;
    }
    assert(throwsProviderName, 'PaymentProvider.providerName throws if un-implemented');

    let throwsCreate = false;
    try {
      await baseProvider.createPayment({});
    } catch {
      throwsCreate = true;
    }
    assert(throwsCreate, 'PaymentProvider.createPayment throws if un-implemented');

    let throwsVerify = false;
    try {
      await baseProvider.verifyPayment({});
    } catch {
      throwsVerify = true;
    }
    assert(throwsVerify, 'PaymentProvider.verifyPayment throws if un-implemented');

    let throwsRefund = false;
    try {
      await baseProvider.refundPayment({});
    } catch {
      throwsRefund = true;
    }
    assert(throwsRefund, 'PaymentProvider.refundPayment throws if un-implemented');

    // Verify MockPaymentProvider extends PaymentProvider
    assert(
      mockPaymentProvider instanceof PaymentProvider,
      'MockPaymentProvider strictly implements PaymentProvider abstraction'
    );
    assert(
      typeof mockPaymentProvider.createPayment === 'function',
      'MockPaymentProvider implements createPayment()'
    );
    assert(
      typeof mockPaymentProvider.verifyPayment === 'function',
      'MockPaymentProvider implements verifyPayment()'
    );
    assert(
      typeof mockPaymentProvider.refundPayment === 'function',
      'MockPaymentProvider implements refundPayment()'
    );

    // Verify factory registry allows plugging in future providers (e.g. Stripe, SSLCommerz)
    class FutureStripeProvider extends PaymentProvider {
      get providerName() {
        return 'stripe-production';
      }
      async createPayment() {
        return {
          provider: 'stripe-production',
          paymentSessionId: 'stripe_sess_123',
          status: 'PENDING',
        };
      }
      async verifyPayment() {
        return { provider: 'stripe-production', status: 'PAID' };
      }
      async refundPayment() {
        return { provider: 'stripe-production', status: 'REFUNDED' };
      }
    }
    const testStripeProvider = new FutureStripeProvider();
    registerPaymentProvider('stripe', testStripeProvider);
    const resolvedStripe = getPaymentProvider('stripe');
    assert(
      resolvedStripe.providerName === 'stripe-production',
      'Provider factory cleanly registers and resolves new payment providers (Stripe/SSLCommerz)'
    );

    const defaultProvider = getPaymentProvider();
    assert(
      defaultProvider instanceof PaymentProvider,
      'Default payment provider resolves to a valid PaymentProvider instance'
    );

    // =================================================================
    // SETUP: Fixtures for API-Level Payment Security Tests
    // =================================================================
    console.log(
      `\n${colors.yellow}[SETUP] Creating test users, assets, and listings...${colors.reset}`
    );

    const seller = await User.create({
      name: 'Payment Seller Bob',
      email: `pay.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 90,
    });
    createdUserIds.push(seller._id);
    const tokenSeller = generateToken(seller);

    const buyer = await User.create({
      name: 'Payment Buyer Alice',
      email: `pay.buyer.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 94,
    });
    createdUserIds.push(buyer._id);
    const tokenBuyer = generateToken(buyer);

    // Create unique assets and listings for each test scenario
    async function createAssetAndListing(title, price, index) {
      const ast = await Asset.create({
        ownerId: seller._id,
        assetType: AssetTypes.EVENT_TICKET,
        status: AssetStatus.VERIFIED,
        verificationStatus: VerificationStatus.VERIFIED,
        uniqueAssetIdentifier: `PAY-ASSET-${index}-${timestamp}`,
        title,
        originalValue: price,
        currency: 'BDT',
      });
      createdAssetIds.push(ast._id);

      const lst = await Listing.create({
        assetId: ast._id,
        sellerId: seller._id,
        askingPrice: price,
        price,
        currency: 'BDT',
        status: ListingStatus.ACTIVE,
      });
      createdListingIds.push(lst._id);
      return { asset: ast, listing: lst };
    }

    const item1 = await createAssetAndListing('VIP Match Pass', 1200, 1);
    const item2 = await createAssetAndListing('Concert Ticket', 800, 2);
    const item3 = await createAssetAndListing('Train Ticket', 500, 3);
    const item4 = await createAssetAndListing('Bus Pass', 450, 4);
    const item5 = await createAssetAndListing('Museum Entry', 300, 5);

    // =================================================================
    // Scenario 2: Never Trust Frontend (Zero-Trust Verification)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 2: Zero-Trust Frontend Payment Verification${colors.reset}`
    );

    // Initiate transaction
    const initRes = await apiCall(
      '/transactions',
      'POST',
      { listingId: item1.listing._id.toString() },
      tokenBuyer
    );
    assert(initRes.status === 201, 'Transaction initiated successfully (201 Created)');
    const tx = initRes.body?.data;
    createdTransactionIds.push(tx._id);

    // Initialize payment session with provider
    const payRes = await apiCall(`/transactions/${tx._id}/pay`, 'POST', {}, tokenBuyer);
    assert(payRes.status === 200, 'Payment session initialized (200 OK)');
    const paymentSessionId = payRes.body?.data?.paymentSession?.paymentSessionId;
    assert(paymentSessionId != null, 'Payment provider session ID created');

    // Attempt 1: Frontend attempts to report payment success directly via /verify without gateway confirmation
    const fraudulentVerifyRes = await apiCall(
      `/transactions/${tx._id}/verify`,
      'POST',
      { status: 'PAID', outcome: 'SUCCESS', paymentSessionId },
      tokenBuyer
    );
    assert(
      fraudulentVerifyRes.status === 400,
      'Frontend self-reported success rejected when gateway reports PENDING (400 Bad Request)'
    );
    assert(
      fraudulentVerifyRes.body?.message?.includes('not yet been confirmed') ||
        fraudulentVerifyRes.body?.message?.includes('gateway'),
      'Backend explains payment has not been confirmed by authoritative gateway'
    );

    // Verify transaction status remains PAYMENT_PENDING in DB
    const txDocAfterFraud = await Transaction.findById(tx._id);
    assert(
      txDocAfterFraud.transactionStatus === TransactionStatus.PAYMENT_PENDING,
      'Transaction remains in PAYMENT_PENDING (frontend assertion untrusted)'
    );
    assert(
      txDocAfterFraud.paymentStatus === PaymentStatus.PENDING,
      'Payment status remains PENDING in database'
    );

    // Gateway sends authentic signed webhook callback indicating successful payment
    const validCallbackData = mockPaymentProvider.generateSignedWebhookPayload({
      transactionId: tx._id.toString(),
      paymentSessionId,
      amount: 1200,
      currency: 'BDT',
      outcome: 'SUCCESS',
      transactionRef: `GW-REF-${timestamp}`,
    });

    const webhookRes = await apiCall(
      `/transactions/${tx._id}/callback`,
      'POST',
      validCallbackData.payload,
      null,
      validCallbackData.headers
    );
    assert(
      webhookRes.status === 200,
      'Authentic payment webhook verified and processed (200 OK)',
      JSON.stringify(webhookRes)
    );

    // Now frontend queries /verify - backend confirms with provider that session is PAID
    const verifiedStatusRes = await apiCall(
      `/transactions/${tx._id}/verify`,
      'POST',
      { paymentSessionId },
      tokenBuyer
    );
    assert(verifiedStatusRes.status === 200, 'Authoritative payment verification returns 200 OK');
    assert(
      verifiedStatusRes.body?.data?.paymentStatus === PaymentStatus.PAID,
      'Payment status confirmed as PAID'
    );
    assert(
      verifiedStatusRes.body?.data?.transactionStatus === TransactionStatus.PAYMENT_CONFIRMED,
      'Transaction status confirmed as PAYMENT_CONFIRMED'
    );
    assert(
      verifiedStatusRes.body?.data?.escrowStatus === 'HELD',
      'Escrow status transitioned to HELD'
    );

    // Verify PAYMENT_VERIFIED audit event recorded in ledger
    const verifyEvents = await TransactionEvent.find({
      transactionId: tx._id,
      eventType: TransactionEventType.PAYMENT_VERIFIED,
    });
    assert(
      verifyEvents.length > 0,
      'Immutable audit event PAYMENT_VERIFIED recorded in audit ledger'
    );

    // =================================================================
    // Scenario 3: Idempotent Payment Webhook Callbacks
    // =================================================================
    console.log(`\n${colors.bold}Scenario 3: Idempotent Payment Webhook Callbacks${colors.reset}`);

    // Re-send the exact same payment webhook for the already confirmed transaction
    const dupWebhookRes = await apiCall(
      `/transactions/${tx._id}/callback`,
      'POST',
      validCallbackData.payload,
      null,
      validCallbackData.headers
    );

    assert(dupWebhookRes.status === 200, 'Duplicate payment callback safely returns 200 OK');
    assert(
      dupWebhookRes.body?.data?.idempotent === true,
      'Response explicitly identifies idempotent duplicate callback handling'
    );
    assert(
      dupWebhookRes.body?.data?.message?.includes('Duplicate payment callback'),
      'Response message explains duplicate webhook ignored without re-processing'
    );

    // Check DUPLICATE_CALLBACK_IGNORED audit event
    const dupEvents = await TransactionEvent.find({
      transactionId: tx._id,
      eventType: TransactionEventType.DUPLICATE_CALLBACK_IGNORED,
    });
    assert(dupEvents.length > 0, 'DUPLICATE_CALLBACK_IGNORED audit event recorded in ledger');

    // =================================================================
    // Scenario 4: Forged Webhook Callback Defense (HMAC Verification)
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 4: Forged Callback Defense (HMAC-SHA256 Signature)${colors.reset}`
    );

    const initRes2 = await apiCall(
      '/transactions',
      'POST',
      { listingId: item2.listing._id.toString() },
      tokenBuyer
    );
    const tx2 = initRes2.body?.data;
    createdTransactionIds.push(tx2._id);
    await apiCall(`/transactions/${tx2._id}/pay`, 'POST', {}, tokenBuyer);

    // Forged callback: Attacker crafts payload with fake or invalid HMAC signature
    const forgedPayload = {
      event: 'payment.succeeded',
      transactionId: tx2._id.toString(),
      amount: 800,
      currency: 'BDT',
      status: 'PAID',
    };
    const forgedWebhookRes = await apiCall(
      `/transactions/${tx2._id}/callback`,
      'POST',
      forgedPayload,
      null,
      { 'x-signature': 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd' }
    );
    assert(
      forgedWebhookRes.status === 403,
      'Forged webhook with invalid HMAC signature rejected with 403 Forbidden'
    );
    assert(
      forgedWebhookRes.body?.message?.includes('signature') ||
        forgedWebhookRes.body?.message?.includes('forged'),
      'Error message identifies signature verification failure'
    );

    const forgedEvents = await TransactionEvent.find({
      transactionId: tx2._id,
      eventType: TransactionEventType.FORGED_CALLBACK_REJECTED,
    });
    assert(forgedEvents.length > 0, 'FORGED_CALLBACK_REJECTED audit event recorded in ledger');

    // =================================================================
    // Scenario 5: Amount Manipulation Defense
    // =================================================================
    console.log(`\n${colors.bold}Scenario 5: Amount Manipulation Defense${colors.reset}`);

    // Attacker modifies amount from 800 to 15 (amount manipulation)
    const manipulatedAmountPayload = {
      event: 'payment.succeeded',
      transactionId: tx2._id.toString(),
      amount: 15, // Manipulated!
      currency: 'BDT',
      status: 'PAID',
    };
    const amountSig = mockPaymentProvider.computeHmac(manipulatedAmountPayload);

    const amountManipRes = await apiCall(
      `/transactions/${tx2._id}/callback`,
      'POST',
      manipulatedAmountPayload,
      null,
      { 'x-signature': amountSig }
    );
    assert(amountManipRes.status === 400, 'Amount manipulation rejected with 400 Bad Request');
    assert(
      amountManipRes.body?.message?.includes('Amount manipulation') ||
        amountManipRes.body?.message?.includes('amount mismatch'),
      'Error message details amount mismatch between expected and received'
    );

    const amountEvents = await TransactionEvent.find({
      transactionId: tx2._id,
      eventType: TransactionEventType.AMOUNT_MANIPULATION_DETECTED,
    });
    assert(amountEvents.length > 0, 'AMOUNT_MANIPULATION_DETECTED audit event recorded');

    // =================================================================
    // Scenario 6: Currency Manipulation Defense
    // =================================================================
    console.log(`\n${colors.bold}Scenario 6: Currency Manipulation Defense${colors.reset}`);

    // Attacker modifies currency from BDT to USD (currency manipulation)
    const manipulatedCurrencyPayload = {
      event: 'payment.succeeded',
      transactionId: tx2._id.toString(),
      amount: 800,
      currency: 'USD', // Manipulated!
      status: 'PAID',
    };
    const currSig = mockPaymentProvider.computeHmac(manipulatedCurrencyPayload);

    const currManipRes = await apiCall(
      `/transactions/${tx2._id}/callback`,
      'POST',
      manipulatedCurrencyPayload,
      null,
      { 'x-signature': currSig }
    );
    assert(currManipRes.status === 400, 'Currency manipulation rejected with 400 Bad Request');
    assert(
      currManipRes.body?.message?.includes('Currency manipulation') ||
        currManipRes.body?.message?.includes('currency mismatch'),
      'Error message details currency mismatch'
    );

    const currEvents = await TransactionEvent.find({
      transactionId: tx2._id,
      eventType: TransactionEventType.CURRENCY_MANIPULATION_DETECTED,
    });
    assert(currEvents.length > 0, 'CURRENCY_MANIPULATION_DETECTED audit event recorded');

    // =================================================================
    // Scenario 7: Replay Attack Defenses
    // =================================================================
    console.log(`\n${colors.bold}Scenario 7: Replay Attack Defenses${colors.reset}`);

    // Sub-case 7A: Replaying a callback onto a CANCELLED transaction
    const initRes3 = await apiCall(
      '/transactions',
      'POST',
      { listingId: item3.listing._id.toString() },
      tokenBuyer
    );
    const tx3 = initRes3.body?.data;
    createdTransactionIds.push(tx3._id);

    // Cancel transaction
    await apiCall(
      `/transactions/${tx3._id}/cancel`,
      'POST',
      { reason: 'User cancelled' },
      tokenBuyer
    );

    // Attempt to replay valid callback on cancelled transaction
    const replayPayload = {
      event: 'payment.succeeded',
      transactionId: tx3._id.toString(),
      amount: 500,
      currency: 'BDT',
      status: 'PAID',
    };
    const replaySig = mockPaymentProvider.computeHmac(replayPayload);
    const replayRes = await apiCall(
      `/transactions/${tx3._id}/callback`,
      'POST',
      replayPayload,
      null,
      { 'x-signature': replaySig }
    );
    assert(
      replayRes.status === 400,
      'Replay attack on cancelled transaction rejected with 400 Bad Request'
    );
    assert(
      replayRes.body?.message?.includes('Replay attack detected') ||
        replayRes.body?.message?.includes('cancelled'),
      'Error message identifies replay attack on cancelled transaction'
    );

    const replayEvents = await TransactionEvent.find({
      transactionId: tx3._id,
      eventType: TransactionEventType.REPLAY_ATTACK_DETECTED,
    });
    assert(replayEvents.length > 0, 'REPLAY_ATTACK_DETECTED audit event recorded');

    // Sub-case 7B: Webhook timestamp expiration (stale timestamp > 5 minutes)
    const staleTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const stalePayload = {
      event: 'payment.succeeded',
      transactionId: tx2._id.toString(),
      amount: 800,
      currency: 'BDT',
      status: 'PAID',
      timestamp: staleTimestamp,
    };
    const staleSig = mockPaymentProvider.computeHmac(stalePayload);
    const staleRes = await apiCall(
      `/transactions/${tx2._id}/callback`,
      'POST',
      stalePayload,
      null,
      {
        'x-signature': staleSig,
        'x-webhook-timestamp': String(staleTimestamp),
      }
    );
    assert(
      staleRes.status === 400,
      'Stale webhook callback (> 5 min old) rejected as replay attempt (400 Bad Request)'
    );
    assert(
      staleRes.body?.message?.includes('timestamp expired') ||
        staleRes.body?.message?.includes('replay'),
      'Error message identifies expired timestamp'
    );

    // =================================================================
    // Scenario 8: Transaction Mismatch Defense
    // =================================================================
    console.log(`\n${colors.bold}Scenario 8: Transaction Mismatch Defense${colors.reset}`);

    // Payload specifying transactionId of tx1 sent to tx2 callback route
    const mismatchedPayload = {
      event: 'payment.succeeded',
      transactionId: tx._id.toString(), // Belongs to tx1!
      amount: 800,
      currency: 'BDT',
      status: 'PAID',
    };
    const mismatchSig = mockPaymentProvider.computeHmac(mismatchedPayload);
    const mismatchRes = await apiCall(
      `/transactions/${tx2._id}/callback`,
      'POST',
      mismatchedPayload,
      null,
      { 'x-signature': mismatchSig }
    );
    assert(
      mismatchRes.status === 400,
      'Mismatched transaction ID in payload rejected with 400 Bad Request'
    );
    assert(
      mismatchRes.body?.message?.includes('mismatch') ||
        mismatchRes.body?.message?.includes('Transaction ID'),
      'Error message identifies transaction mismatch'
    );

    const mismatchEvents = await TransactionEvent.find({
      transactionId: tx2._id,
      eventType: TransactionEventType.TRANSACTION_MISMATCH_DETECTED,
    });
    assert(mismatchEvents.length > 0, 'TRANSACTION_MISMATCH_DETECTED audit event recorded');

    // =================================================================
    // Scenario 9: Sensitive Payment Credential Protection & Stripping
    // =================================================================
    console.log(
      `\n${colors.bold}Scenario 9: Sensitive Payment Credential Protection (Zero PAN/CVV Storage)${colors.reset}`
    );

    const initRes4 = await apiCall(
      '/transactions',
      'POST',
      { listingId: item4.listing._id.toString() },
      tokenBuyer
    );
    const tx4 = initRes4.body?.data;
    createdTransactionIds.push(tx4._id);
    await apiCall(`/transactions/${tx4._id}/pay`, 'POST', {}, tokenBuyer);

    // Send callback containing raw cardholder data (PAN, CVV, PIN, expiry)
    const rawPan = '4111222233334444';
    const rawCvv = '789';
    const rawPin = '1234';

    const signedWebhook = mockPaymentProvider.generateSignedWebhookPayload({
      transactionId: tx4._id.toString(),
      paymentSessionId: tx4.paymentDetails?.paymentSessionId,
      amount: 450,
      currency: 'BDT',
      outcome: 'SUCCESS',
    });

    // Infiltrate sensitive credentials into payload
    signedWebhook.payload.cardNumber = rawPan;
    signedWebhook.payload.pan = rawPan;
    signedWebhook.payload.cvv = rawCvv;
    signedWebhook.payload.pin = rawPin;
    signedWebhook.payload.expiryDate = '12/29';
    const updatedSig = mockPaymentProvider.computeHmac(signedWebhook.payload);

    const credentialRes = await apiCall(
      `/transactions/${tx4._id}/callback`,
      'POST',
      signedWebhook.payload,
      null,
      { 'x-signature': updatedSig }
    );
    assert(credentialRes.status === 200, 'Valid callback with sanitized fields accepted (200 OK)');

    // Inspect database transaction document to confirm NO credentials stored
    const tx4InDb = await Transaction.findById(tx4._id).lean();
    const tx4String = JSON.stringify(tx4InDb);
    assert(
      !tx4String.includes(rawPan),
      'Database transaction document contains ZERO instances of raw card PAN'
    );
    assert(
      !tx4String.includes(rawCvv),
      'Database transaction document contains ZERO instances of CVV'
    );
    assert(
      !tx4String.includes(rawPin),
      'Database transaction document contains ZERO instances of PIN'
    );

    // Inspect audit event logs to confirm NO credentials logged
    const allTx4Events = await TransactionEvent.find({ transactionId: tx4._id }).lean();
    const eventsString = JSON.stringify(allTx4Events);
    assert(
      !eventsString.includes(rawPan),
      'Audit event logs contain ZERO instances of raw card PAN'
    );
    assert(!eventsString.includes(rawCvv), 'Audit event logs contain ZERO instances of CVV');
    assert(!eventsString.includes(rawPin), 'Audit event logs contain ZERO instances of PIN');

    // =================================================================
    // Scenario 10: Provider Refund Execution
    // =================================================================
    console.log(`\n${colors.bold}Scenario 10: Payment Provider Refund Execution${colors.reset}`);

    // Transaction tx4 is now PAID. Cancelling it must invoke provider refundPayment.
    const cancelRes = await apiCall(
      `/transactions/${tx4._id}/cancel`,
      'POST',
      { reason: 'Buyer requested refund before transfer' },
      tokenBuyer
    );
    assert(cancelRes.status === 200, 'POST /transactions/:id/cancel returns 200 OK');
    assert(
      cancelRes.body?.data?.paymentStatus === PaymentStatus.REFUNDED,
      'Transaction paymentStatus updated to REFUNDED'
    );
    assert(cancelRes.body?.data?.escrowStatus === 'REFUNDED', 'Escrow status updated to REFUNDED');

    // Verify refund persisted in database
    const tx4InDbAfterCancel = await Transaction.findById(tx4._id);
    assert(
      tx4InDbAfterCancel.paymentStatus === PaymentStatus.REFUNDED,
      'Transaction paymentStatus authoritatively recorded as REFUNDED in database'
    );
    assert(
      tx4InDbAfterCancel.escrowStatus === 'REFUNDED',
      'Escrow funds authoritatively released/refunded in database'
    );

    // Verify refund method contract on PaymentProvider
    const directRefund = await mockPaymentProvider.refundPayment({
      paymentSessionId: 'mock_test_refund_sess',
      amount: 450,
      currency: 'BDT',
      reason: 'Contractual refund test',
    });
    assert(
      directRefund.status === 'REFUNDED',
      'Payment provider refundPayment() returns status REFUNDED'
    );
    assert(directRefund.refundId != null, 'Payment provider generates unique refund identifier');
  } catch (error) {
    console.error(`\n${colors.red}[FATAL TEST RUNTIME ERROR]${colors.reset}`, error);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    try {
      if (createdTransactionIds.length > 0) {
        await Transaction.deleteMany({ _id: { $in: createdTransactionIds } });
        // Use direct native driver to bypass immutable mongoose hook for test cleanup
        await mongoose.connection.collection('transactionevents').deleteMany({
          transactionId: { $in: createdTransactionIds },
        });
      }
      if (createdListingIds.length > 0) {
        await Listing.deleteMany({ _id: { $in: createdListingIds } });
      }
      if (createdAssetIds.length > 0) {
        await Asset.deleteMany({ _id: { $in: createdAssetIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await mongoose.disconnect();
    console.log('Database disconnected cleanly.\n');
  }

  // =================================================================
  // SUMMARY
  // =================================================================
  console.log(
    `${colors.bold}======================================================${colors.reset}`
  );
  console.log(
    `TEST SUMMARY: ${colors.green}${passedCount} passed${colors.reset}, ${
      failedCount > 0 ? colors.red : colors.reset
    }${failedCount} failed${colors.reset}`
  );
  console.log(
    `${colors.bold}======================================================${colors.reset}\n`
  );

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPaymentAbstractionTests().catch((err) => {
  console.error('Test runner encountered uncaught error:', err);
  process.exit(1);
});
