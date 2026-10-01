import { messageService } from '../message.service.js';
import { logger } from '../../../config/logger.config.js';

// Global In-Memory Presence Tracker: Map<userId, Set<socketId>>
export const userSocketMap = new Map();

/**
 * Check if a user is currently online
 * @param {string} userId
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  if (!userId) return false;
  const sockets = userSocketMap.get(userId.toString());
  return Boolean(sockets && sockets.size > 0);
};

/**
 * Register all authenticated Socket.IO events and room handlers
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerSocketHandler = (io, socket) => {
  const userId = socket.user.userId;
  const userRole = socket.user.role || 'USER';

  // 1. Online Presence Tracking
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  const isFirstConnection = userSocketMap.get(userId).size === 0;
  userSocketMap.get(userId).add(socket.id);

  // Automatically join personal user notifications room
  socket.join(`user:${userId}`);

  if (isFirstConnection) {
    logger.info({ userId, socketId: socket.id }, 'User connected (Status: ONLINE)');
    io.emit('user:online', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Query Online Status
  socket.on('user:status', ({ targetUserId }, callback) => {
    const online = isUserOnline(targetUserId);
    if (typeof callback === 'function') {
      callback({ userId: targetUserId, online });
    }
  });

  // 3. Room Joining with Strict Context Authorization
  socket.on('room:join', async ({ roomId }, callback) => {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      // Authorization verification (NEVER client-supplied identity)
      const auth = await messageService.verifyRoomAuthorization(roomId, userId, userRole);

      socket.join(roomId);
      logger.debug(
        { userId, socketId: socket.id, roomId },
        'User joined authorized conversation room'
      );

      socket.to(roomId).emit('room:user_joined', {
        userId,
        roomId,
        timestamp: new Date().toISOString(),
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          roomId,
          authorized: true,
          contextType: auth.contextType,
          contextId: auth.contextId,
        });
      }
    } catch (error) {
      logger.warn(
        { userId, socketId: socket.id, roomId, err: error.message },
        'Unauthorized room join attempt blocked'
      );
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: error.message || 'Unauthorized: Cannot join this conversation',
        });
      } else {
        socket.emit('error', {
          code: 'ROOM_ACCESS_DENIED',
          message: error.message || 'Unauthorized to access room',
        });
      }
    }
  });

  // 4. Room Leaving
  socket.on('room:leave', ({ roomId }, callback) => {
    if (roomId) {
      socket.leave(roomId);
      socket.to(roomId).emit('room:user_left', {
        userId,
        roomId,
        timestamp: new Date().toISOString(),
      });
      if (typeof callback === 'function') {
        callback({ success: true, roomId });
      }
    }
  });

  // 5. Message Sending & Delivery
  socket.on('message:send', async (data, callback) => {
    try {
      const { roomId, content, recipientId, metadata } = data || {};

      if (!roomId || !content) {
        throw new Error('roomId and content are required');
      }

      // Check if recipient is currently online (for immediate delivery flag)
      const isRecipientConnected = recipientId ? isUserOnline(recipientId) : false;

      // Persist in MongoDB with strictly derived sender identity
      const savedMessage = await messageService.sendMessage(
        { roomId, content, recipientId, metadata },
        userId,
        userRole,
        isRecipientConnected
      );

      // Broadcast to all other sockets in the room
      socket.to(roomId).emit('message:received', {
        message: savedMessage,
      });

      // Also deliver to recipient's personal user room if specified
      if (savedMessage.recipientId) {
        const targetId = savedMessage.recipientId._id
          ? savedMessage.recipientId._id.toString()
          : savedMessage.recipientId.toString();

        io.to(`user:${targetId}`).emit('message:notify', {
          message: savedMessage,
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          message: savedMessage,
        });
      }
    } catch (error) {
      logger.warn({ userId, err: error.message }, 'Failed to send socket message');
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: error.message || 'Failed to send message',
        });
      } else {
        socket.emit('error', {
          code: 'MESSAGE_SEND_FAILED',
          message: error.message,
        });
      }
    }
  });

  // 6. Typing Indicators
  socket.on('typing:start', async ({ roomId }) => {
    try {
      if (roomId) {
        await messageService.verifyRoomAuthorization(roomId, userId, userRole);
        socket.to(roomId).emit('typing:start', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore unauthorized typing events silently
    }
  });

  socket.on('typing:stop', async ({ roomId }) => {
    try {
      if (roomId) {
        socket.to(roomId).emit('typing:stop', {
          userId,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore
    }
  });

  // 7. Read Receipt Handling
  socket.on('message:read', async ({ messageId, roomId }, callback) => {
    try {
      if (!messageId) {
        throw new Error('messageId is required');
      }

      const updatedMessage = await messageService.markRead(messageId, userId);

      if (roomId) {
        socket.to(roomId).emit('message:read', {
          messageId,
          roomId,
          readBy: userId,
          readAt: updatedMessage.readAt || new Date().toISOString(),
        });
      }

      if (typeof callback === 'function') {
        callback({
          success: true,
          messageId,
          readAt: updatedMessage.readAt,
        });
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // 8. Message History Retrieval
  socket.on('message:history', async ({ roomId, page = 1, limit = 50 }, callback) => {
    try {
      if (!roomId) {
        throw new Error('roomId is required to fetch history');
      }

      const history = await messageService.getMessageHistory(roomId, userId, userRole, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      if (typeof callback === 'function') {
        callback({
          success: true,
          ...history,
        });
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: error.message || 'Unauthorized or failed to fetch message history',
        });
      }
    }
  });

  // 9. Disconnect Handling & Presence Cleanup
  socket.on('disconnect', (reason) => {
    const userSockets = userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
        logger.info({ userId, socketId: socket.id, reason }, 'User disconnected (Status: OFFLINE)');
        io.emit('user:offline', {
          userId,
          lastSeen: new Date().toISOString(),
        });
      }
    }
  });
};
