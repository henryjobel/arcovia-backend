import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { seoZodSchema } from '../../core/schemas/seo.schema.js';

const dynamicSourceSchema = z
  .object({
    kind: z.enum(['entries', 'posts', 'none']).optional(),
    contentType: z.string().optional(),
    filters: z.any().optional(),
    sort: z.string().optional(),
    limit: z.number().int().min(0).max(100).optional(),
  })
  .optional();

const sectionInputSchema = z.object({
  uid: z.string().min(1),
  type: z.string().min(1),
  order: z.number().optional().default(0),
  enabled: z.boolean().optional().default(true),
  props: z.any().optional().default({}),
  dynamicSource: dynamicSourceSchema,
});

export const idParamSchema = z.object({ id: objectId });

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated (a-z, 0-9, -)'),
  template: z.string().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, hyphenated (a-z, 0-9, -)')
    .optional(),
  template: z.string().optional(),
  sections: z.array(sectionInputSchema).optional(),
  seo: seoZodSchema.optional(),
});

export const reorderSchema = z.object({
  order: z.array(z.object({ uid: z.string(), order: z.number() })).min(1),
});

export const revisionParamSchema = z.object({ id: objectId, revisionId: objectId });
