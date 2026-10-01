import mongoose from 'mongoose';
import { getDbStatus } from '../../config/db.config.js';
import { env } from '../../config/env.config.js';

/**
 * In-memory telemetry & metrics accumulator
 */
class MetricsService {
  constructor() {
    this.startTime = Date.now();
    this.httpRequestsTotal = 0;
    this.httpRequestsByStatus = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
    };
    this.httpRequestsByMethod = {};
    this.httpTotalResponseTimeMs = 0;
    this.activeHttpRequests = 0;
    this.activeSocketConnections = 0;
    this.isShuttingDown = false;
  }

  setShuttingDown(state = true) {
    this.isShuttingDown = state;
  }

  recordSocketConnect() {
    this.activeSocketConnections++;
  }

  recordSocketDisconnect() {
    this.activeSocketConnections = Math.max(0, this.activeSocketConnections - 1);
  }

  recordHttpRequestStart() {
    this.activeHttpRequests++;
    this.httpRequestsTotal++;
  }

  recordHttpRequestEnd(method, statusCode, durationMs) {
    this.activeHttpRequests = Math.max(0, this.activeHttpRequests - 1);
    this.httpTotalResponseTimeMs += durationMs;

    // Track by method
    const m = (method || 'GET').toUpperCase();
    this.httpRequestsByMethod[m] = (this.httpRequestsByMethod[m] || 0) + 1;

    // Track by status category
    const code = Number(statusCode) || 200;
    if (code >= 200 && code < 300) this.httpRequestsByStatus['2xx']++;
    else if (code >= 300 && code < 400) this.httpRequestsByStatus['3xx']++;
    else if (code >= 400 && code < 500) this.httpRequestsByStatus['4xx']++;
    else if (code >= 500) this.httpRequestsByStatus['5xx']++;
  }

  /**
   * Get metrics snapshot as JSON
   */
  getSnapshot() {
    const memory = process.memoryUsage();
    const db = getDbStatus();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTimeMs =
      this.httpRequestsTotal > 0
        ? Math.round(this.httpTotalResponseTimeMs / this.httpRequestsTotal)
        : 0;

    return {
      service: 'secure-asset-exchange-api',
      environment: env.NODE_ENV,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      status: this.isShuttingDown ? 'shutting_down' : db.isConnected ? 'healthy' : 'degraded',
      http: {
        totalRequests: this.httpRequestsTotal,
        activeRequests: this.activeHttpRequests,
        averageDurationMs: avgResponseTimeMs,
        byStatus: this.httpRequestsByStatus,
        byMethod: this.httpRequestsByMethod,
      },
      sockets: {
        activeConnections: this.activeSocketConnections,
      },
      database: {
        status: db.state,
        connected: db.isConnected,
        host: db.host,
        name: db.name,
      },
      memory: {
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        rssMB: Math.round(memory.rss / 1024 / 1024),
        externalMB: Math.round(memory.external / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
      },
    };
  }

  /**
   * Export metrics in Prometheus text exposition format
   */
  getPrometheusFormat() {
    const snap = this.getSnapshot();
    const lines = [
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${snap.uptimeSeconds}`,
      '',
      '# HELP nodejs_heap_size_used_bytes Process heap memory used in bytes',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${process.memoryUsage().heapUsed}`,
      '',
      '# HELP nodejs_heap_size_total_bytes Process heap memory allocated in bytes',
      '# TYPE nodejs_heap_size_total_bytes gauge',
      `nodejs_heap_size_total_bytes ${process.memoryUsage().heapTotal}`,
      '',
      '# HELP nodejs_rss_bytes Resident set size in bytes',
      '# TYPE nodejs_rss_bytes gauge',
      `nodejs_rss_bytes ${process.memoryUsage().rss}`,
      '',
      '# HELP http_requests_total Total number of HTTP requests processed',
      '# TYPE http_requests_total counter',
      `http_requests_total ${snap.http.totalRequests}`,
      '',
      '# HELP http_requests_active Current active HTTP requests being processed',
      '# TYPE http_requests_active gauge',
      `http_requests_active ${snap.http.activeRequests}`,
      '',
      '# HELP http_request_duration_ms_avg Average HTTP request duration in milliseconds',
      '# TYPE http_request_duration_ms_avg gauge',
      `http_request_duration_ms_avg ${snap.http.averageDurationMs}`,
      '',
      '# HELP websocket_active_connections Current active WebSocket connections',
      '# TYPE websocket_active_connections gauge',
      `websocket_active_connections ${snap.sockets.activeConnections}`,
      '',
      '# HELP database_connected MongoDB connection state (1 connected, 0 disconnected)',
      '# TYPE database_connected gauge',
      `database_connected ${snap.database.connected ? 1 : 0}`,
    ];

    for (const [statusRange, count] of Object.entries(snap.http.byStatus)) {
      lines.push(`http_requests_status_total{range="${statusRange}"} ${count}`);
    }

    for (const [method, count] of Object.entries(snap.http.byMethod)) {
      lines.push(`http_requests_by_method_total{method="${method}"} ${count}`);
    }

    return lines.join('\n') + '\n';
  }
}

export const metricsService = new MetricsService();
