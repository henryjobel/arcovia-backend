import { Router } from 'express';
import * as controller from './inquiry.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { idParamSchema, updateInquirySchema } from './inquiry.validation.js';

const router = Router();

router.use(authenticate);
router.get('/', authorize('submissions.view'), controller.list);
router.get('/:id', authorize('submissions.view'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', authorize('forms.manage'), validate({ params: idParamSchema, body: updateInquirySchema }), audit('inquiries', 'update'), controller.update);
router.delete('/:id', authorize('forms.manage'), validate({ params: idParamSchema }), audit('inquiries', 'delete'), controller.remove);

export default router;
