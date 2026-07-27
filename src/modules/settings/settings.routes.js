import { Router } from 'express';
import * as controller from './settings.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { groupParamSchema, smtpTestSchema } from './settings.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('settings.view'), controller.getAll);
router.post('/smtp/test', authorize('settings.update'), validate({ body: smtpTestSchema }), controller.testSmtp);
router.get('/:group', authorize('settings.view'), validate({ params: groupParamSchema }), controller.getGroup);
router.put('/:group', authorize('settings.update'), validate({ params: groupParamSchema }), audit('settings', 'update'), controller.updateGroup);

export default router;
