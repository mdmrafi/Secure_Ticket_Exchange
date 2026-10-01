import helmet from 'helmet';
import hpp from 'hpp';

/**
 * Configure comprehensive HTTP security headers
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options (DENY to prevent clickjacking)
 * - X-Content-Type-Options (nosniff to prevent MIME sniffing)
 * - Referrer-Policy
 * - HPP (HTTP Parameter Pollution) protection
 */
export const configureSecurityHeaders = () => {
  return [
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
      hidePoweredBy: true,
    }),
    hpp(),
  ];
};
