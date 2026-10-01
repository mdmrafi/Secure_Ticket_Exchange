import crypto from 'crypto';
import { inngest } from '../config/inngest.config.js';
import { logger } from '../config/logger.config.js';
import { EventNames, CORE_DOMAIN_EVENTS } from '../common/constants/events.constant.js';

export class EventPublisher {
  constructor(client = inngest) {
    this.client = client;
    this.localListeners = new Map();
  }

  /**
   * Subscribe a local listener for event testing / decoupled observers
   */
  on(eventName, listener) {
    if (!this.localListeners.has(eventName)) {
      this.localListeners.set(eventName, []);
    }
    this.localListeners.get(eventName).push(listener);
    return () => this.off(eventName, listener);
  }

  off(eventName, listener) {
    const list = this.localListeners.get(eventName) || [];
    this.localListeners.set(
      eventName,
      list.filter((l) => l !== listener)
    );
  }

  /**
   * Publish a standardized system event to Inngest
   *
   * @param {string} name - Event name (e.g., 'user.created')
   * @param {object} data - Event payload
   * @param {object} [user] - Optional user context
   * @param {object} [options] - Additional options (e.g. custom eventId)
   */
  async publish(name, data = {}, user = null, options = {}) {
    const eventId = options.id || `evt_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    const timestamp = Date.now();

    const payload = {
      name,
      id: eventId,
      data: {
        ...data,
        eventId,
      },
      user: user
        ? {
            id: user.id || user._id?.toString() || user.userId,
            email: user.email,
            role: user.role,
          }
        : undefined,
      ts: timestamp,
    };

    logger.info({ eventName: name, eventId }, 'Dispatching event to Inngest background queue');

    // Notify any registered local observers first (non-blocking)
    const listeners = this.localListeners.get(name) || [];
    for (const listener of listeners) {
      try {
        Promise.resolve(listener(payload)).catch((err) => {
          logger.warn({ err, eventName: name }, 'Error in local event observer');
        });
      } catch (err) {
        logger.warn({ err, eventName: name }, 'Synchronous error in local event observer');
      }
    }

    try {
      const sendResult = await this.client.send(payload);
      return {
        success: true,
        eventId,
        name,
        payload,
        inngestResult: sendResult,
      };
    } catch (err) {
      // In local dev without inngest dev-server running, log warning rather than throwing
      // to keep synchronous API routes reliable.
      logger.warn(
        { err: err.message, eventName: name, eventId },
        'Inngest event dispatch failed or Inngest Dev Server unreachable'
      );
      return {
        success: false,
        eventId,
        name,
        payload,
        error: err.message,
      };
    }
  }
}

export const eventPublisher = new EventPublisher();

/**
 * Convenience helper to publish an event
 */
export const publishEvent = (name, data, user, options) =>
  eventPublisher.publish(name, data, user, options);
