import { Router } from 'express';
import { transactionController } from './transaction.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  initiateTransactionSchema,
  transactionIdParamSchema,
  processPaymentSchema,
  paymentCallbackSchema,
  cancelTransactionSchema,
  queryTransactionsSchema,
} from './transaction.validation.js';

const router = Router();

// Callback endpoint can be called by payment webhook or client
router.post(
  '/:id/callback',
  validate(paymentCallbackSchema),
  transactionController.callback
);

// Protected routes (Require authentication)
router.use(authenticate);

router.post('/', validate(initiateTransactionSchema), transactionController.initiate);
router.post('/initiate', validate(initiateTransactionSchema), transactionController.initiate);
router.get('/', validate(queryTransactionsSchema), transactionController.getMyTransactions);
router.get('/my', validate(queryTransactionsSchema), transactionController.getMyTransactions);

router.get('/:id', validate(transactionIdParamSchema), transactionController.getById);
router.get('/:id/events', validate(transactionIdParamSchema), transactionController.getEvents);

router.post('/:id/pay', validate(transactionIdParamSchema), transactionController.createPaymentSession);
router.post(
  '/:id/process-payment',
  validate(processPaymentSchema),
  transactionController.processPayment
);
router.post('/:id/transfer', validate(transactionIdParamSchema), transactionController.transfer);
router.post('/:id/cancel', validate(cancelTransactionSchema), transactionController.cancel);

export const transactionRoutes = router;
