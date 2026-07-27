import * as service from './settings.service.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { ok } from '../../core/utils/ApiResponse.js';
import { sendMail, renderBasicTemplate } from '../../core/services/mail.service.js';

export const getAll = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getAllGroups() });
});

export const getGroup = asyncHandler(async (req, res) => {
  ok(res, { data: await service.getGroup(req.params.group) });
});

export const updateGroup = asyncHandler(async (req, res) => {
  ok(res, {
    message: `Settings '${req.params.group}' saved`,
    data: await service.updateGroup(req.params.group, req.body, req.user.id),
  });
});

export const testSmtp = asyncHandler(async (req, res) => {
  await sendMail({
    to: req.body.to,
    subject: 'Avron CMS — SMTP test',
    html: renderBasicTemplate({
      title: 'SMTP works 🎉',
      bodyHtml: '<p>This is a test email from your Avron CMS settings. Your SMTP configuration is working.</p>',
    }),
    text: 'This is a test email from Avron CMS. SMTP works.',
  });
  ok(res, { message: `Test email sent to ${req.body.to}` });
});

export const getPublic = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  ok(res, { data: await service.getPublicSettings() });
});
