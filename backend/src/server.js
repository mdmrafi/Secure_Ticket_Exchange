import http from 'http';
import { createApp } from './loaders/app.js';
import { initSocketIO } from './loaders/socket.js';
import { connectDatabase, disconnectDatabase } from './config/db.config.js';
import { env } from './config/env.config.js';
import { logger } from './config/logger.config.js';

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
    logger.info(`${signal} signal received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP and WebSocket server closed');
      try {
        await disconnectDatabase();
        logger.info('Database connection closed cleanly');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful database disconnect');
        process.exit(1);
      }
    });

    // Force shutdown if taking longer than 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
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
