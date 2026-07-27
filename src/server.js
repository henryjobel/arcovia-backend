import { env } from './config/env.js';
import { logger } from './core/utils/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initRedis, closeRedis } from './config/redis.js';

process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

const start = async () => {
  await connectDB();
  initRedis();

  const { default: app } = await import('./app.js');
  const server = app.listen(env.PORT, () => {
    logger.info(`Avron CMS API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health: ${env.API_URL}/api/v1/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      await closeRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`UNHANDLED REJECTION: ${reason instanceof Error ? reason.stack : reason}`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
