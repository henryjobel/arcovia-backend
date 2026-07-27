import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

export const idParamSchema = z.object({ id: objectId });

export const createInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(180),
  projectType: z.string().trim().max(120).optional().or(z.literal('')),
  budget: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
});

export const updateInquirySchema = z
  .object({
    status: z.enum(['new', 'in-progress', 'contacted', 'closed', 'spam']).optional(),
    adminNotes: z.string().trim().max(5000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');
