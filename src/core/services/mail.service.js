import nodemailer from 'nodemailer';
import { env, isDev } from '../../config/env.js';
import { logger } from '../utils/logger.js';
import { BusinessRuleError } from '../errors/AppError.js';

/**
 * SMTP config is read from the Settings module at send time (admin-editable),
 * falling back to env vars for bootstrap. Imported lazily to avoid module cycles.
 */
const resolveSmtpConfig = async () => {
  const { getGroupValues } = await import('../../modules/settings/settings.service.js');
  const s = (await getGroupValues('smtp').catch(() => null)) || {};
  return {
    host: s.host || env.SMTP_HOST,
    port: Number(s.port || env.SMTP_PORT),
    secure: typeof s.secure === 'boolean' ? s.secure : env.SMTP_SECURE,
    user: s.username || env.SMTP_USER,
    pass: s.password || env.SMTP_PASS,
    fromName: s.fromName || env.SMTP_FROM_NAME,
    fromEmail: s.fromEmail || env.SMTP_FROM_EMAIL,
    replyTo: s.replyTo || undefined,
  };
};

export const isMailConfigured = async () => {
  const cfg = await resolveSmtpConfig();
  return Boolean(cfg.host);
};

/**
 * @param {object} opts { to, subject, html, text }
 * @throws BusinessRuleError when SMTP is not configured
 */
export const sendMail = async ({ to, subject, html, text }) => {
  const cfg = await resolveSmtpConfig();

  if (!cfg.host) {
    if (isDev) {
      logger.warn(`[mail:dev] SMTP not configured — email to ${to} ("${subject}") was NOT sent`);
      logger.debug(`[mail:dev] body:\n${text || html}`);
      return { skipped: true };
    }
    throw new BusinessRuleError('SMTP is not configured. Set it in Settings → SMTP.');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });

  const info = await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    replyTo: cfg.replyTo,
    to,
    subject,
    html,
    text,
  });

  logger.info(`Email sent to ${to}: ${subject} (${info.messageId})`);
  return info;
};

/** Minimal transactional wrapper until the EmailTemplate module ships (Phase 3). */
export const renderBasicTemplate = ({ title, bodyHtml, footer = 'Avron Studio' }) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h2 style="margin:0 0 16px">${title}</h2>
    <div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="font-size:12px;color:#888">${footer}</p>
  </div>`;
