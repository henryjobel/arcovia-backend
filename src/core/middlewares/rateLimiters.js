import rateLimit from 'express-rate-limit';

const limitReached = (req, res) =>
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMITED',
  });

const base = { standardHeaders: true, legacyHeaders: false, handler: limitReached };

/** Whole API — generous ceiling against floods. */
export const generalLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 300 });

/** Credential endpoints — keyed by IP + email so one IP can't spray accounts. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});

/** Password-reset / register style endpoints. */
export const sensitiveLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 20 });

/** Public contact form â€” enough for retries, strict enough to reduce inbox spam. */
export const inquiryLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 8 });

// NOTE: stores are in-memory (per instance). When scaling to multiple
// instances, add `rate-limit-redis` as the store using config/redis.js.
