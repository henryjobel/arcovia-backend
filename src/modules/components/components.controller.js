import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';
import { COMPONENT_DEFINITIONS } from './registry.js';

/** Registry that drives the visual editor's "add section" picker + auto-forms. */
export const list = asyncHandler(async (req, res) => {
  ok(res, { data: COMPONENT_DEFINITIONS });
});
