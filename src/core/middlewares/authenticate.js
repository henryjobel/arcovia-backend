import { verifyToken } from '../utils/token.js';
import { AuthError } from '../errors/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cache } from '../services/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '../../config/constants.js';

/** Effective permissions = role permissions + per-user grants − per-user revokes. */
const resolvePermissions = (user) => {
  const fromRole = user.role?.permissions || [];
  const granted = new Set([...fromRole, ...(user.extraPermissions || [])]);
  for (const denied of user.deniedPermissions || []) granted.delete(denied);
  return [...granted];
};

const loadAuthUser = async (userId) => {
  const cacheKey = CACHE_KEYS.userAuth(userId);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const { User } = await import('../../modules/users/user.model.js');
  const user = await User.findById(userId).populate('role', 'slug name level permissions').lean();
  if (!user) return null;

  const authUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    status: user.status,
    tokenVersion: user.tokenVersion || 0,
    role: user.role ? { id: String(user.role._id), slug: user.role.slug, name: user.role.name, level: user.role.level } : null,
    permissions: resolvePermissions(user),
    twoFactorEnabled: Boolean(user.twoFactor?.enabled),
  };
  await cache.set(cacheKey, authUser, CACHE_TTL.userAuth);
  return authUser;
};

/** Invalidate the auth cache after any user/role mutation. */
export const invalidateAuthUser = (userId) => cache.del(CACHE_KEYS.userAuth(String(userId)));

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new AuthError('Authentication required');

  const payload = verifyToken(header.slice(7));
  const user = await loadAuthUser(payload.sub);

  if (!user) throw new AuthError('Account no longer exists');
  if (user.status !== 'active') throw new AuthError('Account is not active', 'ACCOUNT_INACTIVE');
  if ((payload.tv || 0) !== user.tokenVersion) throw new AuthError('Session invalidated, please log in again');

  req.user = user;
  next();
});
