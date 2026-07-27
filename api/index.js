import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';
import { logger } from '../src/core/utils/logger.js';

let redisStarted = false;
let lastDbAttempt = 0;
const DB_RETRY_MS = 10000;

const ensureServices = async () => {
  if (Date.now() - lastDbAttempt >= DB_RETRY_MS) {
    lastDbAttempt = Date.now();
    try {
      await connectDB();
    } catch (err) {
      logger.error(`MongoDB connection failed in serverless function: ${err.message}`);
    }
  }

  if (!redisStarted) {
    initRedis();
    redisStarted = true;
  }
};

export default async function handler(req, res) {
  await ensureServices();
  return app(req, res);
}
