import { Router } from 'express';
import * as controller from './media.controller.js';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { authorize } from '../../core/middlewares/authorize.js';
import { validate } from '../../core/middlewares/validate.js';
import { uploadFiles, uploadSingle } from '../../core/middlewares/upload.js';
import { audit } from '../activity/audit.middleware.js';
import {
  uploadBodySchema, updateAssetSchema, bulkDeleteSchema,
  createFolderSchema, updateFolderSchema, idParamSchema,
} from './media.validation.js';

const router = Router();

router.use(authenticate);

// folders (before /:id so 'folders' isn't captured as an id)
router.get('/folders', authorize('media.view'), controller.folders);
router.post('/folders', authorize('media.update'), validate({ body: createFolderSchema }), audit('media', 'create-folder'), controller.createFolder);
router.patch('/folders/:id', authorize('media.update'), validate({ params: idParamSchema, body: updateFolderSchema }), audit('media', 'rename-folder'), controller.renameFolder);
router.delete('/folders/:id', authorize('media.delete'), validate({ params: idParamSchema }), audit('media', 'delete-folder'), controller.deleteFolder);

// assets
router.get('/', authorize('media.view'), controller.list);
router.post('/upload', authorize('media.upload'), uploadFiles, validate({ body: uploadBodySchema }), audit('media', 'upload'), controller.upload);
router.post('/bulk-delete', authorize('media.delete'), validate({ body: bulkDeleteSchema }), audit('media', 'bulk-delete'), controller.bulkDelete);
router.get('/:id', authorize('media.view'), validate({ params: idParamSchema }), controller.getOne);
router.patch('/:id', authorize('media.update'), validate({ params: idParamSchema, body: updateAssetSchema }), audit('media', 'update'), controller.update);
router.post('/:id/replace', authorize('media.update'), uploadSingle, validate({ params: idParamSchema }), audit('media', 'replace'), controller.replace);
router.delete('/:id', authorize('media.delete'), validate({ params: idParamSchema }), audit('media', 'delete'), controller.remove);

export default router;
