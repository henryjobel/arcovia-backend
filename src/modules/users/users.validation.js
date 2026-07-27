import { z } from 'zod';
import { USER_STATUS } from '../../config/constants.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/\d/, 'Must contain a digit');

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(30).optional(),
  password: passwordField,
  role: objectId,
  status: z.enum(USER_STATUS).default('active'),
  designation: z.string().max(120).optional(),
  extraPermissions: z.array(z.string()).optional(),
  deniedPermissions: z.array(z.string()).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const updateStatusSchema = z.object({ status: z.enum(USER_STATUS) });

export const updateRoleSchema = z.object({ role: objectId });

export const idParamSchema = z.object({ id: objectId });
