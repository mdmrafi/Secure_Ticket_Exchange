import { env } from './env.config.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // Requests without origin header (mobile apps, server-to-server, curl, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      env.CORS_ORIGIN,
      env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development mode, allow any local dev server port (localhost/127.0.0.1),
    // but strictly reject external/untrusted domains (e.g. evil-attacker.com)
    if (env.NODE_ENV === 'development') {
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        // Fall through to error
      }
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};
