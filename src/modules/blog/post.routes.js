import { Router } from 'express';
import * as controller from './post.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { createPostSchema, updatePostSchema, scheduleSchema, idParamSchema } from './post.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('posts.view'), controller.list);
router.post('/', authorize('posts.create'), validate({ body: createPostSchema }), audit('posts', 'create'), controller.create);

router.get('/:id', authorize('posts.view'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', authorize('posts.update'), validate({ params: idParamSchema, body: updatePostSchema }), audit('posts', 'update'), controller.update);
router.delete('/:id', authorize('posts.delete'), validate({ params: idParamSchema }), audit('posts', 'delete'), controller.remove);

router.post('/:id/duplicate', authorize('posts.create'), validate({ params: idParamSchema }), audit('posts', 'duplicate'), controller.duplicate);
router.post('/:id/publish', authorize('posts.publish'), validate({ params: idParamSchema }), audit('posts', 'publish'), controller.publish);
router.post('/:id/unpublish', authorize('posts.publish'), validate({ params: idParamSchema }), audit('posts', 'unpublish'), controller.unpublish);
router.post('/:id/schedule', authorize('posts.publish'), validate({ params: idParamSchema, body: scheduleSchema }), audit('posts', 'schedule'), controller.schedule);

export default router;
