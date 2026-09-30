import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Database
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/secure_asset_exchange'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(10),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().default(5000),

  // CORS & Client
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Auth
  AUTH_PROVIDER: z.enum(['jwt', 'clerk']).default('jwt'),
  JWT_SECRET: z.string().min(8).default('super_secret_jwt_encryption_key_change_in_production_min_32_chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_EXPIRES_IN: z.coerce.number().default(7),
  CLERK_SECRET_KEY: z.string().optional().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),

  // Inngest
  INNGEST_EVENT_KEY: z.string().default('local_dev_key'),
  INNGEST_SIGNING_KEY: z.string().optional().default(''),
  INNGEST_APP_ID: z.string().default('secure-asset-exchange'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Security
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables detected:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
