import { Server as SocketIOServer } from 'socket.io';
import { corsOptions } from '../config/cors.config.js';
import { logger } from '../config/logger.config.js';
import { socketAuthMiddleware } from '../modules/messages/socket/socket-auth.middleware.js';
import { registerSocketHandler, isUserOnline } from '../modules/messages/socket/socket-handler.js';
import { metricsService } from '../modules/monitoring/metrics.service.js';

let ioInstance = null;

export const initSocketIO = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Strict Authentication Middleware (Verifies JWT and extracts identity)
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    metricsService.recordSocketConnect();
    logger.info(
      { socketId: socket.id, userId: socket.user?.userId },
      'Authenticated Socket.IO client connected'
    );

    // Register authenticated chat and presence handlers
    registerSocketHandler(io, socket);

    socket.on('disconnect', () => {
      metricsService.recordSocketDisconnect();
    });
  });

  ioInstance = io;
  return io;
};

export const getSocketIO = () => {
  return ioInstance;
};

export { isUserOnline };
