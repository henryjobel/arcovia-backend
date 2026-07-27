import { z } from 'zod';
import { objectId } from '../users/users.validation.js';

const tString = z.record(z.string(), z.string());

export const uploadBodySchema = z.object({
  folder: objectId.nullable().optional(),
});

export const updateAssetSchema = z.object({
  title: z.string().max(200).optional(),
  alt: tString.optional(),
  caption: tString.optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
  folder: objectId.nullable().optional(),
  focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(objectId).min(1).max(100),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(80),
  parent: objectId.nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(80),
});

export const idParamSchema = z.object({ id: objectId });
