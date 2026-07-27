import { getRedis } from '../../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Thin JSON cache over Redis. Every method is a safe no-op when Redis
 * is not configured, so no caller ever needs to know whether it exists.
 */
export const cache = {
  async get(key) {
    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      logger.warn(`cache.get(${key}) failed: ${err.message}`);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 0) {
    const redis = getRedis();
    if (!redis) return;
    try {
      const raw = JSON.stringify(value);
      if (ttlSeconds > 0) await redis.set(key, raw, 'EX', ttlSeconds);
      else await redis.set(key, raw);
    } catch (err) {
      logger.warn(`cache.set(${key}) failed: ${err.message}`);
    }
  },

  async del(...keys) {
    const redis = getRedis();
    if (!redis || !keys.length) return;
    try {
      await redis.del(...keys);
    } catch (err) {
      logger.warn(`cache.del failed: ${err.message}`);
    }
  },

  /** Delete by prefix, e.g. delPattern('settings:*'). */
  async delPattern(pattern) {
    const redis = getRedis();
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } catch (err) {
      logger.warn(`cache.delPattern(${pattern}) failed: ${err.message}`);
    }
  },
};
