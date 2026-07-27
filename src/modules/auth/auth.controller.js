import * as service from './auth.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created } from '../../core/utils/ApiResponse.js';
import { env, isProd } from '../../config/env.js';

const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] || '' });

const setRefreshCookie = (res, token) =>
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });

const clearRefreshCookie = (res) =>
  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });

const respondWithTokens = (res, result, message, status = 200) => {
  setRefreshCookie(res, result.refreshToken);
  const { refreshToken, ...data } = result;
  ok(res, { message, data, status });
};

export const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body, meta(req));
  if (result.twoFactorRequired) {
    return ok(res, { message: 'Two-factor code required', data: result });
  }
  respondWithTokens(res, result, 'Logged in');
});

export const verify2fa = asyncHandler(async (req, res) => {
  respondWithTokens(res, await service.verifyTwoFactorLogin(req.body, meta(req)), 'Logged in');
});

export const register = asyncHandler(async (req, res) => {
  respondWithTokens(res, await service.register(req.body, meta(req)), 'Account created', 201);
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const result = await service.refresh(req.cookies[env.REFRESH_COOKIE_NAME], meta(req));
    respondWithTokens(res, result, 'Token refreshed');
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await service.logout(req.cookies[env.REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  ok(res, { message: 'Logged out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await service.logoutAll(req.user.id);
  clearRefreshCookie(res);
  ok(res, { message: 'Logged out from all devices' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await service.forgotPassword(req.body.email);
  ok(res, { message: 'If that email exists, a reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body);
  ok(res, { message: 'Password has been reset. Please log in.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body, req.cookies[env.REFRESH_COOKIE_NAME]);
  ok(res, { message: 'Password changed. Other devices have been logged out.' });
});

export const me = asyncHandler(async (req, res) => {
  const profile = await service.getProfile(req.user.id);
  ok(res, { data: { ...profile, permissions: req.user.permissions } });
});

export const updateMe = asyncHandler(async (req, res) => {
  ok(res, { message: 'Profile updated', data: await service.updateProfile(req.user.id, req.body) });
});

export const sessions = asyncHandler(async (req, res) => {
  ok(res, { data: await service.listSessions(req.user.id, req.cookies[env.REFRESH_COOKIE_NAME]) });
});

export const revokeSession = asyncHandler(async (req, res) => {
  await service.revokeSession(req.user.id, req.params.id);
  ok(res, { message: 'Session revoked' });
});

export const setup2fa = asyncHandler(async (req, res) => {
  ok(res, { message: 'Scan the QR code, then verify to enable', data: await service.setupTwoFactor(req.user.id) });
});

export const enable2fa = asyncHandler(async (req, res) => {
  const data = await service.enableTwoFactor(req.user.id, req.body.code);
  ok(res, { message: 'Two-factor enabled. Save your recovery codes — they are shown only once.', data });
});

export const disable2fa = asyncHandler(async (req, res) => {
  await service.disableTwoFactor(req.user.id, req.body.code);
  ok(res, { message: 'Two-factor disabled' });
});
