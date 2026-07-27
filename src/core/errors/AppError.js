/**
 * Operational error hierarchy. Anything thrown as AppError is expected,
 * serialized cleanly to the client, and NOT treated as a crash.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL', errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(errors = [], message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Access token expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class BusinessRuleError extends AppError {
  constructor(message) {
    super(message, 422, 'BUSINESS_RULE');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMITED');
  }
}
