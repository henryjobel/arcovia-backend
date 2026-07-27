import { z } from 'zod';

const tString = z.record(z.string(), z.string());
const mediaId = z.string().regex(/^[a-f\d]{24}$/i).nullable();
const optionalUrl = z.string().url().or(z.literal('')).optional();

const socialItem = z.object({ url: optionalUrl.default(''), visible: z.boolean().optional() }).partial();

/** Per-group Zod schemas — PUT /admin/settings/:group validates against these. */
export const GROUP_SCHEMAS = {
  general: z.object({
    siteName: tString,
    tagline: tString,
    defaultLanguage: z.string().min(2).max(10),
    timezone: z.string().max(60),
    dateFormat: z.string().max(30),
    currency: z.object({
      code: z.string().min(2).max(5),
      symbol: z.string().max(5),
      position: z.enum(['before', 'after']),
    }),
  }).partial(),

  branding: z.object({
    logo: mediaId, logoDark: mediaId, logoLight: mediaId,
    footerLogo: mediaId, favicon: mediaId, loader: mediaId,
    primaryColor: z.string().max(30),
    secondaryColor: z.string().max(30),
  }).partial(),

  contact: z.object({
    email: z.string().email().or(z.literal('')),
    phone: z.string().max(30),
    whatsapp: z.string().max(40),
    messenger: z.string().max(200),
    address: tString,
    googleMap: z.object({
      embedUrl: z.string().max(2000).optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    }).partial(),
    businessHours: z.array(z.object({
      day: z.string(),
      open: z.string().max(10),
      close: z.string().max(10),
      closed: z.boolean(),
    })),
  }).partial(),

  social: z.object({
    facebook: socialItem, instagram: socialItem, linkedin: socialItem,
    youtube: socialItem, twitter: socialItem, tiktok: socialItem,
    pinterest: socialItem, github: socialItem,
  }).partial(),

  seoDefaults: z.object({
    titleTemplate: z.string().max(120),
    metaTitle: tString,
    metaDescription: tString,
    keywords: z.array(z.string().max(80)),
    ogDefaultImage: mediaId,
    robots: z.object({ index: z.boolean(), follow: z.boolean() }).partial(),
    twitterHandle: z.string().max(50),
  }).partial(),

  scripts: z.object({
    googleAnalyticsId: z.string().max(40),
    gtmId: z.string().max(40),
    facebookPixelId: z.string().max(40),
    metaPixelId: z.string().max(40),
    headerScripts: z.string().max(20000),
    footerScripts: z.string().max(20000),
    bodyStartScripts: z.string().max(20000),
  }).partial(),

  maintenance: z.object({
    enabled: z.boolean(),
    title: tString,
    message: tString,
    image: mediaId,
    allowedIps: z.array(z.string().max(50)),
    expectedBackAt: z.string().datetime().nullable(),
  }).partial(),

  smtp: z.object({
    host: z.string().max(200),
    port: z.number().int().min(1).max(65535),
    secure: z.boolean(),
    username: z.string().max(200),
    password: z.string().max(200),
    fromName: z.string().max(100),
    fromEmail: z.string().email().or(z.literal('')),
    replyTo: z.string().email().or(z.literal('')),
  }).partial(),

  commerce: z.object({
    ordersEnabled: z.boolean(),
    guestCheckout: z.boolean(),
    invoicePrefix: z.string().max(10),
    taxRatePercent: z.number().min(0).max(100),
    lowStockThreshold: z.number().int().min(0),
    reviewAutoApprove: z.boolean(),
  }).partial(),

  security: z.object({
    corsOrigins: z.array(z.string().url()),
    adminEmailAlerts: z.boolean(),
    recaptcha: z.object({
      enabled: z.boolean(),
      siteKey: z.string().max(200),
      secret: z.string().max(200),
    }).partial(),
  }).partial(),

  robotsTxt: z.object({
    content: z.string().max(10000),
  }).partial(),
};

export const groupParamSchema = z.object({
  group: z.enum(Object.keys(GROUP_SCHEMAS)),
});

export const smtpTestSchema = z.object({
  to: z.string().email(),
});
