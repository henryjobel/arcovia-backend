import { Role } from './role.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { BusinessRuleError, ForbiddenError, NotFoundError } from '../../core/errors/AppError.js';
import { uniqueSlug } from '../../core/utils/slugify.js';
import { cache } from '../../core/services/cache.service.js';

const repo = new BaseRepository(Role, { resourceName: 'Role' });

const assertActorOutranks = (actor, roleLevel) => {
  if (actor.permissions.includes('*')) return;
  if (roleLevel <= actor.role.level) {
    throw new ForbiddenError('You cannot manage a role at or above your own rank');
  }
};

export const listRoles = (query) =>
  repo.list(query, {
    searchFields: ['name', 'slug', 'description'],
    allowedFilters: ['isSystem', 'level'],
    defaultSort: 'level',
  });

export const getRole = (id) => repo.findByIdOrFail(id);

export const createRole = async (data, actor) => {
  assertActorOutranks(actor, data.level);
  const slug = await uniqueSlug(Role, data.name);
  return repo.create({ ...data, slug, isSystem: false });
};

export const updateRole = async (id, data, actor) => {
  const role = await repo.findByIdOrFail(id);
  if (role.slug === 'super-admin') throw new BusinessRuleError('The Super Admin role cannot be modified');
  assertActorOutranks(actor, role.level);
  if (data.level !== undefined) assertActorOutranks(actor, data.level);
  if (role.isSystem && data.name) delete data.name; // system role identity is stable

  Object.assign(role, data);
  await role.save();
  await cache.delPattern('auth:user:*'); // permissions changed → refresh cached auth users
  return role;
};

export const deleteRole = async (id, actor) => {
  const role = await repo.findByIdOrFail(id);
  if (role.isSystem) throw new BusinessRuleError('System roles cannot be deleted');
  assertActorOutranks(actor, role.level);

  const { User } = await import('../users/user.model.js');
  const inUse = await User.countDocuments({ role: role._id });
  if (inUse > 0) throw new BusinessRuleError(`Role is assigned to ${inUse} user(s). Reassign them first.`);

  await role.deleteOne();
  return role;
};

export const findRoleBySlug = async (slug) => {
  const role = await Role.findOne({ slug });
  if (!role) throw new NotFoundError(`Role '${slug}'`);
  return role;
};
