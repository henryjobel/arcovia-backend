import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';

/**
 * In-process event bus decoupling side effects (emails, notifications,
 * counters) from the main write path. Swappable for BullMQ later without
 * touching any service — only this file and the listeners change.
 */
export const EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged-in',
  PASSWORD_CHANGED: 'user.password-changed',
  MEDIA_UPLOADED: 'media.uploaded',
  SETTINGS_UPDATED: 'settings.updated',
};

class EventBus extends EventEmitter {
  safeEmit(event, payload) {
    try {
      this.emit(event, payload);
    } catch (err) {
      logger.error(`Event listener for '${event}' failed: ${err.message}`, { stack: err.stack });
    }
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(50);
