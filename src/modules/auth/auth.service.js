import crypto from 'node:crypto';
import { authenticator } from 'otplib';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { Session } from './session.model.js';
import { PasswordResetToken } from './passwordResetToken.model.js';
import { ActivityLog } from '../activity/activityLog.model.js';
import { hashPassword } from '../users/users.service.js';
import { AuthError, BusinessRuleError, ConflictError, NotFoundError } from '../../core/errors/AppError.js';
import { signAccessToken, signChallengeToken, verifyToken, generateRefreshToken, hashToken, generateRandomToken } from '../../core/utils/token.js';
import { invalidateAuthUser } from '../../core/middlewares/authenticate.js';
import { sendMail, renderBasicTemplate } from '../../core/services/mail.service.js';
import { eventBus, EVENTS } from '../../core/services/event.bus.js';
import { logger } from '../../core/utils/logger.js';
import { env } from '../../config/env.js';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const deviceFromUA = (ua = '') =>
  /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';

const logAuthActivity = (user, action, meta = {}) =>
  ActivityLog.create({
    actor: user._id,
    action,
    module: 'auth',
    summary: `${user.email} — ${action}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
  }).catch((err) => logger.warn(`activity log failed: ${err.message}`));

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  designation: user.designation,
  role: user.role?.slug ? { slug: user.role.slug, name: user.role.name } : undefined,
  twoFactorEnabled: Boolean(user.twoFactor?.enabled),
});

/* ── Token issuance ──────────────────────────────────────────── */

const createSession = async (user, meta, family = crypto.randomUUID()) => {
  const refreshToken = generateRefreshToken();
  await Session.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    family,
    userAgent: meta.userAgent,
    ip: meta.ip,
    device: deviceFromUA(meta.userAgent),
    expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
  });
  return refreshToken;
};

const issueTokens = async (user, meta, family) => {
  await user.populate('role', 'name slug level');
  return {
    accessToken: signAccessToken(user),
    refreshToken: await createSession(user, meta, family),
    user: publicUser(user),
  };
};

/* ── Login / 2FA ─────────────────────────────────────────────── */

export const login = async ({ email, password }, meta) => {
  const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash');
  if (!user || !user.passwordHash) throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');

  if (user.isLocked()) {
    throw new AuthError(`Account temporarily locked. Try again in ${LOCK_MINUTES} minutes.`, 'ACCOUNT_LOCKED');
  }

  if (!(await user.comparePassword(password))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = meta.ip;
  await user.save();

  if (user.twoFactor?.enabled) {
    return { twoFactorRequired: true, challengeToken: signChallengeToken(user._id) };
  }

  logAuthActivity(user, 'login', meta);
  eventBus.safeEmit(EVENTS.USER_LOGGED_IN, { userId: String(user._id) });
  return issueTokens(user, meta);
};

export const verifyTwoFactorLogin = async ({ challengeToken, code }, meta) => {
  const payload = verifyToken(challengeToken, { purpose: '2fa' });
  const user = await User.findById(payload.sub).select('+twoFactor.secret +twoFactor.recoveryCodes');
  if (!user || user.status !== 'active') throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');

  const totpValid = user.twoFactor.secret && authenticator.verify({ token: code, secret: user.twoFactor.secret });

  if (!totpValid) {
    // fall back to a single-use recovery code
    const codeHash = hashToken(code.toUpperCase().replace(/\s/g, ''));
    const idx = (user.twoFactor.recoveryCodes || []).indexOf(codeHash);
    if (idx === -1) throw new AuthError('Invalid two-factor code', 'INVALID_2FA_CODE');
    user.twoFactor.recoveryCodes.splice(idx, 1);
    await user.save();
  }

  logAuthActivity(user, 'login-2fa', meta);
  return issueTokens(user, meta);
};

/* ── Refresh rotation with reuse detection ───────────────────── */

export const refresh = async (refreshTokenPlain, meta) => {
  if (!refreshTokenPlain) throw new AuthError('Refresh token missing', 'REFRESH_MISSING');

  const tokenHash = hashToken(refreshTokenPlain);
  const session = await Session.findOne({ tokenHash });
  if (!session) throw new AuthError('Invalid refresh token', 'REFRESH_INVALID');

  // A rotated/revoked token being replayed = likely theft → burn the family.
  if (session.revokedAt || session.replacedBy) {
    await Session.updateMany({ family: session.family, revokedAt: null }, { revokedAt: new Date() });
    logger.warn(`Refresh token reuse detected for user ${session.user} — family ${session.family} revoked`);
    throw new AuthError('Session compromised, please log in again', 'SESSION_COMPROMISED');
  }
  if (session.expiresAt < new Date()) throw new AuthError('Refresh token expired', 'REFRESH_EXPIRED');

  const user = await User.findOne({ _id: session.user, deletedAt: null });
  if (!user || user.status !== 'active') throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');

  const tokens = await issueTokens(user, meta, session.family);
  session.replacedBy = hashToken(tokens.refreshToken);
  session.revokedAt = new Date();
  session.lastUsedAt = new Date();
  await session.save();

  return tokens;
};

/* ── Logout / sessions ───────────────────────────────────────── */

export const logout = async (refreshTokenPlain) => {
  if (!refreshTokenPlain) return;
  await Session.updateOne({ tokenHash: hashToken(refreshTokenPlain) }, { revokedAt: new Date() });
};

export const revokeAllSessions = async (userId) => {
  await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
};

export const logoutAll = async (userId) => {
  await revokeAllSessions(userId);
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }); // kill outstanding access tokens
  await invalidateAuthUser(userId);
};

export const listSessions = async (userId, currentRefreshToken) => {
  const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  const sessions = await Session.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort('-lastUsedAt')
    .lean();
  return sessions.map((s) => ({
    id: String(s._id),
    device: s.device,
    userAgent: s.userAgent,
    ip: s.ip,
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
    current: s.tokenHash === currentHash,
  }));
};

export const revokeSession = async (userId, sessionId) => {
  const session = await Session.findOne({ _id: sessionId, user: userId });
  if (!session) throw new NotFoundError('Session');
  session.revokedAt = new Date();
  await session.save();
};

/* ── Registration (public — always customer role) ────────────── */

export const register = async (data, meta) => {
  if (await User.exists({ email: data.email })) throw new ConflictError('Email is already registered');

  const customerRole = await Role.findOne({ slug: 'customer' });
  if (!customerRole) throw new BusinessRuleError('System roles are not seeded. Run: npm run seed');

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash: await hashPassword(data.password),
    role: customerRole._id,
    status: 'active',
  });

  eventBus.safeEmit(EVENTS.USER_REGISTERED, { userId: String(user._id), email: user.email });
  return issueTokens(user, meta);
};

/* ── Password flows ──────────────────────────────────────────── */

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email, deletedAt: null, status: 'active' });
  if (!user) return; // always succeed silently — no account enumeration

  await PasswordResetToken.deleteMany({ user: user._id });
  const token = generateRandomToken(32);
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const resetUrl = `${env.ADMIN_URL || env.CLIENT_URL}/reset-password?token=${token}`;
  try {
    await sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: renderBasicTemplate({
        title: 'Reset your password',
        bodyHtml: `<p>Hi ${user.name},</p>
          <p>We received a request to reset your password. This link expires in <b>15 minutes</b>.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>`,
      }),
      text: `Reset your password: ${resetUrl} (expires in 15 minutes)`,
    });
  } catch (err) {
    logger.error(`Password reset email failed for ${email}: ${err.message}`);
  }
};

export const resetPassword = async ({ token, password }) => {
  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record) throw new BusinessRuleError('Reset link is invalid or has expired');

  const user = await User.findOne({ _id: record.user, deletedAt: null });
  if (!user) throw new BusinessRuleError('Account no longer exists');

  user.passwordHash = await hashPassword(password);
  user.tokenVersion += 1;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await revokeAllSessions(user._id);
  await invalidateAuthUser(user._id);
  eventBus.safeEmit(EVENTS.PASSWORD_CHANGED, { userId: String(user._id) });
};

export const changePassword = async (userId, { currentPassword, newPassword }, currentRefreshToken) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new NotFoundError('User');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AuthError('Current password is incorrect', 'INVALID_CREDENTIALS');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // keep this device logged in, kill every other session
  const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  await Session.updateMany(
    { user: userId, revokedAt: null, ...(currentHash ? { tokenHash: { $ne: currentHash } } : {}) },
    { revokedAt: new Date() }
  );
  eventBus.safeEmit(EVENTS.PASSWORD_CHANGED, { userId: String(userId) });
};

/* ── Profile ─────────────────────────────────────────────────── */

export const getProfile = async (userId) => {
  const user = await User.findById(userId).populate('role', 'name slug level').populate('avatar', 'secureUrl url kind');
  if (!user) throw new NotFoundError('User');
  return publicUser(user);
};

export const updateProfile = async (userId, data) => {
  const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true })
    .populate('role', 'name slug level');
  if (!user) throw new NotFoundError('User');
  await invalidateAuthUser(userId);
  return publicUser(user);
};

/* ── Two-factor (TOTP) ───────────────────────────────────────── */

export const setupTwoFactor = async (userId) => {
  const user = await User.findById(userId).select('+twoFactor.secret');
  if (!user) throw new NotFoundError('User');
  if (user.twoFactor.enabled) throw new BusinessRuleError('Two-factor is already enabled');

  const secret = authenticator.generateSecret();
  user.twoFactor.secret = secret;
  await user.save();

  return {
    secret,
    otpauthUrl: authenticator.keyuri(user.email, 'Avron CMS', secret),
  };
};

export const enableTwoFactor = async (userId, code) => {
  const user = await User.findById(userId).select('+twoFactor.secret');
  if (!user?.twoFactor?.secret) throw new BusinessRuleError('Run 2FA setup first');
  if (!authenticator.verify({ token: code, secret: user.twoFactor.secret })) {
    throw new AuthError('Invalid two-factor code', 'INVALID_2FA_CODE');
  }

  const recoveryCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  );
  user.twoFactor.enabled = true;
  user.twoFactor.recoveryCodes = recoveryCodes.map((c) => hashToken(c));
  await user.save();
  await invalidateAuthUser(userId);

  return { recoveryCodes }; // shown exactly once
};

export const disableTwoFactor = async (userId, code) => {
  const user = await User.findById(userId).select('+twoFactor.secret');
  if (!user?.twoFactor?.enabled) throw new BusinessRuleError('Two-factor is not enabled');
  if (!authenticator.verify({ token: code, secret: user.twoFactor.secret })) {
    throw new AuthError('Invalid two-factor code', 'INVALID_2FA_CODE');
  }

  user.twoFactor = { enabled: false, secret: undefined, recoveryCodes: [] };
  await user.save();
  await invalidateAuthUser(userId);
};
