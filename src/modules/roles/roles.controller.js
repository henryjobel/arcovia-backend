import * as service from './roles.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';
import { PERMISSIONS, PERMISSION_CATALOG } from '../../config/constants.js';

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listRoles(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getRole(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'Role created', data: await service.createRole(req.body, req.user) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Role updated', data: await service.updateRole(req.params.id, req.body, req.user) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteRole(req.params.id, req.user);
  ok(res, { message: 'Role deleted' });
});

/** Full permission catalog — drives the role-editor checkbox UI. */
export const permissionCatalog = asyncHandler(async (req, res) => {
  ok(res, { data: { groups: PERMISSIONS, all: PERMISSION_CATALOG } });
});
