import * as service from './inquiry.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { created, ok, paginated } from '../../core/utils/ApiResponse.js';

export const submit = asyncHandler(async (req, res) => {
  const inquiry = await service.createInquiry(req.body, { ip: req.ip, userAgent: req.headers['user-agent'] });
  created(res, {
    message: 'Your inquiry has been received',
    data: { id: inquiry._id, status: inquiry.status },
  });
});

export const list = asyncHandler(async (req, res) => {
  const { data, pagination } = await service.listInquiries(req.query);
  paginated(res, { data, pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getInquiry(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  ok(res, { message: 'Inquiry updated', data: await service.updateInquiry(req.params.id, req.body, req.user.id) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteInquiry(req.params.id);
  ok(res, { message: 'Inquiry deleted' });
});
