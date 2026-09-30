import { Router } from 'express';
import { verificationController } from './verification.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { requestVerificationSchema } from './verification.validation.js';

const router = Router();

router.use(authenticate);

router.post('/request', validate(requestVerificationSchema), verificationController.requestVerification);
router.get('/status/:assetId', verificationController.getStatus);

export const verificationRoutes = router;
