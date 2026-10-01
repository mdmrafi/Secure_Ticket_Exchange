import { Router } from 'express';
import { getDbStatus } from '../config/db.config.js';
import { ApiResponse } from '../common/utils/api-response.js';
import { env } from '../config/env.config.js';
import { metricsService } from '../modules/monitoring/metrics.service.js';

const router = Router();

/**
 * Detailed Health Check
 * GET /health or GET /api/v1/health
 */
router.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  const snapshot = metricsService.getSnapshot();

  const healthData = {
    status: snapshot.status,
    service: 'secure-asset-exchange-api',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: snapshot.uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: snapshot.database,
    system: {
      memoryUsedMB: snapshot.memory.heapUsedMB,
      memoryTotalMB: snapshot.memory.heapTotalMB,
      rssMB: snapshot.memory.rssMB,
      nodeVersion: snapshot.process.nodeVersion,
      pid: snapshot.process.pid,
    },
    http: {
      totalRequests: snapshot.http.totalRequests,
      activeRequests: snapshot.http.activeRequests,
      averageDurationMs: snapshot.http.averageDurationMs,
    },
    sockets: snapshot.sockets,
  };

  const statusCode = dbStatus.isConnected && !metricsService.isShuttingDown ? 200 : 503;
  return ApiResponse.success(res, healthData, 'Health check completed', statusCode);
});

/**
 * Liveness Probe (Kubernetes / Docker container orchestrator)
 * GET /health/live or /health/liveness
 * Confirms the process event loop is alive.
 */
const livenessHandler = (req, res) => {
  return res.status(200).json({
    status: 'live',
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
};
router.get('/live', livenessHandler);
router.get('/liveness', livenessHandler);

/**
 * Readiness Probe (Kubernetes / Reverse Proxy traffic routing)
 * GET /health/ready or /health/readiness
 * Confirms whether the instance is ready to receive traffic (DB connected, not shutting down).
 */
const readinessHandler = (req, res) => {
  const dbStatus = getDbStatus();
  const isReady = dbStatus.isConnected && !metricsService.isShuttingDown;

  if (isReady) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'not_ready',
    reason: metricsService.isShuttingDown
      ? 'Instance is undergoing graceful shutdown'
      : `Database state is ${dbStatus.state}`,
    timestamp: new Date().toISOString(),
  });
};
router.get('/ready', readinessHandler);
router.get('/readiness', readinessHandler);

/**
 * Operational Metrics & Monitoring Hook
 * GET /health/metrics or GET /metrics
 * Exports Prometheus text format or JSON depending on Accept header.
 */
const metricsHandler = (req, res) => {
  const acceptHeader = req.headers['accept'] || '';

  if (acceptHeader.includes('text/plain')) {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.status(200).send(metricsService.getPrometheusFormat());
  }

  return res.status(200).json(metricsService.getSnapshot());
};
router.get('/metrics', metricsHandler);

export const healthRoutes = router;
