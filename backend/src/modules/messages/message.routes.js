import { Router } from 'express';
import { messageController } from './message.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { sendMessageSchema, getHistorySchema, messageIdParamSchema } from './message.validation.js';

const router = Router();

// Protected routes (Require authentication)
router.use(authenticate);

router.get('/history', validate(getHistorySchema), messageController.getHistory);
router.post('/', validate(sendMessageSchema), messageController.sendMessage);
router.patch('/:id/read', validate(messageIdParamSchema), messageController.markRead);

export const messageRoutes = router;
