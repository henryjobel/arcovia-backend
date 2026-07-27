import { Inquiry } from './inquiry.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { notifyRoles } from '../notifications/notifications.service.js';

const repo = new BaseRepository(Inquiry, { resourceName: 'Inquiry' });

export const createInquiry = async (data, requestMeta = {}) => {
  const inquiry = await repo.create({
    ...data,
    email: data.email.toLowerCase(),
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
  });

  await notifyRoles(['super-admin', 'admin', 'editor'], {
    type: 'form.submitted',
    title: 'New website inquiry',
    body: `${inquiry.name} submitted a contact inquiry.`,
    link: '/admin/inquiries',
    meta: { inquiryId: inquiry._id },
  });

  return inquiry;
};

export const listInquiries = (query) =>
  repo.list(query, {
    searchFields: ['name', 'email', 'phone', 'message'],
    allowedFilters: ['status', 'source'],
    baseFilter: { deletedAt: null },
    defaultSort: '-createdAt',
  });

export const getInquiry = (id) => repo.findByIdOrFail(id);

export const updateInquiry = async (id, patch, actorId) => {
  const inquiry = await repo.findByIdOrFail(id);
  if (patch.status !== undefined) inquiry.status = patch.status;
  if (patch.adminNotes !== undefined) inquiry.adminNotes = patch.adminNotes;
  inquiry.updatedBy = actorId;
  await inquiry.save();
  return inquiry;
};

export const deleteInquiry = (id) => repo.softDeleteById(id);
