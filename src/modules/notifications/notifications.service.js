import { Notification } from './notification.model.js';
import { logger } from '../../core/utils/logger.js';

export const notifyUser = (recipientId, { type = 'system', title, body, link, meta }) =>
  Notification.create({ recipient: recipientId, type, title, body, link, meta }).catch((err) =>
    logger.warn(`notification failed: ${err.message}`)
  );

/** Fan-out a notification to every active user holding any of the given role slugs. */
export const notifyRoles = async (roleSlugs, payload) => {
  const { Role } = await import('../roles/role.model.js');
  const { User } = await import('../users/user.model.js');

  const roles = await Role.find({ slug: { $in: roleSlugs } }).select('_id');
  const users = await User.find({ role: { $in: roles.map((r) => r._id) }, status: 'active', deletedAt: null }).select('_id');
  await Promise.all(users.map((u) => notifyUser(u._id, payload)));
};

export const listForUser = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipient: userId, ...(unreadOnly ? { readAt: null } : {}) };
  const [data, total, unread] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, readAt: null }),
  ]);
  return {
    data,
    unread,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasNext: page * limit < total, hasPrev: page > 1 },
  };
};

export const markRead = (userId, id) =>
  Notification.updateOne({ _id: id, recipient: userId, readAt: null }, { readAt: new Date() });

export const markAllRead = (userId) =>
  Notification.updateMany({ recipient: userId, readAt: null }, { readAt: new Date() });
