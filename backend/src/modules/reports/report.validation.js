import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['USER', 'LISTING', 'TRANSACTION', 'ASSET']),
    targetId: z.string().min(1, 'Target ID is required'),
    category: z.enum(['FRAUD', 'SCAM', 'COUNTERFEIT', 'HARASSMENT', 'OTHER']).default('FRAUD'),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    description: z.string().optional(),
  }),
});
