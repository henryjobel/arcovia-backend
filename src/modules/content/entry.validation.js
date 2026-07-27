import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { seoZodSchema } from '../../core/schemas/seo.schema.js';

export const typeKeyParamSchema = z.object({ typeKey: z.string().min(1) });
export const idParamSchema = z.object({ typeKey: z.string().min(1), id: objectId });
export const slugParamSchema = z.object({ typeKey: z.string().min(1), slug: z.string().min(1) });

export const createEntrySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated')
    .optional(),
});

export const updateEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated')
    .optional(),
  data: z.record(z.string(), z.any()).optional(),
  featured: z.boolean().optional(),
  seo: seoZodSchema.optional(),
  sections: z.array(z.any()).optional(),
});

export const reorderSchema = z.object({
  order: z.array(z.object({ id: objectId, order: z.number() })).min(1),
});
