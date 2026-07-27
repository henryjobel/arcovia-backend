import { ForbiddenError, AuthError } from '../errors/AppError.js';

/** Wildcard-aware check: '*' grants all, 'pages.*' grants the module. */
export const hasPermission = (userPermissions = [], required) => {
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(required)) return true;
  const module = required.split('.')[0];
  return userPermissions.includes(`${module}.*`);
};

/**
 * Usage: router.post('/', authenticate, authorize('pages.create'), handler)
 * Multiple keys = ALL are required.
 */
export const authorize = (...required) => (req, res, next) => {
  if (!req.user) return next(new AuthError());
  const missing = required.filter((perm) => !hasPermission(req.user.permissions, perm));
  if (missing.length) {
    return next(new ForbiddenError(`Missing permission: ${missing.join(', ')}`));
  }
  next();
};
