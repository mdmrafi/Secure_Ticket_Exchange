import { Router } from 'express';
import { verificationController } from './verification.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { requestVerificationSchema } from './verification.validation.js';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/verification/request
 * @desc    Initiate asset verification request
 * @access  Private
 */
router.post('/request', validate(requestVerificationSchema), verificationController.requestVerification);

/**
 * @route   POST /api/v1/verification/railway/:assetId
 * @desc    Execute multi-layer VerificationEngine on a Railway Ticket
 * @access  Private (Owner/Admin)
 */
router.post('/railway/:assetId', verificationController.verifyRailway);
router.post('/verify/:assetId', verificationController.verifyRailway);

/**
 * @route   GET /api/v1/verification/status/:assetId
 * @desc    Get verification check history and status for an asset
 * @access  Private
 */
router.get('/status/:assetId', verificationController.getStatus);

export const verificationRoutes = router;
