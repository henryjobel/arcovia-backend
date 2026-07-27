import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';
import { CONTENT_TYPES } from './contentTypes.registry.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, { data: CONTENT_TYPES });
});
