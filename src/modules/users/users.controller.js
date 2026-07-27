import * as service from './users.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok, created, paginated } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listUsers(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getUser(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  created(res, { message: 'User created', data: await service.createUser(req.body, req.user) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'User updated', data: await service.updateUser(req.params.id, req.body, req.user) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  ok(res, { message: 'Status updated', data: await service.changeUserStatus(req.params.id, req.body.status, req.user) });
});

export const updateRole = asyncHandler(async (req, res) => {
  ok(res, { message: 'Role updated', data: await service.updateUser(req.params.id, { role: req.body.role }, req.user) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id, req.user);
  ok(res, { message: 'User deleted' });
});
