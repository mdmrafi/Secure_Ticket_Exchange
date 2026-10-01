import { Router } from 'express';
import { transferController } from './transfer.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  requestTransferSchema,
  checkEligibilitySchema,
  transferIdParamSchema,
  executeTransferSchema,
  rejectTransferSchema,
  cancelTransferSchema,
} from './transfer.validation.js';

const router = Router();

// Protected routes (Require authentication)
router.use(authenticate);

// Eligibility check
router.get(
  '/eligibility/:assetId',
  validate(checkEligibilitySchema),
  transferController.checkEligibility
);

// Create transfer request
router.post(
  '/',
  validate(requestTransferSchema),
  transferController.requestTransfer
);

// Get single transfer details and audit events
router.get(
  '/:id',
  validate(transferIdParamSchema),
  transferController.getTransferById
);

router.get(
  '/:id/events',
  validate(transferIdParamSchema),
  transferController.getTransferEvents
);

// Lifecycle actions
router.post(
  '/:id/approve',
  validate(transferIdParamSchema),
  transferController.approveTransfer
);

router.post(
  '/:id/execute',
  validate(executeTransferSchema),
  transferController.executeTransfer
);

router.post(
  '/:id/reject',
  validate(rejectTransferSchema),
  transferController.rejectTransfer
);

router.post(
  '/:id/cancel',
  validate(cancelTransferSchema),
  transferController.cancelTransfer
);

export const transferRoutes = router;
