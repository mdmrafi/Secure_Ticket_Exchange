import { Router } from 'express';
import { kycController } from './kyc.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { startKYCSchema, submitKYCSchema } from './kyc.validation.js';

const router = Router();

// All KYC endpoints require an authenticated user
router.use(authenticate);

/**
 * @route   POST /api/v1/kyc/start
 * @desc    Start or initiate an identity verification session
 * @access  Private
 */
router.post('/start', validate(startKYCSchema), kycController.start);

/**
 * @route   POST /api/v1/kyc/submit
 * @desc    Submit synthetic identity documents for verification
 * @access  Private
 */
router.post('/submit', validate(submitKYCSchema), kycController.submit);

/**
 * @route   GET /api/v1/kyc/status
 * @desc    Retrieve the authenticated user's KYC verification status
 * @access  Private
 */
router.get('/status', kycController.getStatus);

/**
 * @route   GET /api/v1/kyc/status/:userId
 * @desc    Retrieve status for a specific user (enforces user ownership / admin RBAC)
 * @access  Private (Owner or ADMIN only)
 */
router.get('/status/:userId', kycController.getUserStatusById);

export const kycRoutes = router;
