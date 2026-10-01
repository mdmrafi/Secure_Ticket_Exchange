import crypto from 'crypto';
import { logger } from '../../config/logger.config.js';
import { metricsService } from '../../modules/monitoring/metrics.service.js';

export const requestLogger = (req, res, next) => {
  // Extract or generate unique correlation ID for distributed tracing
  const requestId =
    req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Attach contextual child logger to request
  req.log = logger.child({ requestId });

  const start = Date.now();
  metricsService.recordHttpRequestStart();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.recordHttpRequestEnd(req.method, res.statusCode, duration);

    // Skip verbose logs for health/live/ready checks unless there's an error
    const isHealthCheck = req.originalUrl?.includes('/health');
    if (isHealthCheck && res.statusCode < 400) {
      return;
    }

    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP 5xx Server Error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP 4xx Client Warning');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
};
