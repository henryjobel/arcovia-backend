import { z } from 'zod';
import { objectId } from '../users/users.validation.js';
import { seoZodSchema } from '../../core/schemas/seo.schema.js';

export const idParamSchema = z.object({ id: objectId });

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(160).regex(slugRegex, 'Slug must be lowercase, hyphenated').optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(160).regex(slugRegex, 'Slug must be lowercase, hyphenated').optional(),
  excerpt: z.string().max(400).optional(),
  contentHtml: z.string().optional(),
  featuredImage: z.object({ assetId: z.any().nullable().optional(), url: z.string().optional(), alt: z.string().optional() }).nullable().optional(),
  categories: z.array(objectId).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  isFeatured: z.boolean().optional(),
  seo: seoZodSchema.optional(),
});

export const scheduleSchema = z.object({
  scheduledAt: z.string().datetime().or(z.string().min(1)),
});
