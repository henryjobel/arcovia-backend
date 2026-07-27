/**
 * Central catalog of every permission key in the system.
 * Roles hold arrays of these strings (or wildcards: '*', 'pages.*').
 * The role-editor UI reads this catalog from GET /admin/permissions.
 */
export const PERMISSIONS = {
  dashboard: ['dashboard.view'],
  analytics: ['analytics.view'],
  users: ['users.view', 'users.create', 'users.update', 'users.delete'],
  roles: ['roles.manage'],
  settings: ['settings.view', 'settings.update'],
  media: ['media.view', 'media.upload', 'media.update', 'media.delete'],
  pages: ['pages.view', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish'],
  menus: ['menus.manage'],
  sliders: ['sliders.manage'],
  popups: ['popups.manage'],
  forms: ['forms.manage', 'submissions.view'],
  content: ['content.manage'],
  taxonomy: ['taxonomy.manage'],
  posts: ['posts.view', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish'],
  comments: ['comments.moderate'],
  products: ['products.view', 'products.create', 'products.update', 'products.delete'],
  orders: ['orders.view', 'orders.update', 'orders.refund'],
  coupons: ['coupons.manage'],
  marketing: ['marketing.manage'],
  seo: ['seo.manage'],
  activity: ['activity.view'],
};

export const PERMISSION_CATALOG = Object.values(PERMISSIONS).flat();

const all = (...groups) => groups.flatMap((g) => PERMISSIONS[g]);

/**
 * Seeded system roles. `level`: lower number = higher rank.
 * Rule: an actor may only manage users / assign roles whose level is
 * strictly greater than their own.
 */
export const ROLE_DEFINITIONS = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    level: 1,
    isSystem: true,
    description: 'Full unrestricted access. Cannot be edited or deleted.',
    permissions: ['*'],
  },
  {
    name: 'Admin',
    slug: 'admin',
    level: 2,
    isSystem: true,
    description: 'Everything except role management.',
    permissions: PERMISSION_CATALOG.filter((p) => p !== 'roles.manage'),
  },
  {
    name: 'Manager',
    slug: 'manager',
    level: 3,
    isSystem: true,
    description: 'Commerce operations: orders, products, customers, coupons, analytics.',
    permissions: [
      ...all('dashboard', 'analytics', 'products', 'orders', 'coupons', 'marketing'),
      'users.view',
      'media.view',
      'media.upload',
    ],
  },
  {
    name: 'Editor',
    slug: 'editor',
    level: 4,
    isSystem: true,
    description: 'Full content control: pages, posts, media, menus, sliders, popups, forms, SEO.',
    permissions: [
      ...all(
        'dashboard', 'pages', 'posts', 'comments', 'media', 'menus',
        'sliders', 'popups', 'forms', 'content', 'taxonomy', 'seo'
      ),
    ],
  },
  {
    name: 'Content Writer',
    slug: 'content-writer',
    level: 5,
    isSystem: true,
    description: 'Writes and edits draft posts. Cannot publish.',
    permissions: ['dashboard.view', 'posts.view', 'posts.create', 'posts.update', 'media.view', 'media.upload'],
  },
  {
    name: 'Staff',
    slug: 'staff',
    level: 6,
    isSystem: true,
    description: 'Read-only operations: dashboard, orders, form submissions.',
    permissions: ['dashboard.view', 'orders.view', 'submissions.view'],
  },
  {
    name: 'Customer',
    slug: 'customer',
    level: 100,
    isSystem: true,
    description: 'Website customer. No admin access.',
    permissions: [],
  },
];

export const USER_STATUS = ['active', 'pending', 'suspended', 'banned'];

export const MEDIA_KINDS = ['image', 'video', 'pdf', 'document', 'audio', 'other'];

export const CACHE_KEYS = {
  settingsPublic: 'settings:public',
  settingsGroup: (group) => `settings:group:${group}`,
  userAuth: (id) => `auth:user:${id}`,
};

export const CACHE_TTL = {
  userAuth: 60, // seconds
  settings: 0, // 0 = no expiry (invalidated on write)
};

/** Sentinel returned instead of stored secrets; if sent back unchanged, the old value is kept. */
export const SECRET_MASK = '••••••••';
