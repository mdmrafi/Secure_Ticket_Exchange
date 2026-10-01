import { z } from 'zod';

export const initiateTransactionSchema = z.object({
  body: z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z
    .object({
      paymentSessionId: z.string().optional(),
      transactionRef: z.string().optional(),
      signature: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const processPaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z
    .object({
      outcome: z.enum(['SUCCESS', 'FAIL']).optional().default('SUCCESS'),
      failureReason: z.string().max(255).optional(),
    })
    .optional(),
});

export const paymentCallbackSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z
    .object({
      status: z.string().optional(),
      outcome: z.string().optional(),
      transactionRef: z.string().optional(),
      failureReason: z.string().nullable().optional(),
    })
    .passthrough(),
});

export const cancelTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z
    .object({
      reason: z.string().max(255).optional(),
    })
    .optional(),
});

export const queryTransactionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
