import { z } from 'zod';

export const createListingSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
    price: z.number().positive('Price must be greater than zero'),
    isHighTrust: z.boolean().optional().default(false),
    notes: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const queryListingsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
});
