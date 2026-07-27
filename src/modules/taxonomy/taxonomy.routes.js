import { Router } from 'express';
import * as controller from './taxonomy.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { audit } from '../activity/audit.middleware.js';
import { listQuerySchema, createCategorySchema, updateCategorySchema, reorderSchema, idParamSchema } from './taxonomy.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('taxonomy.manage'), validate({ query: listQuerySchema }), controller.list);
router.post('/', authorize('taxonomy.manage'), validate({ body: createCategorySchema }), audit('taxonomy', 'create'), controller.create);
router.patch('/reorder', authorize('taxonomy.manage'), validate({ body: reorderSchema }), audit('taxonomy', 'reorder'), controller.reorder);
router.patch('/:id', authorize('taxonomy.manage'), validate({ params: idParamSchema, body: updateCategorySchema }), audit('taxonomy', 'update'), controller.update);
router.delete('/:id', authorize('taxonomy.manage'), validate({ params: idParamSchema }), audit('taxonomy', 'delete'), controller.remove);

export default router;
