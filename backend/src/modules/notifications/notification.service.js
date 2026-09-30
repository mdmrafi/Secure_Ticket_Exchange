import { notificationRepository } from './notification.repository.js';
import { getSocketIO } from '../../loaders/socket.js';

export class NotificationService {
  constructor(repo = notificationRepository) {
    this.repo = repo;
  }

  async sendNotification(recipientId, notificationData) {
    const notification = await this.repo.create({
      ...notificationData,
      recipientId,
    });

    // Real-time broadcast via Socket.IO if user connected to room
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user:${recipientId}`).emit('notification:new', notification);
      }
    } catch {
      // Socket not ready or running outside HTTP context
    }

    return notification;
  }

  async getUserNotifications(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.findByUser(userId, { skip, limit });

    return {
      notifications: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id, userId) {
    return this.repo.markAsRead(id, userId);
  }
}

export const notificationService = new NotificationService();
