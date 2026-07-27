import * as service from './taxonomy.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, { data: await service.listCategories(req.query.taxonomy) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'Category created', data: await service.createCategory(req.body) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Category updated', data: await service.updateCategory(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.id);
  ok(res, { message: 'Category deleted' });
});

export const reorder = asyncHandler(async (req, res) => {
  await service.reorderCategories(req.body.order);
  ok(res, { message: 'Categories reordered' });
});
