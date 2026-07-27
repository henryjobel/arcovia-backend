import { ActivityLog } from './activityLog.model.js';
import { logger } from '../../core/utils/logger.js';

/**
 * Audit trail for mutating admin routes.
 * Usage: router.post('/', authenticate, authorize(...), audit('pages', 'create'), handler)
 * Logs fire-and-forget after the response succeeds — never blocks or fails a request.
 */
export const audit = (module, action) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    ActivityLog.create({
      actor: req.user.id,
      action,
      module,
      targetId: /^[a-f\d]{24}$/i.test(req.params?.id || '') ? req.params.id : undefined,
      summary: `${req.user.name} — ${action} ${module}${req.params?.id ? ` (${req.params.id})` : ''}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => logger.warn(`audit log failed: ${err.message}`));
  });
  next();
};
