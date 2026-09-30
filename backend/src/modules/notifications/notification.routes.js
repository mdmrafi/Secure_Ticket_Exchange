import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export const notificationRoutes = router;
