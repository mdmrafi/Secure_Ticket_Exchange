import { z } from 'zod';

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    status: z.string().optional(),
    role: z.string().optional(),
    accountStatus: z.string().optional(),
    kycStatus: z.string().optional(),
    assetType: z.string().optional(),
    category: z.string().optional(),
    targetType: z.string().optional(),
    riskLevel: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    eventName: z.string().optional(),
    actorId: z.string().optional(),
  }),
});

export const suspendUserSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Suspension reason must be at least 5 characters long'),
  }),
});

export const unsuspendUserSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Unsuspension reason must be at least 5 characters long'),
  }),
});

export const suspendListingSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Listing suspension reason must be at least 5 characters long'),
  }),
});

export const approveVerificationSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    confidenceScore: z.number().min(0).max(100).optional(),
  }),
});

export const rejectVerificationSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Rejection reason must be at least 5 characters long'),
    notes: z.string().optional(),
  }),
});

export const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['INVESTIGATING', 'RESOLVED', 'DISMISSED']),
    notes: z.string().min(5, 'Resolution notes are required'),
  }),
});

export const freezeTransactionSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Freeze justification reason must be at least 5 characters long'),
  }),
});
