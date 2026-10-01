import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { serve } from 'inngest/express';
import { env } from '../config/env.config.js';
import { corsOptions } from '../config/cors.config.js';
import { configureSecurityHeaders } from '../common/middlewares/security.middleware.js';
import { nosqlSanitizer } from '../common/middlewares/nosql-sanitize.middleware.js';
import { globalRateLimiter } from '../common/middlewares/rate-limiter.middleware.js';
import { requestLogger } from '../common/middlewares/request-logger.middleware.js';
import { errorHandler } from '../common/middlewares/error.middleware.js';
import { notFoundHandler } from '../common/middlewares/not-found.middleware.js';
import { apiRouter } from '../routes/index.js';
import { healthRoutes } from '../routes/health.routes.js';
import { inngest } from '../config/inngest.config.js';
import { allInngestFunctions } from '../jobs/functions/index.js';

export const createApp = () => {
  const app = express();

  // Trust reverse proxy (e.g. Nginx, Cloudflare)
  app.set('trust proxy', 1);

  // Security headers & basic protection
  app.use(...configureSecurityHeaders());

  // CORS
  app.use(cors(corsOptions));

  // Request compression
  app.use(compression());

  // Inngest background jobs endpoint
  app.use(
    '/api/inngest',
    serve({
      client: inngest,
      functions: allInngestFunctions,
    })
  );

  // Body parsers with defensive size limits (protection against large payload DoS)
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true, limit: '200kb' }));
  app.use(cookieParser());

  // NoSQL query injection sanitizer
  app.use(nosqlSanitizer);

  // Request logger
  app.use(requestLogger);

  // Global rate limiter for API routes
  app.use('/api', globalRateLimiter);

  // Root health check convenience route
  app.use('/health', healthRoutes);

  // Main API v1 routing
  app.use(env.API_PREFIX, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
