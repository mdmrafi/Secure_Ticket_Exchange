import { Router } from 'express';
import { transactionController } from './transaction.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { initiateTransactionSchema, queryTransactionsSchema } from './transaction.validation.js';

const router = Router();

router.use(authenticate);

router.post('/initiate', validate(initiateTransactionSchema), transactionController.initiate);
router.get('/my', validate(queryTransactionsSchema), transactionController.getMyTransactions);
router.get('/:id', transactionController.getById);

export const transactionRoutes = router;
