import { AppError } from './AppError.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../../config/env.js';

/** Map non-AppError shapes (mongoose, JSON parse…) onto the error contract. */
const normalize = (err) => {
  if (err instanceof AppError) return err;

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    return new AppError(`Invalid value for '${err.path}'`, 400, 'VALIDATION_ERROR');
  }
  // Mongoose: schema validation
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }
  // Mongo: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new AppError(`A record with this ${field} already exists`, 409, 'CONFLICT');
  }
  // body-parser: malformed JSON
  if (err.type === 'entity.parse.failed') {
    return new AppError('Malformed JSON body', 400, 'VALIDATION_ERROR');
  }
  // multer
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
    return new AppError(msg, 400, 'UPLOAD_ERROR');
  }
  return err;
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const e = normalize(err);
  const isOperational = e instanceof AppError;
  const status = isOperational ? e.statusCode : 500;

  if (!isOperational || status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${e.message}`, { stack: e.stack, userId: req.user?.id });
  }

  res.status(status).json({
    success: false,
    message: isOperational ? e.message : isProd ? 'Something went wrong' : e.message,
    code: isOperational ? e.code : 'INTERNAL',
    ...(e.errors ? { errors: e.errors } : {}),
    ...(!isProd && !isOperational ? { stack: e.stack } : {}),
  });
};
