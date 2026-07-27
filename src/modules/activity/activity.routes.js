import { Router } from 'express';
import { ActivityLog } from './activityLog.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { paginated } from '../../core/utils/ApiResponse.js';

const repo = new BaseRepository(ActivityLog, { resourceName: 'Activity' });
const router = Router();

router.get(
  '/',
  authenticate,
  authorize('activity.view'),
  asyncHandler(async (req, res) => {
    const { data, pagination } = await repo.list(req.query, {
      searchFields: ['summary'],
      allowedFilters: ['module', 'action', 'actor', 'createdAt'],
      populate: { path: 'actor', select: 'name email' },
    });
    paginated(res, { data, pagination });
  })
);

export default router;
