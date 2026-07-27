import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { Role } from '../roles/role.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { ConflictError, ForbiddenError, NotFoundError, BusinessRuleError } from '../../core/errors/AppError.js';
import { invalidateAuthUser } from '../../core/middlewares/authenticate.js';
import { env } from '../../config/env.js';

const repo = new BaseRepository(User, { resourceName: 'User' });
const ROLE_POPULATE = { path: 'role', select: 'name slug level' };

export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

/** Level guard: actors only manage users/roles ranked strictly below themselves. */
const assertOutranks = (actor, targetRoleLevel, message) => {
  if (actor.permissions.includes('*')) return;
  if (targetRoleLevel <= actor.role.level) throw new ForbiddenError(message);
};

const getRoleOrFail = async (roleId) => {
  const role = await Role.findById(roleId);
  if (!role) throw new NotFoundError('Role');
  return role;
};

export const listUsers = (query) =>
  repo.list(query, {
    searchFields: ['name', 'email', 'phone'],
    allowedFilters: ['role', 'status'],
    baseFilter: { deletedAt: null },
    populate: ROLE_POPULATE,
    select: '-extraPermissions -deniedPermissions',
  });

export const getUser = async (id) => repo.findByIdOrFail(id, { populate: ROLE_POPULATE });

export const createUser = async (data, actor) => {
  if (await repo.exists({ email: data.email })) throw new ConflictError('Email is already registered');
  const role = await getRoleOrFail(data.role);
  assertOutranks(actor, role.level, 'You cannot create a user with a role at or above your own rank');

  const { password, ...rest } = data;
  const user = await repo.create({ ...rest, passwordHash: await hashPassword(password) });
  return getUser(user._id);
};

export const updateUser = async (id, data, actor) => {
  const target = await repo.findByIdOrFail(id, { populate: ROLE_POPULATE });
  assertOutranks(actor, target.role.level, 'You cannot modify a user ranked at or above you');

  if (data.email && data.email !== target.email) {
    if (await repo.exists({ email: data.email, _id: { $ne: id } })) {
      throw new ConflictError('Email is already registered');
    }
  }
  if (data.role) {
    const newRole = await getRoleOrFail(data.role);
    assertOutranks(actor, newRole.level, 'You cannot assign a role at or above your own rank');
  }

  Object.assign(target, data);
  await target.save();
  await invalidateAuthUser(id);
  return getUser(id);
};

export const changeUserStatus = async (id, status, actor) => {
  const user = await updateUser(id, { status }, actor);
  if (status !== 'active') {
    const { revokeAllSessions } = await import('../auth/auth.service.js');
    await revokeAllSessions(id);
  }
  return user;
};

export const deleteUser = async (id, actor) => {
  const target = await repo.findByIdOrFail(id, { populate: ROLE_POPULATE });
  if (String(target._id) === actor.id) throw new BusinessRuleError('You cannot delete your own account');
  assertOutranks(actor, target.role.level, 'You cannot delete a user ranked at or above you');

  target.deletedAt = new Date();
  target.status = 'banned';
  target.email = `deleted+${target._id}@${target.email.split('@')[1] || 'removed.local'}`; // free the email
  await target.save();

  const { revokeAllSessions } = await import('../auth/auth.service.js');
  await revokeAllSessions(id);
  await invalidateAuthUser(id);
  return target;
};
