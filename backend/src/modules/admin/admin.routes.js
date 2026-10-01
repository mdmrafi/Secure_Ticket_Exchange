import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  paginationQuerySchema,
  suspendUserSchema,
  unsuspendUserSchema,
  suspendListingSchema,
  approveVerificationSchema,
  rejectVerificationSchema,
  resolveReportSchema,
  freezeTransactionSchema,
} from './admin.validation.js';

const router = Router();

// Base protection: All routes under /admin require valid authentication
router.use(authenticate);

// =========================================================================
// DASHBOARD APIS (OBSERVABILITY & MONITORING)
// Accessible by both ADMIN and MODERATOR
// =========================================================================
const modAccess = authorize('ADMIN', 'MODERATOR');

router.get('/metrics', modAccess, adminController.getOverview);

// 1. Users
router.get('/users', modAccess, validate(paginationQuerySchema), adminController.listUsers);
router.get('/users/:id', modAccess, adminController.getUserDetails);

// 2. KYC Reviews
router.get('/kyc', modAccess, validate(paginationQuerySchema), adminController.listKYCReviews);
router.get('/kyc/:id', modAccess, adminController.getKYCDetails);

// 3. Assets
router.get('/assets', modAccess, validate(paginationQuerySchema), adminController.listAssets);
router.get('/assets/:id', modAccess, adminController.getAssetDetails);

// 4. Listings
router.get('/listings', modAccess, validate(paginationQuerySchema), adminController.listListings);
router.get('/listings/:id', modAccess, adminController.getListingDetails);

// 5. Transactions
router.get(
  '/transactions',
  modAccess,
  validate(paginationQuerySchema),
  adminController.listTransactions
);
router.get('/transactions/:id', modAccess, adminController.getTransactionDetails);

// 6. Reports
router.get('/reports', modAccess, validate(paginationQuerySchema), adminController.listReports);
router.get('/reports/:id', modAccess, adminController.getReportDetails);

// 7. Fraud Alerts
router.get(
  '/fraud-alerts',
  modAccess,
  validate(paginationQuerySchema),
  adminController.listFraudAlerts
);
router.get('/fraud-alerts/:id', modAccess, adminController.getFraudAlertDetails);

// 8. Audit Logs
router.get(
  '/audit-logs',
  modAccess,
  validate(paginationQuerySchema),
  adminController.listAuditLogs
);
router.get('/audit-logs/:id', modAccess, adminController.getAuditLogDetails);

// Verifications queue
router.get(
  '/verification-reviews',
  modAccess,
  validate(paginationQuerySchema),
  adminController.listVerifications
);

// =========================================================================
// MODERATION ACTIONS (ADMIN & MODERATOR)
// =========================================================================

// Suspend listing
router.patch(
  '/listings/:id/suspend',
  modAccess,
  validate(suspendListingSchema),
  adminController.suspendListing
);

// Approve manual verification
router.patch(
  '/verification/:id/approve',
  modAccess,
  validate(approveVerificationSchema),
  adminController.approveManualVerification
);

// Reject verification
router.patch(
  '/verification/:id/reject',
  modAccess,
  validate(rejectVerificationSchema),
  adminController.rejectVerification
);

// Resolve report
router.patch(
  '/reports/:id/resolve',
  modAccess,
  validate(resolveReportSchema),
  adminController.resolveReport
);

// =========================================================================
// HIGH-IMPACT ADMINISTRATIVE ACTIONS (STRICTLY ADMIN ONLY)
// MODERATOR access will be rejected with 403 Forbidden
// =========================================================================
const adminOnly = authorize('ADMIN');

// Suspend user account
router.patch(
  '/users/:id/suspend',
  adminOnly,
  validate(suspendUserSchema),
  adminController.suspendUser
);

// Unsuspend user account
router.patch(
  '/users/:id/unsuspend',
  adminOnly,
  validate(unsuspendUserSchema),
  adminController.unsuspendUser
);

// Freeze financial transaction
router.patch(
  '/transactions/:id/freeze',
  adminOnly,
  validate(freezeTransactionSchema),
  adminController.freezeTransaction
);

export const adminRoutes = router;
