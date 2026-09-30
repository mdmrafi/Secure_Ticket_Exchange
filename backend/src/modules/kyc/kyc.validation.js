import { z } from 'zod';
import { KYCDocumentType, KYCStatus } from './kyc.constant.js';

/**
 * Schema for initiating a KYC verification session: POST /api/v1/kyc/start
 */
export const startKYCSchema = z.object({
  body: z
    .object({
      documentType: z.nativeEnum(KYCDocumentType).optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional()
    .default({}),
});

/**
 * Schema for submitting synthetic KYC verification: POST /api/v1/kyc/submit
 * strictly requires synthetic identity data for development safety.
 */
export const submitKYCSchema = z.object({
  body: z.object({
    documentType: z.nativeEnum(KYCDocumentType, {
      errorMap: () => ({
        message: `documentType must be one of: ${Object.values(KYCDocumentType).join(', ')}`,
      }),
    }),
    syntheticData: z.object({
      firstName: z
        .string({ required_error: 'firstName is required' })
        .min(1, 'firstName cannot be empty')
        .max(50, 'firstName is too long')
        .trim(),
      lastName: z
        .string({ required_error: 'lastName is required' })
        .min(1, 'lastName cannot be empty')
        .max(50, 'lastName is too long')
        .trim(),
      dateOfBirth: z
        .string({ required_error: 'dateOfBirth is required (YYYY-MM-DD)' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be in YYYY-MM-DD format'),
      documentNumber: z
        .string({ required_error: 'documentNumber is required' })
        .min(4, 'documentNumber must be at least 4 characters')
        .max(50, 'documentNumber cannot exceed 50 characters')
        .trim(),
      countryCode: z
        .string()
        .length(2, 'countryCode must be a 2-letter ISO country code (e.g. BD, US)')
        .toUpperCase()
        .default('BD'),
      // Synthetic testing outcome flag (for automated testing of outcomes)
      testOutcome: z
        .enum([
          KYCStatus.VERIFIED,
          KYCStatus.REJECTED,
          KYCStatus.MANUAL_REVIEW,
          KYCStatus.EXPIRED,
          'REJECT',
        ])
        .optional(),
      rejectionReason: z.string().optional(),
    }),
  }),
});
