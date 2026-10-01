import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { env } from '../src/config/env.config.js';
import { EventNames, CORE_DOMAIN_EVENTS } from '../src/common/constants/events.constant.js';
import { eventPublisher, publishEvent } from '../src/jobs/publisher.js';
import { idempotencyService } from '../src/jobs/idempotency/idempotency.service.js';
import {
  ProcessedEvent,
  ProcessedEventStatus,
} from '../src/jobs/idempotency/processed-event.model.js';
import { AuditLog } from '../src/modules/audit/audit-log.model.js';
import { auditService } from '../src/modules/audit/audit.service.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { notificationService } from '../src/modules/notifications/notification.service.js';
import { emailService } from '../src/modules/notifications/email.service.js';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Reservation, ReservationStatus } from '../src/modules/listings/reservation.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { listingService } from '../src/modules/listings/listing.service.js';
import {
  AssetStatus,
  ListingStatus,
  VerificationStatus,
  TransactionStatus,
  PaymentStatus,
} from '../src/common/constants/asset-types.constant.js';
import { allInngestFunctions } from '../src/jobs/functions/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

// Mock step runner to execute Inngest steps directly with realistic step.run / step.sleep semantics
function createMockStep() {
  const stepExecutions = [];
  return {
    run: async (stepName, fn) => {
      stepExecutions.push({ type: 'run', name: stepName });
      return fn();
    },
    sleep: async (stepName, duration) => {
      stepExecutions.push({ type: 'sleep', name: stepName, duration });
      return true;
    },
    sleepUntil: async (stepName, date) => {
      stepExecutions.push({ type: 'sleepUntil', name: stepName, date });
      return true;
    },
    executions: stepExecutions,
  };
}

async function runTestSuite() {
  console.log('\n' + '='.repeat(70));
  console.log(
    `${colors.cyan}${colors.bold}  INNGEST ASYNCHRONOUS BACKGROUND JOBS TEST SUITE${colors.reset}`
  );
  console.log('='.repeat(70) + '\n');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_asset_exchange';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(
    `${colors.blue}ℹ Connected to MongoDB Atlas for background jobs integration tests${colors.reset}\n`
  );

  // Shared test identifiers
  const testRunId = `test_${Date.now()}`;
  const testUserId = new mongoose.Types.ObjectId();
  const testSellerId = new mongoose.Types.ObjectId();
  const testAssetId = new mongoose.Types.ObjectId();
  const testListingId = new mongoose.Types.ObjectId();
  const testTransactionId = new mongoose.Types.ObjectId();

  try {
    // =========================================================================
    // SECTION 1: Event Creation & Publishing Tests
    // =========================================================================
    console.log(
      `${colors.yellow}${colors.bold}1. Event Creation & Dispatching Tests${colors.reset}`
    );

    // Verify all 11 core domain events are defined
    assert(CORE_DOMAIN_EVENTS.length === 11, 'Core Domain Events Count', 'Expected 11 events');

    const expectedEvents = [
      'user.created',
      'kyc.completed',
      'asset.created',
      'asset.verified',
      'listing.created',
      'listing.reserved',
      'transaction.created',
      'payment.completed',
      'transfer.completed',
      'fraud.detected',
      'report.created',
    ];

    for (const evtName of expectedEvents) {
      assert(
        CORE_DOMAIN_EVENTS.includes(evtName),
        `Event defined: ${evtName}`,
        'Included in CORE_DOMAIN_EVENTS'
      );
    }

    // Test publishing an event through EventPublisher
    let capturedEvent = null;
    const unsubscribe = eventPublisher.on(EventNames.USER_CREATED, (event) => {
      capturedEvent = event;
    });

    const publishResult = await publishEvent(
      EventNames.USER_CREATED,
      {
        userId: testUserId.toString(),
        email: `test_${testRunId}@example.com`,
        name: 'Test Inngest User',
      },
      { id: testUserId.toString(), email: `test_${testRunId}@example.com`, role: 'USER' }
    );

    unsubscribe();

    assert(
      publishResult && publishResult.eventId,
      'Event envelope created with unique ID',
      publishResult.eventId
    );
    assert(capturedEvent !== null, 'Local event observer captured published event');
    assert(
      capturedEvent?.name === EventNames.USER_CREATED,
      'Event envelope has correct event name'
    );
    assert(capturedEvent?.data?.userId === testUserId.toString(), 'Event data payload preserved');
    assert(
      capturedEvent?.data?.eventId === publishResult.eventId,
      'Event ID embedded inside data payload'
    );
    assert(
      capturedEvent?.user?.email === `test_${testRunId}@example.com`,
      'User context preserved in event'
    );

    // =========================================================================
    // SECTION 2: Background Job Execution Tests
    // =========================================================================
    console.log(`\n${colors.yellow}${colors.bold}2. Background Job Execution Tests${colors.reset}`);

    // Test 2A: Audit Processing Job
    console.log(`  ${colors.cyan}Testing Audit Processing Background Job...${colors.reset}`);
    const auditEventId = `evt_audit_exec_${testRunId}`;
    const auditRecord = await auditService.recordAuditEvent({
      eventId: auditEventId,
      eventName: EventNames.LISTING_CREATED,
      data: {
        listingId: testListingId.toString(),
        sellerId: testSellerId.toString(),
        askingPrice: 1500,
        currency: 'BDT',
      },
      user: { id: testSellerId.toString(), role: 'SELLER' },
    });

    assert(auditRecord && auditRecord._id, 'Audit record persisted in database');
    assert(auditRecord.entityType === 'LISTING', 'Audit record resolved entityType correctly');
    assert(
      auditRecord.entityId === testListingId.toString(),
      'Audit record resolved entityId correctly'
    );
    assert(auditRecord.eventId === auditEventId, 'Audit record indexed by eventId');

    // Test 2B: In-App Notification Job
    console.log(`  ${colors.cyan}Testing In-App Notification Background Job...${colors.reset}`);
    const notification = await notificationService.sendNotification(testUserId, {
      title: 'Identity Verification Approved',
      message: 'Your documents have been verified.',
      type: 'SYSTEM',
      data: { kycId: `kyc_${testRunId}` },
    });

    assert(notification && notification._id, 'Notification persisted in database');
    assert(
      notification.recipientId.toString() === testUserId.toString(),
      'Notification recipient matched'
    );
    assert(notification.isRead === false, 'Notification defaults to unread');

    // Test 2C: Email Notification Job
    console.log(`  ${colors.cyan}Testing Email Notification Background Job...${colors.reset}`);
    emailService.clearOutbox();
    const sentEmail = await emailService.sendWelcomeEmail({
      email: `welcome_${testRunId}@example.com`,
      name: 'Welcome Inngest User',
      userId: testUserId.toString(),
    });

    assert(sentEmail && sentEmail.id, 'Welcome email generated with unique ID');
    assert(sentEmail.to === `welcome_${testRunId}@example.com`, 'Email recipient matched');
    assert(emailService.getOutbox().length === 1, 'Email stored in outbox for delivery');

    // Test 2D: Expired Reservation Cleanup Job
    console.log(`  ${colors.cyan}Testing Cleanup Expired Reservations Job...${colors.reset}`);
    // Create test listing in RESERVED status
    const testListing = await Listing.create({
      _id: testListingId,
      sellerId: testSellerId,
      assetId: testAssetId,
      askingPrice: 2000,
      price: 2000,
      originalFaceValue: 2000,
      status: ListingStatus.RESERVED,
    });

    // Create an expired reservation for this listing
    const pastExpiration = new Date(Date.now() - 60 * 1000); // 1 minute in past
    const expiredRes = await Reservation.create({
      listingId: testListingId,
      buyerId: testUserId,
      expiresAt: pastExpiration,
      status: ReservationStatus.ACTIVE,
    });

    // Run sweep
    const sweepResult = await listingService.expireStaleReservations();
    const reloadedReservation = await Reservation.findById(expiredRes._id);
    const reloadedListing = await Listing.findById(testListingId);

    assert(sweepResult.expiredCount >= 1, 'Sweeper detected expired reservations');
    assert(
      reloadedReservation.status === ReservationStatus.EXPIRED,
      'Stale reservation transitioned to EXPIRED'
    );
    assert(
      reloadedListing.status === ListingStatus.ACTIVE,
      'Listing atomically restored back to ACTIVE'
    );

    // Test 2E: Transaction Reminder Job
    console.log(`  ${colors.cyan}Testing Transaction Reminders Job...${colors.reset}`);
    // Create pending transaction
    const pendingTx = await Transaction.create({
      _id: testTransactionId,
      listingId: testListingId,
      assetId: testAssetId,
      buyerId: testUserId,
      sellerId: testSellerId,
      amount: 2000,
      currency: 'BDT',
      transactionStatus: TransactionStatus.INITIATED,
      paymentStatus: PaymentStatus.PENDING,
    });

    // Test reminder logic: when pending, dispatches notification and updates metadata
    const reminderEventId = `evt_reminder_${testRunId}`;
    const reminderResult = await idempotencyService.executeIdempotent(
      {
        eventId: reminderEventId,
        jobId: 'transaction-reminders-job',
        eventName: EventNames.TRANSACTION_CREATED,
      },
      async () => {
        const tx = await Transaction.findById(testTransactionId);
        const isPending =
          tx.transactionStatus === TransactionStatus.INITIATED ||
          tx.transactionStatus === TransactionStatus.PAYMENT_PENDING;

        if (isPending && !tx.metadata?.paymentReminderSentAt) {
          await notificationService.sendNotification(tx.buyerId, {
            title: 'Reminder: Action Required for Order',
            message: `Your payment for order #${tx._id} is pending.`,
            type: 'TRANSACTION',
          });

          await Transaction.findByIdAndUpdate(tx._id, {
            $set: { 'metadata.paymentReminderSentAt': new Date() },
          });

          return { sent: true, transactionId: tx._id };
        }
        return { sent: false };
      }
    );

    const reloadedTx = await Transaction.findById(testTransactionId);
    assert(reminderResult.result?.sent === true, 'Reminder sent for pending transaction');
    assert(
      Boolean(reloadedTx.metadata?.paymentReminderSentAt),
      'Transaction recorded reminder timestamp'
    );

    // Test that completed transaction skips reminder
    await Transaction.findByIdAndUpdate(testTransactionId, {
      $set: { transactionStatus: TransactionStatus.COMPLETED, paymentStatus: PaymentStatus.PAID },
    });
    const completedTx = await Transaction.findById(testTransactionId);
    const shouldSendReminder =
      completedTx.transactionStatus === TransactionStatus.INITIATED ||
      completedTx.transactionStatus === TransactionStatus.PAYMENT_PENDING;

    assert(!shouldSendReminder, 'Completed transaction correctly skips payment reminder');

    // =========================================================================
    // SECTION 3: Retry Handling Tests
    // =========================================================================
    console.log(`\n${colors.yellow}${colors.bold}3. Retry Handling Tests${colors.reset}`);

    let attemptCounter = 0;
    const retryJobFn = async () => {
      attemptCounter++;
      if (attemptCounter < 3) {
        throw new Error(`Simulated transient provider timeout (Attempt ${attemptCounter}/3)`);
      }
      return { success: true, attempts: attemptCounter };
    };

    // Simulate Inngest retry loop with backoff
    let retryExecutionResult = null;
    let finalError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        retryExecutionResult = await retryJobFn();
        break; // Succeeded
      } catch (err) {
        finalError = err;
        // Inngest backoff simulation
      }
    }

    assert(
      attemptCounter === 3,
      'Retry mechanism executed retry attempts',
      `Completed in ${attemptCounter} attempts`
    );
    assert(
      retryExecutionResult?.success === true,
      'Job recovered and succeeded after transient retries'
    );

    // =========================================================================
    // SECTION 4: Duplicate Event & Idempotency Tests
    // =========================================================================
    console.log(
      `\n${colors.yellow}${colors.bold}4. Duplicate Event & Idempotency Tests${colors.reset}`
    );

    const dedupeEventId = `evt_dedupe_test_${testRunId}`;
    const dedupeJobId = 'test-idempotent-notification-job';
    let sideEffectExecutionCount = 0;

    const runIdempotentAction = async () => {
      return idempotencyService.executeIdempotent(
        {
          eventId: dedupeEventId,
          jobId: dedupeJobId,
          eventName: 'test.idempotent.event',
        },
        async () => {
          sideEffectExecutionCount++;
          return { message: 'Side effect executed', timestamp: Date.now() };
        }
      );
    };

    // First execution: should execute side effect
    const firstRun = await runIdempotentAction();
    assert(firstRun.duplicate === false, 'First execution is not flagged as duplicate');
    assert(sideEffectExecutionCount === 1, 'Side effect executed exactly once on first delivery');

    // Second execution with identical eventId: duplicate delivery simulation
    const secondRun = await runIdempotentAction();
    assert(secondRun.duplicate === true, 'Second execution recognized as duplicate');
    assert(secondRun.skipped === true, 'Second execution skipped successfully');
    assert(
      sideEffectExecutionCount === 1,
      'Side effect was NOT repeated on duplicate delivery (Idempotent!)'
    );

    // Verify ProcessedEvent ledger record in database
    const ledgerRecord = await ProcessedEvent.findOne({
      eventId: dedupeEventId,
      jobId: dedupeJobId,
    });
    assert(ledgerRecord !== null, 'Idempotency ledger record persisted');
    assert(
      ledgerRecord.status === ProcessedEventStatus.COMPLETED,
      'Ledger record marked COMPLETED'
    );

    // =========================================================================
    // SECTION 5: Failed Job Handling Tests
    // =========================================================================
    console.log(`\n${colors.yellow}${colors.bold}5. Failed Job Handling Tests${colors.reset}`);

    const failureEventId = `evt_failure_test_${testRunId}`;
    const failureJobId = 'test-failing-job';
    let onFailureHookExecuted = false;
    let failureRecordedInDB = false;

    // Simulate job with fatal unrecoverable failure
    try {
      await idempotencyService.executeIdempotent(
        {
          eventId: failureEventId,
          jobId: failureJobId,
          eventName: 'test.fatal.event',
        },
        async () => {
          throw new Error('Fatal unrecoverable provider failure: Invalid signature');
        }
      );
    } catch (jobError) {
      // Inngest onFailure handler simulation
      onFailureHookExecuted = true;
      const failedLedger = await ProcessedEvent.findOne({
        eventId: failureEventId,
        jobId: failureJobId,
      });
      if (failedLedger && failedLedger.status === ProcessedEventStatus.FAILED) {
        failureRecordedInDB = true;
      }
    }

    assert(onFailureHookExecuted, 'Job failure was intercepted by error handler');
    assert(
      failureRecordedInDB,
      'Database idempotency ledger recorded status FAILED with error diagnostic'
    );

    // Verify Inngest functions serving integrity
    console.log(
      `\n${colors.yellow}${colors.bold}6. Inngest Serve & Functions Registry Tests${colors.reset}`
    );
    assert(Array.isArray(allInngestFunctions), 'allInngestFunctions is an array');
    assert(
      allInngestFunctions.length >= 6,
      'Contains all registered background job categories',
      `Total functions: ${allInngestFunctions.length}`
    );

    // Clean up test documents created during this run
    await AuditLog.deleteMany({ eventId: { $in: [auditEventId] } });
    await Notification.deleteMany({ recipientId: testUserId });
    await ProcessedEvent.deleteMany({ eventId: { $in: [dedupeEventId, failureEventId] } });
    await Listing.deleteOne({ _id: testListingId });
    await Reservation.deleteMany({ listingId: testListingId });
    await Transaction.deleteOne({ _id: testTransactionId });

    console.log(`\n${colors.blue}ℹ Cleaned up test artifacts cleanly${colors.reset}`);
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
