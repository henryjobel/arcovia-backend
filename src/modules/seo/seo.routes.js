import { Router } from 'express';
import * as controller from './seo.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { seoTargetParamSchema, updateSeoSchema } from './seo.validation.js';

const router = Router();

router.use(authenticate, authorize('seo.manage'));
router.get('/', controller.list);
router.patch('/:kind/:id', validate({ params: seoTargetParamSchema, body: updateSeoSchema }), audit('seo', 'update'), controller.update);

export default router;
