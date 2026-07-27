import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../core/utils/logger.js';

/**
 * Redis is OPTIONAL. When REDIS_URL is not set every consumer
 * (cache service, rate limiter) degrades gracefully.
 */
let client = null;

export const initRedis = () => {
  if (!env.REDIS_URL) {
    logger.info('Redis not configured — cache layer running as no-op');
    return null;
  }
  client = new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });
  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  return client;
};

export const getRedis = () => client;

export const redisPing = async () => {
  try {
    if (!client) return null; // not configured
    return (await client.ping()) === 'PONG';
  } catch {
    return false;
  }
};

export const closeRedis = async () => {
  if (client) await client.quit().catch(() => {});
};
