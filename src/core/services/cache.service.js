import { getRedis } from '../../config/redis.js';
import { logger } from '../utils/logger.js';

// In-memory cache fallback when Redis is not configured.
const memoryCache = new Map();

/**
 * Thin JSON cache over Redis with in-memory fallback. Every method degrades
 * gracefully to local memory when Redis is not configured.
 */
export const cache = {
  async get(key) {
    const redis = getRedis();
    if (redis) {
      try {
        const raw = await redis.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        logger.warn(`cache.get(${key}) failed: ${err.message}`);
        return null;
      }
    }

    // In-memory fallback
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlSeconds = 0) {
    const redis = getRedis();
    if (redis) {
      try {
        const raw = JSON.stringify(value);
        if (ttlSeconds > 0) await redis.set(key, raw, 'EX', ttlSeconds);
        else await redis.set(key, raw);
      } catch (err) {
        logger.warn(`cache.set(${key}) failed: ${err.message}`);
      }
      return;
    }

    // In-memory fallback
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    memoryCache.set(key, { value, expiresAt });
  },

  async del(...keys) {
    const redis = getRedis();
    if (redis) {
      if (!keys.length) return;
      try {
        await redis.del(...keys);
      } catch (err) {
        logger.warn(`cache.del failed: ${err.message}`);
      }
      return;
    }

    // In-memory fallback
    for (const key of keys) {
      memoryCache.delete(key);
    }
  },

  /** Delete by prefix, e.g. delPattern('settings:*'). */
  async delPattern(pattern) {
    const redis = getRedis();
    if (redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length) await redis.del(...keys);
      } catch (err) {
        logger.warn(`cache.delPattern(${pattern}) failed: ${err.message}`);
      }
      return;
    }

    // In-memory fallback
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  },
};
