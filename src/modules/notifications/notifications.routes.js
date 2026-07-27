import { Router } from 'express';
import * as service from './notifications.service.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const { data, unread, pagination } = await service.listForUser(req.user.id, {
      page,
      limit,
      unreadOnly: req.query.unread === 'true',
    });
    ok(res, { data, meta: { pagination, unread } });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await service.markRead(req.user.id, req.params.id);
    ok(res, { message: 'Marked as read' });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await service.markAllRead(req.user.id);
    ok(res, { message: 'All notifications marked as read' });
  })
);

export default router;
