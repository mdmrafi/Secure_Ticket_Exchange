import { Notification } from './notification.model.js';

export class NotificationRepository {
  async findByUser(recipientId, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      Notification.find({ recipientId })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Notification.countDocuments({ recipientId }),
    ]);

    return { items, total };
  }

  async markAsRead(id, recipientId) {
    return Notification.findOneAndUpdate({ _id: id, recipientId }, { isRead: true }, { new: true });
  }

  async markAllAsRead(recipientId) {
    return Notification.updateMany({ recipientId, isRead: false }, { isRead: true });
  }

  async create(data) {
    return Notification.create(data);
  }
}

export const notificationRepository = new NotificationRepository();
