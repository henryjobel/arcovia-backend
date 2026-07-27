import { z } from 'zod';
import { passwordField } from '../users/users.validation.js';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(30).optional(),
  password: passwordField,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordField,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  avatar: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  designation: z.string().max(120).optional(),
  bio: z.record(z.string(), z.string()).optional(),
});

export const twoFactorVerifySchema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().min(6).max(12),
});

export const twoFactorCodeSchema = z.object({
  code: z.string().min(6).max(12),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});
