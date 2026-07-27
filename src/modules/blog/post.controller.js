import * as service from './post.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listPosts(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPost(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'Post created', data: await service.createPost(req.body, req.user.id) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Post saved', data: await service.updatePost(req.params.id, req.body, req.user.id) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deletePost(req.params.id);
  ok(res, { message: 'Post deleted' });
});

export const duplicate = asyncHandler(async (req, res) => {
  created(res, { message: 'Post duplicated', data: await service.duplicatePost(req.params.id, req.user.id) });
});

export const publish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Post published', data: await service.publishPost(req.params.id) });
});

export const unpublish = asyncHandler(async (req, res) => {
  ok(res, { message: 'Post unpublished', data: await service.unpublishPost(req.params.id) });
});

export const schedule = asyncHandler(async (req, res) => {
  ok(res, { message: 'Post scheduled', data: await service.schedulePost(req.params.id, req.body.scheduledAt) });
});

/* public */
export const listPublic = asyncHandler(async (req, res) => {
  const { category, tag, search, featured, page, limit } = req.query;
  const { data, total } = await service.listPublicPosts({
    category,
    tag,
    search,
    featured: featured === 'true',
    limit: Number(limit) || 0,
    page: Number(page) || 1,
  });
  ok(res, { data, meta: { total } });
});

export const getPublicBySlug = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getPublicPostBySlug(req.params.slug) });
});
