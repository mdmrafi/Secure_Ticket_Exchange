import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/modules/users/user.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Listing } from '../src/modules/listings/listing.model.js';
import { Transaction } from '../src/modules/transactions/transaction.model.js';
import { Report } from '../src/modules/reports/report.model.js';
import { FraudAssessment } from '../src/modules/fraud/fraud-assessment.model.js';
import { fraudDetectionEngine } from '../src/modules/fraud/engine/fraud-detection.engine.js';
import { fraudService } from '../src/modules/fraud/fraud.service.js';
import {
  RiskLevel,
  FraudSignalCode,
  AssessmentStatus,
  ReviewDecisionType,
} from '../src/modules/fraud/constants/fraud.constant.js';
import {
  AssetTypes,
  AssetStatus,
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
  console.log(`     FRAUD DETECTION & EXPLAINABLE SIGNALS SUITE`);
  console.log(`======================================================${colors.reset}\n`);
  console.log(`Target API URL: ${BASE_URL}\n`);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`${colors.blue}Connected to MongoDB Atlas replica set.${colors.reset}\n`);

  await FraudAssessment.syncIndexes();

  const timestamp = Date.now();
  let adminUser, normalUser, suspiciousUser;
  let tokenAdmin, tokenNormal;
  let cleanAsset, highRiskAsset;

  try {
    // -----------------------------------------------------------------
    // SETUP: Users
    // -----------------------------------------------------------------
    console.log(`${colors.yellow}[SETUP] Creating test users and assets...${colors.reset}`);

    adminUser = await User.create({
      name: 'Fraud Admin Chief',
      email: `fraud.admin.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 100,
    });
    tokenAdmin = generateToken(adminUser);

    normalUser = await User.create({
      name: 'Clean Seller Sam',
      email: `fraud.seller.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'ACTIVE',
      kycStatus: 'VERIFIED',
      trustScore: 92,
    });
    tokenNormal = generateToken(normalUser);

    suspiciousUser = await User.create({
      name: 'Suspicious User Syd',
      email: `fraud.suspicious.${timestamp}@example.com`,
      passwordHash: 'dummy_hash',
      role: 'USER',
      accountStatus: 'PENDING',
      kycStatus: 'NOT_STARTED',
      trustScore: 35,
    });


    cleanAsset = await Asset.create({
      ownerId: normalUser._id,
      assetType: AssetTypes.EVENT_TICKET,
      status: AssetStatus.VERIFIED,
      verificationStatus: VerificationStatus.VERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `FRAUD-CLEAN-${timestamp}`,
      title: 'Grand Symphony Concert 2026',
      originalValue: 2000,
      currency: 'BDT',
      metadata: {
        eventName: 'Grand Symphony',
        journeyDate: '2026-11-20',
        passengerName: 'Clean Seller Sam',
      },
      extractedFields: {
        eventName: 'Grand Symphony',
        journeyDate: '2026-11-20',
        passengerName: 'Clean Seller Sam',
      },
    });

    highRiskAsset = await Asset.create({
      ownerId: suspiciousUser._id,
      assetType: AssetTypes.RAILWAY_TICKET,
      status: AssetStatus.DRAFT,
      verificationStatus: VerificationStatus.UNVERIFIED,
      isTransferable: true,
      uniqueAssetIdentifier: `FRAUD-HIGHRISK-${timestamp}`,
      title: 'High Risk Train Ticket',
      originalValue: 1800,
      currency: 'BDT',
      metadata: {
        pnr: `PNR-RISK-${timestamp}`,
        passengerName: 'Declared Name Bob',
      },
      extractedFields: {
        pnr: `PNR-RISK-${timestamp}`,
        passengerName: 'Conflicting OCR Name Alice', // Conflict!
      },
    });

    console.log(`${colors.green}Test fixtures initialized successfully.${colors.reset}\n`);

    // -----------------------------------------------------------------
    // Part 1: Testing Each of the 10 Fraud Signals Independently
    // -----------------------------------------------------------------
    console.log(`${colors.bold}Part 1: Independent Testing of All 10 Explainable Fraud Signals${colors.reset}`);

    // SIGNAL 1: Repeated Listing of Same Asset
    const s1 = await fraudDetectionEngine.checkRepeatedListing(cleanAsset, {
      testRepeatedListing: true,
      repeatedListingCount: 4,
    });
    assert(s1.code === FraudSignalCode.REPEATED_LISTING_SAME_ASSET, 'Signal 1 Code matches REPEATED_LISTING_SAME_ASSET');
    assert(s1.triggered === true, 'Signal 1 triggered when duplicate listings exist');
    assert(s1.severity === RiskLevel.HIGH, 'Signal 1 severity is HIGH');
    assert(typeof s1.explanation === 'string' && s1.explanation.includes('4 times'), 'Signal 1 provides human-readable explanation with count');
    assert(s1.evidence.duplicateCount === 4, 'Signal 1 evidence captures duplicateCount');

    // SIGNAL 2: Suspicious Account Activity
    const s2 = await fraudDetectionEngine.checkSuspiciousAccountActivity(suspiciousUser, {
      testSuspiciousAccount: true,
    });
    assert(s2.code === FraudSignalCode.SUSPICIOUS_ACCOUNT_ACTIVITY, 'Signal 2 Code matches SUSPICIOUS_ACCOUNT_ACTIVITY');
    assert(s2.triggered === true, 'Signal 2 triggered for suspicious/unverified account');
    assert(s2.severity === RiskLevel.MEDIUM || s2.severity === RiskLevel.HIGH, 'Signal 2 severity is MEDIUM/HIGH');
    assert(s2.explanation.includes('unverified KYC') || s2.explanation.includes('account was created'), 'Signal 2 explains account activity context');
    assert(Boolean(s2.evidence.accountAgeHours || s2.evidence.kycStatus), 'Signal 2 evidence captures account age / KYC details');

    // SIGNAL 3: Excessive Cancellations
    const s3 = await fraudDetectionEngine.checkExcessiveCancellations(suspiciousUser, {
      testExcessiveCancellations: true,
      cancellationCount: 5,
      totalTransactions: 7,
    });
    assert(s3.code === FraudSignalCode.EXCESSIVE_CANCELLATIONS, 'Signal 3 Code matches EXCESSIVE_CANCELLATIONS');
    assert(s3.triggered === true, 'Signal 3 triggered for high cancellation ratio');
    assert(s3.severity === RiskLevel.HIGH, 'Signal 3 severity is HIGH');
    assert(s3.explanation.includes('5 out of 7') && s3.explanation.includes('threshold'), 'Signal 3 explains cancellation ratio and benchmark');
    assert(s3.evidence.cancellations === 5, 'Signal 3 evidence contains cancellation metrics');

    // SIGNAL 4: Multiple Failed Transactions
    const s4 = await fraudDetectionEngine.checkMultipleFailedTransactions(suspiciousUser, cleanAsset, {
      testMultipleFailedTransactions: true,
      failedCount: 4,
    });
    assert(s4.code === FraudSignalCode.MULTIPLE_FAILED_TRANSACTIONS, 'Signal 4 Code matches MULTIPLE_FAILED_TRANSACTIONS');
    assert(s4.triggered === true, 'Signal 4 triggered for recurring payment failures');
    assert(s4.severity === RiskLevel.HIGH || s4.severity === RiskLevel.CRITICAL, 'Signal 4 severity is HIGH/CRITICAL');
    assert(s4.explanation.includes('4 failed payment/transaction attempts'), 'Signal 4 explains failed attempt counts');
    assert(s4.evidence.failedCount === 4, 'Signal 4 evidence captures failedCount');

    // SIGNAL 5: Duplicate Document Fingerprints
    const s5 = await fraudDetectionEngine.checkDuplicateDocumentFingerprints(cleanAsset, {
      testDuplicateFingerprint: true,
      testHash: 'abcdef0123456789abcdef0123456789',
    });
    assert(s5.code === FraudSignalCode.DUPLICATE_DOCUMENT_FINGERPRINTS, 'Signal 5 Code matches DUPLICATE_DOCUMENT_FINGERPRINTS');
    assert(s5.triggered === true, 'Signal 5 triggered for matching document cryptographic hash');
    assert(s5.severity === RiskLevel.CRITICAL, 'Signal 5 severity is CRITICAL');
    assert(s5.explanation.includes('SHA-256 fingerprint'), 'Signal 5 explains fingerprint collision');
    assert(Boolean(s5.evidence.fileHash), 'Signal 5 evidence includes fileHash');

    // SIGNAL 6: OCR Inconsistencies
    const s6 = await fraudDetectionEngine.checkOcrInconsistencies(highRiskAsset, {
      testOcrInconsistency: true,
    });
    assert(s6.code === FraudSignalCode.OCR_INCONSISTENCIES, 'Signal 6 Code matches OCR_INCONSISTENCIES');
    assert(s6.triggered === true, 'Signal 6 triggered when OCR conflicts with metadata');
    assert(s6.severity === RiskLevel.MEDIUM || s6.severity === RiskLevel.HIGH, 'Signal 6 severity is MEDIUM/HIGH');
    assert(s6.explanation.includes('conflicts with ticket metadata'), 'Signal 6 explains conflicting extracted fields');
    assert(Boolean(s6.evidence.ocrPassengerName || s6.evidence.declaredPassengerName), 'Signal 6 evidence details conflicting values');

    // SIGNAL 7: Ticket Verification Mismatch
    const s7 = await fraudDetectionEngine.checkTicketVerificationMismatch(highRiskAsset, {
      testVerificationMismatch: true,
    });
    assert(s7.code === FraudSignalCode.TICKET_VERIFICATION_MISMATCH, 'Signal 7 Code matches TICKET_VERIFICATION_MISMATCH');
    assert(s7.triggered === true, 'Signal 7 triggered on authority mismatch');
    assert(s7.severity === RiskLevel.CRITICAL, 'Signal 7 severity is CRITICAL');
    assert(s7.explanation.includes('Official transport authority'), 'Signal 7 explains authority provider rejection');
    assert(Boolean(s7.evidence.verificationStatus), 'Signal 7 evidence captures verification status');

    // SIGNAL 8: Abnormal Listing Frequency
    const s8 = await fraudDetectionEngine.checkAbnormalListingFrequency(suspiciousUser, {
      testAbnormalFrequency: true,
      recentListingsCount: 9,
    });
    assert(s8.code === FraudSignalCode.ABNORMAL_LISTING_FREQUENCY, 'Signal 8 Code matches ABNORMAL_LISTING_FREQUENCY');
    assert(s8.triggered === true, 'Signal 8 triggered on burst listing frequency');
    assert(s8.severity === RiskLevel.MEDIUM || s8.severity === RiskLevel.HIGH, 'Signal 8 severity is MEDIUM/HIGH');
    assert(s8.explanation.includes('9 listings within a 1-hour window'), 'Signal 8 explains velocity count and timeframe');
    assert(s8.evidence.listingsInHour === 9, 'Signal 8 evidence records burst counts');

    // SIGNAL 9: Reported Account
    const s9 = await fraudDetectionEngine.checkReportedAccount(suspiciousUser, {
      testReportedAccount: true,
      reportCount: 3,
    });
    assert(s9.code === FraudSignalCode.REPORTED_ACCOUNT, 'Signal 9 Code matches REPORTED_ACCOUNT');
    assert(s9.triggered === true, 'Signal 9 triggered when active user reports exist');
    assert(s9.severity === RiskLevel.HIGH || s9.severity === RiskLevel.CRITICAL, 'Signal 9 severity is HIGH');
    assert(s9.explanation.includes('3 active unresolved fraud'), 'Signal 9 explains unresolved community reports');
    assert(s9.evidence.activeReports === 3, 'Signal 9 evidence captures active reports count');

    // SIGNAL 10: Document Tampering Indicators
    const s10 = await fraudDetectionEngine.checkDocumentTamperingIndicators(highRiskAsset, {
      testDocumentTampering: true,
      editingTool: 'Adobe Photoshop CC',
    });
    assert(s10.code === FraudSignalCode.DOCUMENT_TAMPERING_INDICATORS, 'Signal 10 Code matches DOCUMENT_TAMPERING_INDICATORS');
    assert(s10.triggered === true, 'Signal 10 triggered on digital forensics editing artifact');
    assert(s10.severity === RiskLevel.CRITICAL, 'Signal 10 severity is CRITICAL');
    assert(s10.explanation.includes('Adobe Photoshop CC') || s10.explanation.includes('graphic editing software'), 'Signal 10 explains tampering signature');
    assert(s10.evidence.hasTamperArtifacts === true, 'Signal 10 evidence contains forensic artifacts');

    // -----------------------------------------------------------------
    // Part 2: Clean Asset Assessment (LOW Risk & Explainability)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Part 2: Clean Asset Evaluation (LOW Risk & Full Explainability)${colors.reset}`);

    const cleanEvaluation = await fraudDetectionEngine.evaluate({
      asset: cleanAsset,
      user: normalUser,
    });

    assert(cleanEvaluation.riskLevel === RiskLevel.LOW, 'Clean asset evaluates to RiskLevel.LOW');
    assert(cleanEvaluation.overallScore < 20, 'Overall score for clean asset is under 20');
    assert(cleanEvaluation.recommendedAction === 'APPROVE', 'Recommended action is APPROVE');
    assert(cleanEvaluation.individualSignals.length === 10, 'All 10 individual signals are evaluated');
    assert(cleanEvaluation.individualSignals.every((s) => s.triggered === false), 'Zero signals triggered for clean asset');
    assert(
      cleanEvaluation.summaryExplanation.includes('Evaluation passed clean across all 10 fraud signals'),
      'Explainable summary clearly justifies LOW risk rating'
    );

    // -----------------------------------------------------------------
    // Part 3: High-Risk Asset -> MANUAL_REVIEW (Not Permanent Ban)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Part 3: High-Risk Asset Policy (MANUAL_REVIEW Routing, NOT Permanent Ban)${colors.reset}`);

    // Trigger high-risk assessment with multiple signals
    const highRiskAssessment = await fraudService.assessAsset(highRiskAsset._id, {
      testOcrInconsistency: true,
      testRepeatedListing: true,
      testDuplicateFingerprint: true,
    });

    assert(
      highRiskAssessment.riskLevel === RiskLevel.HIGH || highRiskAssessment.riskLevel === RiskLevel.CRITICAL,
      'High-risk asset evaluates to HIGH or CRITICAL risk'
    );
    assert(
      highRiskAssessment.recommendedAction === 'MANUAL_REVIEW',
      'Recommended action is explicitly MANUAL_REVIEW'
    );
    assert(
      highRiskAssessment.status === AssessmentStatus.PENDING_REVIEW,
      'Assessment status is PENDING_REVIEW for human admin adjudication'
    );
    assert(
      highRiskAssessment.summaryExplanation.includes('MANUAL_REVIEW'),
      'Summary explanation explains the grounds for MANUAL_REVIEW'
    );

    // CRITICAL REQUIREMENT VERIFICATION:
    // "High-risk assets should enter MANUAL_REVIEW rather than automatically being permanently banned."
    const refreshedAsset = await Asset.findById(highRiskAsset._id);
    assert(
      refreshedAsset.verificationStatus === VerificationStatus.MANUAL_REVIEW,
      'Asset verificationStatus entered MANUAL_REVIEW in database (not banned/rejected)'
    );
    assert(
      refreshedAsset.status !== AssetStatus.CANCELLED && refreshedAsset.status !== AssetStatus.REJECTED,
      'Asset was NOT permanently cancelled or rejected automatically'
    );

    // -----------------------------------------------------------------
    // Part 4: Admin Review APIs (List, Inspect, Resolve)
    // -----------------------------------------------------------------
    console.log(`\n${colors.bold}Part 4: Admin Review APIs (Listing, Detail & Adjudication)${colors.reset}`);

    // 1. Unauthorized access protection (non-admin forbidden)
    const unauthList = await apiCall('/admin/fraud/assessments', 'GET', null, tokenNormal);
    assert(unauthList.status === 403, 'Non-admin accessing /admin/fraud/assessments rejected with 403 Forbidden');

    // 2. Admin lists assessments
    const adminList = await apiCall('/admin/fraud/assessments', 'GET', null, tokenAdmin);
    assert(adminList.status === 200, 'GET /admin/fraud/assessments returns 200 OK for Admin');
    assert(Array.isArray(adminList.body?.data?.assessments), 'Returns assessments array');
    assert(adminList.body?.data?.assessments?.length > 0, 'Contains newly evaluated assessment');

    // 3. Admin gets single assessment details with individual signals
    const assessmentId = highRiskAssessment._id.toString();
    const adminDetail = await apiCall(`/admin/fraud/assessments/${assessmentId}`, 'GET', null, tokenAdmin);
    assert(adminDetail.status === 200, 'GET /admin/fraud/assessments/:id returns 200 OK');
    assert(adminDetail.body?.data?.individualSignals?.length === 10, 'Details include all 10 individual signals');
    assert(Boolean(adminDetail.body?.data?.summaryExplanation), 'Details include synthesized summary explanation');

    // 4. Admin submits review resolution decision (APPROVE after verification)
    const reviewRes = await apiCall(`/admin/fraud/assessments/${assessmentId}/review`, 'POST', {
      decision: ReviewDecisionType.APPROVE,
      notes: 'Investigated by Admin Dave: Seller provided original purchase receipt, cleared OCR ambiguity.',
    }, tokenAdmin);

    assert(reviewRes.status === 200, 'POST /admin/fraud/assessments/:id/review returns 200 OK');
    assert(reviewRes.body?.data?.status === AssessmentStatus.RESOLVED, 'Assessment status updated to RESOLVED');
    assert(reviewRes.body?.data?.reviewDecision?.decision === ReviewDecisionType.APPROVE, 'reviewDecision.decision recorded as APPROVE');
    assert(
      reviewRes.body?.data?.reviewDecision?.notes.includes('cleared OCR ambiguity'),
      'reviewDecision.notes recorded'
    );

    // Verify Asset status cleared to VERIFIED after admin approval
    const resolvedAsset = await Asset.findById(highRiskAsset._id);
    assert(
      resolvedAsset.verificationStatus === VerificationStatus.VERIFIED,
      'Asset status updated to VERIFIED after admin APPROVE resolution'
    );

    // 5. Admin review with REJECT_ASSET decision on a second assessment
    const secondAssessment = await fraudService.assessAsset(cleanAsset._id, {
      testDocumentTampering: true,
      testVerificationMismatch: true,
    });

    const rejectReviewRes = await apiCall(`/admin/fraud/assessments/${secondAssessment._id}/review`, 'POST', {
      decision: ReviewDecisionType.REJECT_ASSET,
      notes: 'Confirmed digital tampering of seat number in PDF header.',
    }, tokenAdmin);

    assert(rejectReviewRes.status === 200, 'Admin can reject fraudulent asset (200 OK)');
    assert(rejectReviewRes.body?.data?.reviewDecision?.decision === ReviewDecisionType.REJECT_ASSET, 'Decision is REJECT_ASSET');

    const rejectedAsset = await Asset.findById(cleanAsset._id);
    assert(
      rejectedAsset.status === AssetStatus.REJECTED,
      'Asset status transitioned to REJECTED following admin reject resolution'
    );

    // 6. Test on-demand admin assessment trigger API
    const triggerRes = await apiCall('/admin/fraud/assess', 'POST', {
      assetId: highRiskAsset._id.toString(),
      context: { testExcessiveCancellations: true },
    }, tokenAdmin);

    assert(triggerRes.status === 201, 'POST /admin/fraud/assess triggers on-demand evaluation (201 Created)');
    assert(Boolean(triggerRes.body?.data?._id), 'Returns newly generated assessment ID');

  } catch (error) {
    console.error(`\n${colors.red}Unhandled error during tests:${colors.reset}`, error);
    failedCount++;
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log(`\n${colors.yellow}[CLEANUP] Cleaning up test fixtures...${colors.reset}`);
    try {
      const emailFilter = { email: { $regex: `^fraud\\..*\\.${timestamp}@example.com$` } };
      await User.deleteMany(emailFilter);
      await Asset.deleteMany({ uniqueAssetIdentifier: { $regex: `^FRAUD-.*-${timestamp}` } });
      await FraudAssessment.deleteMany({ targetId: { $in: [cleanAsset?._id, highRiskAsset?._id] } });
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
