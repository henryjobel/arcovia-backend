import { Router } from 'express';
import * as controller from './auth.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { validate } from '../../core/middlewares/validate.js';
import { authLimiter, sensitiveLimiter } from '../../core/middlewares/rateLimiters.js';
import {
  loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema,
  changePasswordSchema, updateProfileSchema, twoFactorVerifySchema,
  twoFactorCodeSchema, idParamSchema,
} from './auth.validation.js';

const router = Router();

// public
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/2fa/verify', authLimiter, validate({ body: twoFactorVerifySchema }), controller.verify2fa);
router.post('/register', sensitiveLimiter, validate({ body: registerSchema }), controller.register);
router.post('/refresh', controller.refresh);
router.post('/forgot-password', sensitiveLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', sensitiveLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);

// authenticated
router.post('/logout', controller.logout); // works with just the cookie — no access token needed
router.post('/logout-all', authenticate, controller.logoutAll);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), controller.changePassword);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), controller.updateMe);
router.get('/sessions', authenticate, controller.sessions);
router.delete('/sessions/:id', authenticate, validate({ params: idParamSchema }), controller.revokeSession);
router.post('/2fa/setup', authenticate, controller.setup2fa);
router.post('/2fa/enable', authenticate, validate({ body: twoFactorCodeSchema }), controller.enable2fa);
router.post('/2fa/disable', authenticate, validate({ body: twoFactorCodeSchema }), controller.disable2fa);

export default router;
