import { z } from 'zod';
import { PERMISSION_CATALOG } from '../../config/constants.js';

const isValidPermission = (p) =>
  p === '*' ||
  PERMISSION_CATALOG.includes(p) ||
  (p.endsWith('.*') && PERMISSION_CATALOG.some((c) => c.startsWith(p.slice(0, -1))));

const permissionsField = z
  .array(z.string())
  .refine((arr) => arr.every(isValidPermission), { message: 'Contains unknown permission keys' });

export const createRoleSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
  permissions: permissionsField.default([]),
  level: z.number().int().min(2).max(999),
});

export const updateRoleSchema = createRoleSchema.partial();

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});
