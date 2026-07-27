import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';
import { dbPing } from '../../config/db.js';
import { redisPing } from '../../config/redis.js';
import { cloudinaryPing } from '../../core/services/cloudinary.service.js';
import { User } from '../users/user.model.js';
import { MediaAsset } from '../media/mediaAsset.model.js';
import { ActivityLog } from '../activity/activityLog.model.js';
import { Notification } from '../notifications/notification.model.js';
import { Session } from '../auth/session.model.js';

const router = Router();

/**
 * Single round-trip dashboard payload.
 * Commerce/analytics widgets return null until their phases ship —
 * the admin UI renders "coming soon" states off that.
 */
router.get(
  '/',
  authenticate,
  authorize('dashboard.view'),
  asyncHandler(async (req, res) => {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, newUsers30d, usersByRole,
      mediaCount, mediaBytes,
      recentActivity, unreadNotifications, activeSessions,
      mongoOk, redisOk, cloudinaryOk,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, status: 'active' }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: since30d } }),
      User.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'role' } },
        { $unwind: '$role' },
        { $project: { _id: 0, role: '$role.name', slug: '$role.slug', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      MediaAsset.countDocuments({ deletedAt: null }),
      MediaAsset.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: null, bytes: { $sum: '$bytes' } } },
      ]).then((r) => r[0]?.bytes || 0),
      ActivityLog.find().sort('-createdAt').limit(10).populate('actor', 'name email').lean(),
      Notification.countDocuments({ recipient: req.user.id, readAt: null }),
      Session.countDocuments({ revokedAt: null, expiresAt: { $gt: new Date() } }),
      dbPing(),
      redisPing(),
      cloudinaryPing(),
    ]);

    ok(res, {
      data: {
        users: { total: totalUsers, active: activeUsers, new30d: newUsers30d, byRole: usersByRole },
        media: { total: mediaCount, bytes: mediaBytes },
        recentActivity,
        unreadNotifications,
        activeSessions,
        // populated by later phases:
        visitors: null, // Phase 5 — analytics
        orders: null,   // Phase 4 — commerce
        revenue: null,  // Phase 4 — commerce
        content: null,  // Phase 2/3 — pages & posts counts
        system: {
          status: mongoOk ? 'healthy' : 'degraded',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
          memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          mongo: mongoOk,
          mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          redis: redisOk === null ? 'not-configured' : redisOk,
          cloudinary: cloudinaryOk === null ? 'not-configured' : cloudinaryOk,
        },
      },
    });
  })
);

export default router;
