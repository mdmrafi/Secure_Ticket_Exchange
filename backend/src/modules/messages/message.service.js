import { messageRepository } from './message.repository.js';
import { Transaction } from '../transactions/transaction.model.js';
import { Listing } from '../listings/listing.model.js';
import { User } from '../users/user.model.js';
import { MessageContextType, MessageDeliveryStatus } from './chat-message.model.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/index.js';

export class MessageService {
  constructor(repo = messageRepository) {
    this.repo = repo;
  }

  /**
   * Parse room identifier and verify user authorization
   *
   * Formats supported:
   * - tx:<transactionId>
   * - listing:<listingId>:<buyerId>
   * - listing:<listingId>
   * - user:<userId>
   *
   * @param {string} roomId
   * @param {string} userId - Derived from authenticated socket / token (NEVER client-supplied)
   * @param {string} [userRole='USER']
   * @returns {Promise<{
   *   authorized: boolean,
   *   contextType: string,
   *   contextId: string,
   *   recipientId: string|null,
   *   details: object
   * }>}
   */
  async verifyRoomAuthorization(roomId, userId, userRole = 'USER') {
    if (!roomId || typeof roomId !== 'string') {
      throw new BadRequestError('Invalid roomId provided');
    }

    const uId = userId ? userId.toString() : '';
    const isAdmin = userRole === 'ADMIN';

    // 1. Transaction Room Authorization: tx:<transactionId>
    if (roomId.startsWith('tx:')) {
      const transactionId = roomId.split(':')[1];
      if (!transactionId) {
        throw new BadRequestError('Invalid transaction roomId format');
      }

      const tx = await Transaction.findById(transactionId);
      if (!tx) {
        throw new NotFoundError('Transaction not found for this conversation');
      }

      const buyerId = tx.buyerId?._id ? tx.buyerId._id.toString() : tx.buyerId?.toString();
      const sellerId = tx.sellerId?._id ? tx.sellerId._id.toString() : tx.sellerId?.toString();

      const isBuyer = uId === buyerId;
      const isSeller = uId === sellerId;

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new ForbiddenError(
          'Unauthorized: You are not a party to this transaction conversation'
        );
      }

      // Determine the default peer recipient in this transaction
      const recipientId = isBuyer ? sellerId : buyerId;

      return {
        authorized: true,
        contextType: MessageContextType.TRANSACTION,
        contextId: tx._id,
        recipientId,
        details: { transactionId: tx._id, buyerId, sellerId },
      };
    }

    // 2. Listing Inquiries / Chat Room: listing:<listingId>:<buyerId> or listing:<listingId>
    if (roomId.startsWith('listing:')) {
      const parts = roomId.split(':');
      const listingId = parts[1];
      const buyerId = parts[2] || null;

      if (!listingId) {
        throw new BadRequestError('Invalid listing roomId format');
      }

      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new NotFoundError('Listing not found for this conversation');
      }

      const sellerId = listing.sellerId?._id
        ? listing.sellerId._id.toString()
        : listing.sellerId?.toString();

      const isSeller = uId === sellerId;
      const isBuyer = buyerId ? uId === buyerId.toString() : false;

      // If buyerId was part of the room name, only that buyer, seller, or admin can enter
      if (buyerId) {
        if (!isSeller && !isBuyer && !isAdmin) {
          throw new ForbiddenError(
            'Unauthorized: You are not authorized to participate in this listing negotiation'
          );
        }
      } else {
        // If room is generic listing:<id>, only seller or inquiring user can join
        if (!isSeller && !isAdmin) {
          // If a non-seller joins, they become the buyer in their negotiation thread
          // (Clients should preferentially use listing:<id>:<buyerId>)
        }
      }

      const recipientId = isSeller ? buyerId : sellerId;

      return {
        authorized: true,
        contextType: MessageContextType.LISTING,
        contextId: listing._id,
        recipientId,
        details: { listingId: listing._id, sellerId, buyerId },
      };
    }

    // 3. Personal User Notifications Room: user:<userId>
    if (roomId.startsWith('user:')) {
      const targetUserId = roomId.split(':')[1];
      if (targetUserId !== uId && !isAdmin) {
        throw new ForbiddenError('Unauthorized: Cannot join another user personal inbox room');
      }
      return {
        authorized: true,
        contextType: MessageContextType.DIRECT,
        contextId: uId,
        recipientId: uId,
        details: { userId: uId },
      };
    }

    // 4. Any arbitrary room is strictly rejected
    throw new ForbiddenError(
      'Unauthorized: Arbitrary private rooms are not permitted on this platform'
    );
  }

  /**
   * Send and persist a chat message
   *
   * @param {object} params
   * @param {string} params.roomId
   * @param {string} params.content
   * @param {string} [params.recipientId]
   * @param {string} senderId - STRICTLY DERIVED FROM AUTHENTICATED SOCKET
   * @param {string} [senderRole='USER']
   * @param {boolean} [isRecipientOnline=false]
   */
  async sendMessage(params, senderId, senderRole = 'USER', isRecipientOnline = false) {
    const { roomId, content, metadata = {} } = params;

    if (!content || !content.trim()) {
      throw new BadRequestError('Message content cannot be empty');
    }

    // Authorization & Context derivation
    const auth = await this.verifyRoomAuthorization(roomId, senderId, senderRole);

    const recipientId = params.recipientId || auth.recipientId;

    const initialStatus = isRecipientOnline
      ? MessageDeliveryStatus.DELIVERED
      : MessageDeliveryStatus.SENT;

    const deliveredAt = isRecipientOnline ? new Date() : null;

    // Persist in MongoDB
    const message = await this.repo.create({
      roomId,
      contextType: auth.contextType,
      contextId: auth.contextId,
      senderId,
      recipientId,
      content: content.trim(),
      status: initialStatus,
      sentAt: new Date(),
      deliveredAt,
      metadata,
    });

    return message;
  }

  /**
   * Mark message as DELIVERED
   * @param {string} messageId
   */
  async markDelivered(messageId) {
    return this.repo.markDelivered(messageId);
  }

  /**
   * Mark message as READ
   * @param {string} messageId
   * @param {string} readerId - DERIVED FROM AUTHENTICATED SOCKET
   */
  async markRead(messageId, readerId) {
    const message = await this.repo.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify reader is the recipient or a party in the room
    const isRecipient = message.recipientId
      ? message.recipientId._id.toString() === readerId.toString()
      : true;

    if (!isRecipient && message.senderId._id.toString() === readerId.toString()) {
      // Sender cannot mark own message as read
      return message;
    }

    return this.repo.markRead(messageId);
  }

  /**
   * Retrieve message history for an authorized conversation room
   *
   * @param {string} roomId
   * @param {string} userId - DERIVED FROM AUTHENTICATED SOCKET
   * @param {string} [userRole='USER']
   * @param {object} [options]
   */
  async getMessageHistory(roomId, userId, userRole = 'USER', options = {}) {
    await this.verifyRoomAuthorization(roomId, userId, userRole);
    return this.repo.findByRoomId(roomId, options);
  }
}

export const messageService = new MessageService();
