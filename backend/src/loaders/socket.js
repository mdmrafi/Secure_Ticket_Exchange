import { Server as SocketIOServer } from 'socket.io';
import { corsOptions } from '../config/cors.config.js';
import { logger } from '../config/logger.config.js';

let ioInstance = null;

export const initSocketIO = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket client connected');

    // Authenticated user room join
    socket.on('user:join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug({ socketId: socket.id, userId }, 'User joined personal room');
      }
    });

    // Exchange transaction room join for real-time escrow chat & status updates
    socket.on('transaction:join', (transactionId) => {
      if (transactionId) {
        socket.join(`tx:${transactionId}`);
        logger.debug({ socketId: socket.id, transactionId }, 'User joined transaction room');
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket client disconnected');
    });
  });

  ioInstance = io;
  return io;
};

export const getSocketIO = () => {
  return ioInstance;
};
