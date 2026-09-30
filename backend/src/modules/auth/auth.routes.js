import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { authenticate } from './auth.middleware.js';
import { authRateLimiter } from '../../common/middlewares/rate-limiter.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export const authRoutes = router;
