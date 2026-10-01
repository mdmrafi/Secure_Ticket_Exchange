import pino from 'pino';
import { env } from './env.config.js';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Automatic sensitive-data redaction to prevent accidental PII/secret leaks
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'encryptedIdentityData',
      'idNumber',
      'creditCard',
      'cardSecurityCode',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
