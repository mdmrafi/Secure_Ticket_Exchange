import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { updateUserProfileSchema, queryUsersSchema } from './user.validation.js';

const router = Router();

// Protected user routes
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateUserProfileSchema), userController.updateProfile);

// Admin-only listing route
router.get('/', authorize('ADMIN'), validate(queryUsersSchema), userController.listUsers);

export const userRoutes = router;
