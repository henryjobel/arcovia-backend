import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import rolesRoutes from '../modules/roles/roles.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import mediaRoutes from '../modules/media/media.routes.js';
import activityRoutes from '../modules/activity/activity.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import componentsRoutes from '../modules/components/components.routes.js';
import pagesRoutes from '../modules/pages/page.routes.js';
import contentTypesRoutes from '../modules/content/contentTypes.routes.js';
import entryRoutes from '../modules/content/entry.routes.js';
import taxonomyRoutes from '../modules/taxonomy/taxonomy.routes.js';
import postRoutes from '../modules/blog/post.routes.js';
import inquiryRoutes from '../modules/inquiries/inquiry.routes.js';
import seoRoutes from '../modules/seo/seo.routes.js';
import { permissionCatalog } from '../modules/roles/roles.controller.js';
import { getPublic as getPublicSettings } from '../modules/settings/settings.controller.js';
import { list as listComponents } from '../modules/components/components.controller.js';
import { getPublicBySlug as getPublicPage } from '../modules/pages/page.controller.js';
import { listPublic as listPublicEntries, getPublicBySlug as getPublicEntry } from '../modules/content/entry.controller.js';
import { listPublic as listPublicPosts, getPublicBySlug as getPublicPost } from '../modules/blog/post.controller.js';
import { submit as submitInquiry } from '../modules/inquiries/inquiry.controller.js';
import { getPublicMetaBySlug as getPublicPageMeta } from '../modules/pages/page.controller.js';
import { createInquirySchema } from '../modules/inquiries/inquiry.validation.js';
import { listCategories } from '../modules/taxonomy/taxonomy.service.js';
import { asyncHandler } from '../core/utils/asyncHandler.js';
import { ok } from '../core/utils/ApiResponse.js';
import { authenticate } from '../core/middlewares/authenticate.js';
import { authorize } from '../core/middlewares/authorize.js';
import { validate } from '../core/middlewares/validate.js';
import { inquiryLimiter } from '../core/middlewares/rateLimiters.js';

const router = Router();

/* auth */
router.use('/auth', authRoutes);

/* admin */
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/users', usersRoutes);
router.use('/admin/roles', rolesRoutes);
router.get('/admin/permissions', authenticate, authorize('roles.manage'), permissionCatalog);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/media', mediaRoutes);
router.use('/admin/activity', activityRoutes);
router.use('/admin/notifications', notificationsRoutes);
router.use('/admin/components', componentsRoutes);
router.use('/admin/pages', pagesRoutes);
router.use('/admin/content-types', contentTypesRoutes);
router.use('/admin/content', entryRoutes);
router.use('/admin/categories', taxonomyRoutes);
router.use('/admin/posts', postRoutes);
router.use('/admin/inquiries', inquiryRoutes);
router.use('/admin/seo', seoRoutes);

/* public delivery (grows in Phase 2: pages, menus, sliders…) */
router.get('/public/settings', getPublicSettings);
router.get('/public/components', listComponents);
router.get('/public/pages/:slug', getPublicPage);
router.get('/public/page-meta/:slug', getPublicPageMeta);
router.get('/public/entries/:typeKey', listPublicEntries);
router.get('/public/entries/:typeKey/:slug', getPublicEntry);
router.get('/public/posts', listPublicPosts);
router.get('/public/posts/:slug', getPublicPost);
router.post('/public/inquiries', inquiryLimiter, validate({ body: createInquirySchema }), submitInquiry);
router.get(
  '/public/categories',
  asyncHandler(async (req, res) => ok(res, { data: await listCategories(req.query.taxonomy) }))
);

export default router;
