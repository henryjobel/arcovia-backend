import * as service from './media.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';

/* assets */
export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listAssets(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getAsset(req.params.id) });
});

export const upload = asyncHandler(async (req, res) => {
  const assets = await service.uploadAssets(req.files, {
    folderId: req.body.folder || null,
    actorId: req.user.id,
  });
  created(res, { message: `${assets.length} file(s) uploaded`, data: assets });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Media updated', data: await service.updateAsset(req.params.id, req.body) });
});

export const replace = asyncHandler(async (req, res) => {
  ok(res, { message: 'File replaced — all usages updated', data: await service.replaceAsset(req.params.id, req.file) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteAsset(req.params.id);
  ok(res, { message: 'Media deleted' });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  ok(res, { message: 'Bulk delete complete', data: await service.bulkDeleteAssets(req.body.ids) });
});

/* folders */
export const folders = asyncHandler(async (req, res) => {
  ok(res, { data: await service.listFolders() });
});

export const createFolder = asyncHandler(async (req, res) => {
  created(res, { message: 'Folder created', data: await service.createFolder(req.body, req.user.id) });
});

export const renameFolder = asyncHandler(async (req, res) => {
  ok(res, { message: 'Folder renamed', data: await service.renameFolder(req.params.id, req.body.name) });
});

export const deleteFolder = asyncHandler(async (req, res) => {
  await service.deleteFolder(req.params.id);
  ok(res, { message: 'Folder deleted' });
});
