import { Router } from 'express';
import * as controller from './contentTypes.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('content.manage'), controller.list);

export default router;
