import { Router } from 'express';
import { getDbStatus } from '../config/db.config.js';
import { ApiResponse } from '../common/utils/api-response.js';
import { env } from '../config/env.config.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  const memory = process.memoryUsage();

  const healthData = {
    status: dbStatus.isConnected ? 'healthy' : 'degraded',
    service: 'secure-asset-exchange-api',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      database: dbStatus.name,
    },
    system: {
      memoryUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
      pid: process.pid,
    },
  };

  const statusCode = dbStatus.isConnected ? 200 : 503;
  return ApiResponse.success(res, healthData, 'Health check completed', statusCode);
});

export const healthRoutes = router;
