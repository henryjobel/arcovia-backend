import { z } from 'zod';
import { seoZodSchema } from '../../core/schemas/seo.schema.js';
import { objectId } from '../users/users.validation.js';

export const seoTargetParamSchema = z.object({
  kind: z.enum(['page', 'post', 'entry']),
  id: objectId,
});

export const updateSeoSchema = z.object({ seo: seoZodSchema });
