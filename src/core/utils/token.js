import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AuthError, TokenExpiredError } from '../errors/AppError.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: String(user._id), role: user.role?.slug || user.role, tv: user.tokenVersion || 0 },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES }
  );

/** Short-lived token bridging password step → TOTP step of a 2FA login. */
export const signChallengeToken = (userId) =>
  jwt.sign({ sub: String(userId), purpose: '2fa' }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });

export const verifyToken = (token, { purpose } = {}) => {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (purpose && payload.purpose !== purpose) throw new AuthError('Invalid token');
    if (!purpose && payload.purpose) throw new AuthError('Invalid token');
    return payload;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    if (err.name === 'TokenExpiredError') throw new TokenExpiredError();
    throw new AuthError('Invalid token');
  }
};

/** Opaque refresh token — only its hash is persisted. */
export const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
