import * as service from './entry.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listEntries(req.params.typeKey, req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getEntry(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'Item created', data: await service.createEntry(req.params.typeKey, req.body, req.user.id) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Item saved', data: await service.updateEntry(req.params.id, req.body, req.user.id) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteEntry(req.params.id);
  ok(res, { message: 'Item deleted' });
});

export const duplicate = asyncHandler(async (req, res) => {
  created(res, { message: 'Item duplicated', data: await service.duplicateEntry(req.params.id, req.user.id) });
});

export const reorder = asyncHandler(async (req, res) => {
  await service.reorderEntries(req.params.typeKey, req.body.order);
  ok(res, { message: 'Reordered' });
});

export const publish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Published', data: await service.publishEntry(req.params.id) });
});

export const unpublish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Unpublished', data: await service.unpublishEntry(req.params.id) });
});

/* public */
export const listPublic = asyncHandler(async (req, res) => {
  const filters = { featured: req.query.featured === 'true', category: req.query.category };
  const limit = Number(req.query.limit) || 0;
  ok(res, { data: await service.listPublicEntries(req.params.typeKey, { filters, limit }) });
});

export const getPublicBySlug = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPublicEntryBySlug(req.params.typeKey, req.params.slug) });
});
