import http from 'http';
import { createApp } from './loaders/app.js';
import { initSocketIO, getSocketIO } from './loaders/socket.js';
import { connectDatabase, disconnectDatabase } from './config/db.config.js';
import { env } from './config/env.config.js';
import { logger } from './config/logger.config.js';
import { metricsService } from './modules/monitoring/metrics.service.js';

// Server bootstrap entry point
const startServer = async () => {
  // Initiate MongoDB connection
  connectDatabase().catch((err) => {
    logger.error({ err }, 'Initial MongoDB connection failed');
  });

  // Create Express app
  const app = createApp();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initSocketIO(httpServer);

  // Start listening
  const server = httpServer.listen(env.PORT, () => {
    logger.info(
      `🚀 Secure Asset Exchange Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
    logger.info(`🔗 API Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`🩺 Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    logger.info(`⚡ Socket.IO listening on port ${env.PORT}`);
    logger.info(`⚙️ Inngest endpoint available at http://localhost:${env.PORT}/api/inngest`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} signal received. Marking service as shutting down (readiness=false)...`);
    metricsService.setShuttingDown(true);

    // Give reverse proxies and load balancers a brief window to route around this instance
    const drainDelayMs = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging' ? 1500 : 100;
    await new Promise((resolve) => setTimeout(resolve, drainDelayMs));

    // Gracefully disconnect Socket.IO
    const io = getSocketIO();
    if (io) {
      try {
        io.close();
        logger.info('Socket.IO connections closed cleanly');
      } catch (ioErr) {
        logger.warn({ err: ioErr }, 'Warning closing Socket.IO connections');
      }
    }

    server.close(async () => {
      logger.info('HTTP server closed and in-flight requests drained');
      try {
        await disconnectDatabase();
        logger.info('Database connection closed cleanly');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful database disconnect');
        process.exit(1);
      }
    });

    // Force shutdown if taking longer than 15s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 15000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled Promise Rejection detected');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception detected');
    process.exit(1);
  });
};

startServer();
