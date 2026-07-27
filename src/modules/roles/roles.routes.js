import { Router } from 'express';
import * as controller from './roles.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { createRoleSchema, updateRoleSchema, idParamSchema } from './roles.validation.js';

const router = Router();

router.use(authenticate, authorize('roles.manage'));

router.get('/', controller.list);
router.post('/', validate({ body: createRoleSchema }), audit('roles', 'create'), controller.create);
router.get('/:id', validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', validate({ params: idParamSchema, body: updateRoleSchema }), audit('roles', 'update'), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), audit('roles', 'delete'), controller.remove);

export default router;
