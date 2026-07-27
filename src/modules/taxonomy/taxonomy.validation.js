import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const TAXONOMIES = ['project', 'blog'];

export const listQuerySchema = z.object({
  taxonomy: z.enum(TAXONOMIES),
});

export const createCategorySchema = z.object({
  taxonomy: z.enum(TAXONOMIES),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated').optional(),
});

export const reorderSchema = z.object({
  order: z.array(z.object({ id: objectId, order: z.number() })).min(1),
});

export const idParamSchema = z.object({ id: objectId });
