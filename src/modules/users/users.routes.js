import { Router } from 'express';
import * as controller from './users.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import {
  createUserSchema, updateUserSchema, updateStatusSchema,
  updateRoleSchema, idParamSchema,
} from './users.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('users.view'), controller.list);
router.post('/', authorize('users.create'), validate({ body: createUserSchema }), audit('users', 'create'), controller.create);
router.get('/:id', authorize('users.view'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', authorize('users.update'), validate({ params: idParamSchema, body: updateUserSchema }), audit('users', 'update'), controller.update);
router.patch('/:id/status', authorize('users.update'), validate({ params: idParamSchema, body: updateStatusSchema }), audit('users', 'update-status'), controller.updateStatus);
router.patch('/:id/role', authorize('users.update'), validate({ params: idParamSchema, body: updateRoleSchema }), audit('users', 'update-role'), controller.updateRole);
router.delete('/:id', authorize('users.delete'), validate({ params: idParamSchema }), audit('users', 'delete'), controller.remove);

export default router;
