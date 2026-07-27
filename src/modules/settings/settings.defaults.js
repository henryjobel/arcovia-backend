/**
 * Seed defaults for every settings group. `isPublic` groups are merged into
 * GET /public/settings for the website; private groups never leave the admin API.
 * Media fields hold MediaAsset ObjectIds (null until chosen in the Media Library).
 */
export const SETTINGS_DEFAULTS = {
  general: {
    isPublic: true,
    values: {
      siteName: { en: 'Avron Studio' },
      tagline: { en: 'Creative Digital Agency' },
      defaultLanguage: 'en',
      timezone: 'Asia/Dhaka',
      dateFormat: 'DD MMM YYYY',
      currency: { code: 'BDT', symbol: '৳', position: 'before' },
    },
  },

  branding: {
    isPublic: true,
    values: {
      logo: null,
      logoDark: null,
      logoLight: null,
      footerLogo: null,
      favicon: null,
      loader: null,
      primaryColor: '#111111',
      secondaryColor: '#c9a962',
    },
  },

  contact: {
    isPublic: true,
    values: {
      email: 'hello@avronstudio.com',
      phone: '',
      whatsapp: '',
      messenger: '',
      address: { en: '' },
      googleMap: { embedUrl: '', lat: null, lng: null },
      businessHours: [
        { day: 'Sunday', open: '10:00', close: '18:00', closed: false },
        { day: 'Monday', open: '10:00', close: '18:00', closed: false },
        { day: 'Tuesday', open: '10:00', close: '18:00', closed: false },
        { day: 'Wednesday', open: '10:00', close: '18:00', closed: false },
        { day: 'Thursday', open: '10:00', close: '18:00', closed: false },
        { day: 'Friday', open: '', close: '', closed: true },
        { day: 'Saturday', open: '10:00', close: '18:00', closed: false },
      ],
    },
  },

  social: {
    isPublic: true,
    values: {
      facebook: { url: '', visible: true },
      instagram: { url: '', visible: true },
      linkedin: { url: '', visible: true },
      youtube: { url: '', visible: false },
      twitter: { url: '', visible: false },
      tiktok: { url: '', visible: false },
      pinterest: { url: '', visible: false },
      github: { url: '', visible: false },
    },
  },

  seoDefaults: {
    isPublic: true,
    values: {
      titleTemplate: '%s — Avron Studio',
      metaTitle: { en: 'Avron Studio — Creative Digital Agency' },
      metaDescription: { en: '' },
      keywords: [],
      ogDefaultImage: null,
      robots: { index: true, follow: true },
      twitterHandle: '',
    },
  },

  scripts: {
    isPublic: true,
    values: {
      googleAnalyticsId: '',
      gtmId: '',
      facebookPixelId: '',
      metaPixelId: '',
      headerScripts: '',
      footerScripts: '',
      bodyStartScripts: '',
    },
  },

  maintenance: {
    isPublic: true,
    values: {
      enabled: false,
      title: { en: 'We’ll be back soon' },
      message: { en: 'Our website is under scheduled maintenance. Please check back shortly.' },
      image: null,
      allowedIps: [],
      expectedBackAt: null,
    },
  },

  smtp: {
    isPublic: false,
    values: {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromName: 'Avron Studio',
      fromEmail: '',
      replyTo: '',
    },
  },

  commerce: {
    isPublic: false,
    values: {
      ordersEnabled: true,
      guestCheckout: true,
      invoicePrefix: 'AVR',
      taxRatePercent: 0,
      lowStockThreshold: 5,
      reviewAutoApprove: false,
    },
  },

  security: {
    isPublic: false,
    values: {
      corsOrigins: [],
      adminEmailAlerts: true,
      recaptcha: { enabled: false, siteKey: '', secret: '' },
    },
  },

  robotsTxt: {
    isPublic: true,
    values: {
      content: 'User-agent: *\nAllow: /\n',
    },
  },
};

/** Keys whose values must never be serialized to any client. */
export const SECRET_PATHS = {
  smtp: ['password'],
  security: ['recaptcha.secret'],
};
