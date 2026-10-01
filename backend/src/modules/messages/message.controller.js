import { messageService } from './message.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { getSocketIO, isUserOnline } from '../../loaders/socket.js';

export class MessageController {
  constructor(service = messageService) {
    this.service = service;
  }

  /**
   * Get message history for an authorized room
   * GET /api/v1/messages/history?roomId=...&page=1&limit=50
   */
  getHistory = asyncHandler(async (req, res) => {
    const { roomId, page = '1', limit = '50' } = req.query;

    const result = await this.service.getMessageHistory(
      roomId,
      req.user.userId,
      req.user.role,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }
    );

    return ApiResponse.success(res, result, 'Message history retrieved');
  });

  /**
   * Send a message via REST API
   * POST /api/v1/messages
   */
  sendMessage = asyncHandler(async (req, res) => {
    const { roomId, content, recipientId, metadata } = req.body;

    const isRecipientConnected = recipientId ? isUserOnline(recipientId) : false;

    // Sender identity derived strictly from authenticated token
    const message = await this.service.sendMessage(
      { roomId, content, recipientId, metadata },
      req.user.userId,
      req.user.role,
      isRecipientConnected
    );

    // Broadcast in real-time if Socket.IO is initialized
    const io = getSocketIO();
    if (io) {
      io.to(roomId).emit('message:received', { message });
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('message:notify', { message });
      }
    }

    return ApiResponse.created(res, message, 'Message sent successfully');
  });

  /**
   * Mark a message as read
   * PATCH /api/v1/messages/:id/read
   */
  markRead = asyncHandler(async (req, res) => {
    const message = await this.service.markRead(req.params.id, req.user.userId);

    const io = getSocketIO();
    if (io && message.roomId) {
      io.to(message.roomId).emit('message:read', {
        messageId: message._id,
        readBy: req.user.userId,
        readAt: message.readAt,
      });
    }

    return ApiResponse.success(res, message, 'Message marked as read');
  });
}

export const messageController = new MessageController();
