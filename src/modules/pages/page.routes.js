import { Router } from 'express';
import * as controller from './page.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { createPageSchema, updatePageSchema, reorderSchema, idParamSchema, revisionParamSchema } from './page.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('pages.view'), controller.list);
router.post('/', authorize('pages.create'), validate({ body: createPageSchema }), audit('pages', 'create'), controller.create);

router.get('/:id', authorize('pages.view'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', authorize('pages.update'), validate({ params: idParamSchema, body: updatePageSchema }), audit('pages', 'update'), controller.update);
router.delete('/:id', authorize('pages.delete'), validate({ params: idParamSchema }), audit('pages', 'delete'), controller.remove);

router.post('/:id/duplicate', authorize('pages.create'), validate({ params: idParamSchema }), audit('pages', 'duplicate'), controller.duplicate);
router.patch('/:id/sections/reorder', authorize('pages.update'), validate({ params: idParamSchema, body: reorderSchema }), audit('pages', 'reorder'), controller.reorder);

router.post('/:id/publish', authorize('pages.publish'), validate({ params: idParamSchema }), audit('pages', 'publish'), controller.publish);
router.post('/:id/unpublish', authorize('pages.publish'), validate({ params: idParamSchema }), audit('pages', 'unpublish'), controller.unpublish);

router.get('/:id/preview', authorize('pages.view'), validate({ params: idParamSchema }), controller.preview);
router.get('/:id/revisions', authorize('pages.update'), validate({ params: idParamSchema }), controller.revisions);
router.post(
  '/:id/revisions/:revisionId/restore',
  authorize('pages.update'),
  validate({ params: revisionParamSchema }),
  audit('pages', 'restore-revision'),
  controller.restoreRevision
);

export default router;
