import { Router } from 'express';
import * as controller from './entry.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { createEntrySchema, updateEntrySchema, reorderSchema, typeKeyParamSchema, idParamSchema } from './entry.validation.js';

const router = Router();

router.use(authenticate);

router.get('/:typeKey', authorize('content.manage'), validate({ params: typeKeyParamSchema }), controller.list);
router.post('/:typeKey', authorize('content.manage'), validate({ params: typeKeyParamSchema, body: createEntrySchema }), audit('content', 'create'), controller.create);
router.patch('/:typeKey/reorder', authorize('content.manage'), validate({ params: typeKeyParamSchema, body: reorderSchema }), audit('content', 'reorder'), controller.reorder);

router.get('/:typeKey/:id', authorize('content.manage'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:typeKey/:id', authorize('content.manage'), validate({ params: idParamSchema, body: updateEntrySchema }), audit('content', 'update'), controller.update);
router.delete('/:typeKey/:id', authorize('content.manage'), validate({ params: idParamSchema }), audit('content', 'delete'), controller.remove);

router.post('/:typeKey/:id/duplicate', authorize('content.manage'), validate({ params: idParamSchema }), audit('content', 'duplicate'), controller.duplicate);
router.post('/:typeKey/:id/publish', authorize('content.manage'), validate({ params: idParamSchema }), audit('content', 'publish'), controller.publish);
router.post('/:typeKey/:id/unpublish', authorize('content.manage'), validate({ params: idParamSchema }), audit('content', 'unpublish'), controller.unpublish);

export default router;
