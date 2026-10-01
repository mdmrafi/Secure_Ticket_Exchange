import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    API_PREFIX: z.string().default('/api/v1'),

    // Database
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/secure_asset_exchange'),
    MONGODB_MAX_POOL_SIZE: z.coerce.number().default(10),
    MONGODB_MIN_POOL_SIZE: z.coerce.number().default(2),
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().default(5000),

    // CORS & Client
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    CLIENT_URL: z.string().default('http://localhost:5173'),

    // Auth & Cookies
    AUTH_PROVIDER: z.enum(['jwt', 'clerk']).default('jwt'),
    JWT_SECRET: z
      .string()
      .min(8)
      .default('super_secret_jwt_encryption_key_change_in_production_min_32_chars'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(8)
      .default('super_secret_refresh_jwt_key_change_in_production_min_32_chars'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_COOKIE_EXPIRES_IN: z.coerce.number().default(7),
    COOKIE_SECURE: z.coerce.boolean().default(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    CLERK_SECRET_KEY: z.string().optional().default(''),
    CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),

    // Inngest
    INNGEST_EVENT_KEY: z.string().default('local_dev_key'),
    INNGEST_SIGNING_KEY: z.string().optional().default(''),
    INNGEST_APP_ID: z.string().default('secure-asset-exchange'),

    // Payment Gateway
    PAYMENT_PROVIDER: z.enum(['mock', 'stripe', 'sslcommerz']).default('mock'),
    PAYMENT_WEBHOOK_SECRET: z
      .string()
      .default('mock_payment_webhook_secret_key_32_bytes_min_exchange'),

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Rate Limiting & Security
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    TRUST_PROXY: z.coerce.boolean().default(true),

    // KYC (Identity Verification)
    KYC_PROVIDER: z.enum(['mock', 'external']).default('mock'),
    KYC_ENCRYPTION_KEY: z.string().default('super_secret_kyc_aes_gcm_encryption_key_32_bytes_min!'),
    KYC_EXPIRY_DAYS: z.coerce.number().default(365),
    KYC_EXTERNAL_API_KEY: z.string().optional().default(''),
    KYC_EXTERNAL_BASE_URL: z
      .string()
      .optional()
      .default('https://api.external-kyc-provider.com/v1'),

    // Observability & Metrics
    METRICS_ENABLED: z.coerce.boolean().default(true),
    METRICS_AUTH_TOKEN: z.string().default('dev_metrics_token_change_in_prod'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' || data.NODE_ENV === 'staging') {
      if (data.JWT_SECRET.includes('change_in_production') || data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'JWT_SECRET must be at least 32 characters and cannot use default dev placeholder in production/staging',
          path: ['JWT_SECRET'],
        });
      }
      if (
        data.JWT_REFRESH_SECRET.includes('change_in_production') ||
        data.JWT_REFRESH_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'JWT_REFRESH_SECRET must be at least 32 characters and cannot use default dev placeholder in production/staging',
          path: ['JWT_REFRESH_SECRET'],
        });
      }
      if (data.KYC_ENCRYPTION_KEY.includes('super_secret') || data.KYC_ENCRYPTION_KEY.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'KYC_ENCRYPTION_KEY must be at least 32 characters and cannot use default dev placeholder in production/staging',
          path: ['KYC_ENCRYPTION_KEY'],
        });
      }
    }

    if (data.NODE_ENV === 'production') {
      if (data.CORS_ORIGIN && !data.CORS_ORIGIN.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CORS_ORIGIN must use secure HTTPS in production environment',
          path: ['CORS_ORIGIN'],
        });
      }
      if (data.MONGODB_URI.includes('127.0.0.1') || data.MONGODB_URI.includes('localhost')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MONGODB_URI cannot point to localhost/127.0.0.1 in production environment',
          path: ['MONGODB_URI'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables detected:',
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
