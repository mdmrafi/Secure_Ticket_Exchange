import { ChatMessage, MessageDeliveryStatus } from './chat-message.model.js';

export class MessageRepository {
  /**
   * Persist a new chat message
   * @param {object} data
   */
  async create(data) {
    const message = await ChatMessage.create(data);
    return ChatMessage.findById(message._id)
      .populate('senderId', 'name fullName email role')
      .populate('recipientId', 'name fullName email role')
      .exec();
  }

  /**
   * Find message by ID
   * @param {string} id
   */
  async findById(id) {
    return ChatMessage.findById(id)
      .populate('senderId', 'name fullName email role')
      .populate('recipientId', 'name fullName email role')
      .exec();
  }

  /**
   * Retrieve message history for a room
   * @param {string} roomId
   * @param {object} [options]
   */
  async findByRoomId(roomId, options = {}) {
    const { page = 1, limit = 50, sort = { createdAt: 1 } } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ roomId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'name fullName email role')
        .populate('recipientId', 'name fullName email role')
        .exec(),
      ChatMessage.countDocuments({ roomId }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark message as DELIVERED
   * @param {string} messageId
   */
  async markDelivered(messageId) {
    return ChatMessage.findByIdAndUpdate(
      messageId,
      {
        $set: {
          status: MessageDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Mark message as READ
   * @param {string} messageId
   */
  async markRead(messageId) {
    return ChatMessage.findByIdAndUpdate(
      messageId,
      {
        $set: {
          status: MessageDeliveryStatus.READ,
          readAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Mark all unread messages in a room as READ for a recipient
   * @param {string} roomId
   * @param {string} recipientId
   */
  async markRoomMessagesRead(roomId, recipientId) {
    const filter = {
      roomId,
      recipientId,
      status: { $ne: MessageDeliveryStatus.READ },
    };
    return ChatMessage.updateMany(filter, {
      $set: {
        status: MessageDeliveryStatus.READ,
        readAt: new Date(),
      },
    });
  }
}

export const messageRepository = new MessageRepository();
