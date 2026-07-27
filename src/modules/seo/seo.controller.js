import * as service from './seo.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, { data: await service.listSeoTargets(req.query) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, {
    message: 'SEO settings saved',
    data: await service.updateSeoTarget(req.params.kind, req.params.id, req.body.seo, req.user.id),
  });
});
