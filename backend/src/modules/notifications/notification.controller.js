import { notificationService } from './notification.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class NotificationController {
  constructor(service = notificationService) {
    this.service = service;
  }

  getMyNotifications = asyncHandler(async (req, res) => {
    const result = await this.service.getUserNotifications(req.user.userId, req.query);
    return ApiResponse.success(res, result.notifications, 'Notifications retrieved', 200, result.pagination);
  });

  markAsRead = asyncHandler(async (req, res) => {
    const notification = await this.service.markAsRead(req.params.id, req.user.userId);
    return ApiResponse.success(res, notification, 'Notification marked as read');
  });
}

export const notificationController = new NotificationController();
