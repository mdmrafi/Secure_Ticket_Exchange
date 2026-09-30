import { z } from 'zod';

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['INVESTIGATING', 'RESOLVED', 'DISMISSED']),
    notes: z.string().min(5, 'Resolution notes are required'),
  }),
});
