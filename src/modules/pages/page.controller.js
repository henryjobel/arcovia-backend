import * as service from './page.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listPages(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPage(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'Page created', data: await service.createPage(req.body, req.user.id) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Page saved', data: await service.updatePage(req.params.id, req.body, req.user.id) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deletePage(req.params.id);
  ok(res, { message: 'Page deleted' });
});

export const duplicate = asyncHandler(async (req, res) => {
  created(res, { message: 'Page duplicated', data: await service.duplicatePage(req.params.id, req.user.id) });
});

export const reorder = asyncHandler(async (req, res) => {
  ok(res, { message: 'Sections reordered', data: await service.reorderSections(req.params.id, req.body.order) });
});

export const publish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Page published', data: await service.publishPage(req.params.id, req.user.id) });
});

export const unpublish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Page unpublished', data: await service.unpublishPage(req.params.id) });
});

export const preview = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getAdminPreview(req.params.id) });
});

export const revisions = asyncHandler(async (req, res) => {
  ok(res, { data: await service.listRevisions(req.params.id) });
});

export const restoreRevision = asyncHandler(async (req, res) => {
  ok(res, { message: 'Revision restored to draft', data: await service.restoreRevision(req.params.id, req.params.revisionId) });
});

/* public */
export const getPublicBySlug = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPublicPageBySlug(req.params.slug) });
});

export const getPublicMetaBySlug = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPublicPageMetaBySlug(req.params.slug) });
});
