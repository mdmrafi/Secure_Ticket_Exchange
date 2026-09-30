import { z } from 'zod';

export const initiateTransactionSchema = z.object({
  body: z.object({
    listingId: z.string().min(1, 'Listing ID is required'),
  }),
});

export const queryTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
