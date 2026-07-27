import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../core/utils/logger.js';

const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let connecting = null;
let listenersAttached = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connecting) return connecting;

  if (!listenersAttached) {
    mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    listenersAttached = true;
  }

  connecting = mongoose
    .connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    })
    .then(() => mongoose.connection)
    .finally(() => {
      connecting = null;
    });

  return connecting;
};

export const disconnectDB = () => mongoose.disconnect();

export const dbPing = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return false;
    await mongoose.connection.db.admin().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
};

export const dbStatus = async () => {
  const connected = await dbPing();
  const { readyState, host, name } = mongoose.connection;

  return {
    connected,
    readyState,
    state: STATES[readyState] || 'unknown',
    host: host || null,
    database: name || null,
  };
};
