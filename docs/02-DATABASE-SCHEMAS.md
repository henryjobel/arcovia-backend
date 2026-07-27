# Avron CMS — MongoDB Schema Architecture

> ~35 collections organized by module. Reusable sub-schemas are defined once (§1) and embedded
> everywhere — this is what keeps the design normalized without collection sprawl.
>
> Conventions used below:
> - All collections get `{ timestamps: true }` (createdAt/updatedAt) — omitted from listings.
> - `TString` = **TranslatableString** = `Map<localeCode, String>` (e.g. `{ en: "About us", bn: "..." }`).
>   The delivery layer resolves it to one string with default-locale fallback.
> - `→Model` = `ObjectId` ref. `Mixed` = `Schema.Types.Mixed` (always validated by Zod before write).
> - Money is stored as `Number` in the store currency's minor-safe decimal (2dp), snapshotted onto
>   orders so historical totals never drift.

---

## 1. Reusable sub-schemas (embedded, never separate collections)

### 1.1 `seoSchema` — embedded on Page, Post, Product, Category, Entry, Brand

```js
{
  metaTitle:       TString,
  metaDescription: TString,
  keywords:        [String],
  canonicalUrl:    String,
  robots:          { index: {type: Boolean, default: true}, follow: {type: Boolean, default: true} },
  og:              { title: TString, description: TString, image: →MediaAsset, type: String },
  twitter:         { card: {type: String, enum: ['summary','summary_large_image'], default: 'summary_large_image'},
                     title: TString, description: TString, image: →MediaAsset },
  schemaJsonLd:    Mixed,                       // raw JSON-LD object, rendered as-is
  sitemap:         { include: {type: Boolean, default: true},
                     priority: {type: Number, min: 0, max: 1, default: 0.7},
                     changefreq: {type: String, enum: ['always','hourly','daily','weekly','monthly','yearly','never'], default: 'weekly'} }
}
```

Global SEO defaults live in `Setting(group:'seoDefaults')`; per-entity fields override per key.

### 1.2 `mediaRefSchema` — every image/video usage across the CMS

```js
{
  asset: →MediaAsset,                            // single source of truth (URL, dimensions…)
  alt:   TString,                                // optional per-usage override of asset.alt
  caption: TString,
  transform: String                              // optional cloudinary transform, e.g. "c_fill,w_800"
}
```

### 1.3 `linkSchema` — every button/menu/CTA target

```js
{
  type:   { type: String, enum: ['none','url','page','post','product','category','entry','scroll','email','phone'], default: 'url' },
  url:    String,                                // when type=url | scroll(#id) | email | phone
  ref:    ObjectId,                              // when type points at an internal document
  refModel: String,                              // 'Page' | 'Post' | 'Product' | 'Category' | 'Entry'
  label:  TString,
  newTab: { type: Boolean, default: false },
  rel:    String                                 // 'nofollow sponsored' …
}
```

Internal links store the **ObjectId, not the slug** — renaming a slug never breaks a menu or button.

### 1.4 `styleSchema` — the Elementor-style design controls on every section/block/component

```js
{
  background: {
    type:     { type: String, enum: ['none','color','gradient','image','video'], default: 'none' },
    color:    String,
    gradient: { from: String, to: String, angle: Number },
    image:    mediaRefSchema,
    video:    mediaRefSchema,
    position: String, size: String, repeat: String, attachment: String,   // css values
    overlay:  { color: String, opacity: { type: Number, min: 0, max: 1 } }
  },
  spacing: {                                     // responsive: value per device, px/em/rem/%
    padding: { desktop: boxSchema, tablet: boxSchema, mobile: boxSchema },
    margin:  { desktop: boxSchema, tablet: boxSchema, mobile: boxSchema }
    // boxSchema = { top: String, right: String, bottom: String, left: String }
  },
  layout: {
    containerWidth: { type: String, enum: ['boxed','full','custom'], default: 'boxed' },
    customWidth:    String,
    minHeight:      String,
    verticalAlign:  { type: String, enum: ['top','center','bottom','stretch'] },
    contentAlign:   { type: String, enum: ['left','center','right'] }
  },
  border:    { radius: String, width: String, style: String, color: String, shadow: String },
  animation: { type: String,                     // 'fade-up' | 'zoom-in' | … (AOS/framer names)
               duration: Number, delay: Number, once: { type: Boolean, default: true } },
  visibility: {
    desktop: { type: Boolean, default: true },
    tablet:  { type: Boolean, default: true },
    mobile:  { type: Boolean, default: true },
    schedule: { start: Date, end: Date },        // time-boxed sections (offers…)
    roles:    [String]                           // show only to these roles; empty = everyone
  },
  customCss:   String,                           // scoped to this node's generated class
  customClass: String,
  customId:    String                            // anchor target
}
```

### 1.5 `addressSchema` — embedded on Order; base of the Address collection

```js
{ name: String, phone: String, email: String, line1: String, line2: String,
  city: String, state: String, postalCode: String, country: String, notes: String }
```

### 1.6 `publishableFields` — mixin on every content-bearing collection

```js
{ status:      { type: String, enum: ['draft','published','scheduled','archived'], default: 'draft', index: true },
  publishedAt: Date, scheduledAt: Date,
  createdBy: →User, updatedBy: →User,
  deletedAt:   { type: Date, default: null, index: true } }   // soft delete
```

---

## 2. Auth, users, roles

### 2.1 `User`

```js
{
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, index: true },
  phone:       String,
  avatar:      →MediaAsset,
  passwordHash:{ type: String, select: false },            // bcrypt(12)
  role:        { type: →Role, required: true, index: true },
  extraPermissions:  [String],                             // per-user grants on top of role
  deniedPermissions: [String],                             // per-user revokes
  status:      { type: String, enum: ['active','pending','suspended','banned'], default: 'active', index: true },
  emailVerifiedAt: Date,
  twoFactor:   { enabled: {type: Boolean, default: false},
                 secret: {type: String, select: false},    // TOTP, encrypted at rest
                 recoveryCodes: {type: [String], select: false} },
  tokenVersion:{ type: Number, default: 0 },               // bump = invalidate all access tokens
  failedLoginAttempts: Number, lockedUntil: Date,
  lastLoginAt: Date, lastLoginIp: String,
  bio:         TString, designation: String,               // doubles as blog Author profile
  meta:        Mixed
}
// indexes: { email: 1 } unique · { role: 1, status: 1 } · text: name, email
```

Customers and staff are the same collection differentiated by role — one identity system,
no duplicated "customers" collection. Customer-only data lives in Address / Wishlist / Order.

### 2.2 `Role`

```js
{
  name:        { type: String, required: true, unique: true },
  slug:        { type: String, required: true, unique: true },
  description: String,
  permissions: [String],                 // 'pages.create', 'orders.*', or ['*'] for super admin
  isSystem:    { type: Boolean, default: false },   // seeded roles: undeletable, slug locked
  level:       Number                    // hierarchy guard: can't edit users above your level
}
```

### 2.3 `Session` — refresh tokens + device management

```js
{
  user:        { type: →User, required: true, index: true },
  tokenHash:   { type: String, required: true, unique: true },   // sha256(refreshToken)
  family:      { type: String, index: true },   // rotation lineage for reuse detection
  replacedBy:  String,                          // hash of successor; presented-again = theft
  userAgent:   String, ip: String, device: String,
  lastUsedAt:  Date,
  revokedAt:   Date,
  expiresAt:   { type: Date, required: true, index: { expireAfterSeconds: 0 } }   // TTL purge
}
```

### 2.4 `PasswordResetToken`

```js
{ user: →User, tokenHash: {type: String, unique: true}, usedAt: Date,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } } }        // 15 min
```

### 2.5 `ActivityLog`

```js
{
  actor:      { type: →User, index: true },
  action:     String,                     // 'create' | 'update' | 'delete' | 'publish' | 'login' …
  module:     { type: String, index: true },       // 'pages' | 'orders' | 'settings' …
  targetType: String, targetId: ObjectId,
  summary:    String,                     // "Published page 'About Us'"
  diff:       Mixed,                      // changed fields before/after (secrets stripped)
  ip: String, userAgent: String
}
// index: { createdAt: -1 } · optional TTL 180d
```

### 2.6 `Notification`

```js
{
  recipient:  { type: →User, index: true },        // null + audienceRole = broadcast
  audienceRole: String,
  type:       String,                     // 'order.placed' | 'form.submitted' | 'stock.low' | 'system'
  title:      String, body: String,
  link:       String,                     // admin-panel deep link
  readAt:     { type: Date, index: true },
  meta:       Mixed
}
```

---

## 3. Settings, languages, email templates

### 3.1 `Setting` — one document per group (not one per key: atomic group saves, one cache entry)

```js
{
  group:  { type: String, unique: true, required: true },
  values: Mixed,                          // validated by a per-group Zod schema
  isPublic: Boolean,                      // whether group is exposed on /public/settings
  updatedBy: →User
}
```

Seeded groups and their value shapes:

| group | keys (all editable in admin) | public |
|---|---|---|
| `general` | siteName TString, tagline TString, defaultLanguage, timezone, dateFormat, currency {code, symbol, position} | ✔ |
| `branding` | logo, logoDark, logoLight, footerLogo, favicon, loader (all →MediaAsset), primaryColor, secondaryColor | ✔ |
| `contact` | email, phone, whatsapp, messenger, address TString, googleMap {embedUrl, lat, lng}, businessHours [{day, open, close, closed}] | ✔ |
| `social` | facebook, instagram, linkedin, youtube, twitter, tiktok, pinterest, github (+ ordered, each {url, visible}) | ✔ |
| `seoDefaults` | full seoSchema + titleTemplate ("%s — Avron Studio"), ogDefaultImage | ✔ |
| `scripts` | googleAnalyticsId, gtmId, facebookPixelId, metaPixelId, headerScripts, footerScripts, bodyStartScripts | ✔ |
| `maintenance` | enabled, title TString, message TString, image, allowedIps [], expectedBackAt | ✔ |
| `smtp` | host, port, secure, username, password *(encrypted, never serialized)*, fromName, fromEmail, replyTo | ✖ |
| `commerce` | ordersEnabled, guestCheckout, invoicePrefix, nextOrderNumber, taxRate, lowStockThreshold, reviewAutoApprove | ✖ |
| `security` | corsOrigins [], sessionMaxDays, adminEmailAlerts, recaptcha {enabled, siteKey, secret} | ✖ |
| `robotsTxt` | content (raw text served at /robots.txt) | ✔ |

### 3.2 `Language`

```js
{ code: {type: String, unique: true},     // 'en', 'bn' …
  name: String, nativeName: String, flag: String,
  direction: { type: String, enum: ['ltr','rtl'], default: 'ltr' },
  isDefault: Boolean, isActive: Boolean, order: Number }
```

### 3.3 `UiTranslation` — static UI strings (labels the builder doesn't own)

```js
{ namespace: String, key: String, values: TString }
// unique compound: { namespace: 1, key: 1 }
```

### 3.4 `EmailTemplate`

```js
{
  key:      { type: String, unique: true },   // 'welcome','password-reset','order-confirmation',
                                              // 'order-shipped','contact-reply','newsletter-welcome','form-notification'
  name:     String,
  subject:  TString,                          // supports {{placeholders}}
  bodyHtml: TString,                          // MJML/HTML with {{order.total}} style placeholders
  variables:[String],                         // documented placeholders for the editor UI
  isSystem: Boolean, isActive: Boolean
}
```

---

## 4. Media library

### 4.1 `MediaFolder`

```js
{ name: String, parent: {type: →MediaFolder, default: null, index: true},
  path: { type: String, index: true },        // '/products/2026' — materialized for breadcrumbs
  createdBy: →User }
```

### 4.2 `MediaAsset`

```js
{
  folder:    { type: →MediaFolder, default: null, index: true },
  kind:      { type: String, enum: ['image','video','pdf','document','audio','other'], index: true },
  provider:  { type: String, default: 'cloudinary' },
  publicId:  { type: String, required: true, unique: true },   // cloudinary public_id
  url:       String, secureUrl: String,
  format:    String, width: Number, height: Number, bytes: Number, duration: Number,
  alt:       TString, title: String, caption: TString,
  tags:      { type: [String], index: true },
  focalPoint:{ x: Number, y: Number },        // smart-crop hint
  blurhash:  String,                          // lazy-load placeholder for the frontend
  uploadedBy: →User,
  deletedAt: Date
}
// text index: title, alt, tags · index: { folder: 1, kind: 1, createdAt: -1 }
```

**Replace image** = re-upload to the **same `publicId`** (Cloudinary `overwrite: true` +
`invalidate: true`) → every page/product referencing the asset updates instantly, URLs never break.
Compression/optimization = Cloudinary `q_auto,f_auto` applied by default transform. Crop = stored
transform string on the usage (`mediaRefSchema.transform`), original stays untouched.

---

## 5. Page builder — the core engine

Object model: **Page → sections[] → blocks[] (columns) → components[] (widgets)**.
The tree is **embedded in the Page document** — one read serves a page, publishes are atomic,
and a page tree is comfortably under MongoDB's 16 MB ceiling.

### 5.1 `componentSchema` (embedded — a widget instance)

```js
{
  uid:   String,                    // stable id for drag&drop reconciliation
  type:  { type: String, required: true },      // FK by key → ComponentDefinition
  order: Number,
  props: Mixed,                     // validated against ComponentDefinition.fields on save
  style: styleSchema,
  dynamicSource: {                  // OPTIONAL — the "show latest 6 services" mechanism
    kind:   { type: String, enum: ['entries','posts','products','none'], default: 'none' },
    contentType: String,            // when kind=entries: 'service' | 'team-member' | …
    filters: Mixed,                 // { featured: true, category: <id> }
    sort:   String, limit: Number
  }
}
```

Static content lives in `props`; list-driven components (Services, Team, Testimonials, Blogs,
Products, Portfolio, Partners, FAQ…) set `dynamicSource` and the delivery API injects resolved
items at render time — **edit a team member once, every page updates**.

### 5.2 `blockSchema` (embedded — a responsive column)

```js
{ uid: String, order: Number,
  width: { desktop: {type: Number, default: 12}, tablet: Number, mobile: Number },  // 12-col grid
  style: styleSchema,
  components: [componentSchema] }
```

### 5.3 `sectionSchema` (embedded)

```js
{ uid: String, label: String, order: Number,
  style: styleSchema,
  globalSection: →GlobalSection,    // if set: render the shared section instead of local blocks
  blocks: [blockSchema] }
```

### 5.4 `Page`

```js
{
  title:  { type: TString, required: true },
  slug:   { type: String, required: true, unique: true, index: true },
  type:   { type: String, enum: ['standard','home','system'], default: 'standard', index: true },
  systemKey: { type: String, sparse: true, unique: true },
     // system pages seeded once, undeletable: 'home','404','coming-soon','maintenance',
     // 'cart','checkout','privacy-policy','terms','refund-policy','search'
  template: { type: String, default: 'default' },        // 'default' | 'full-width' | 'landing'
  draft:     { sections: [sectionSchema] },               // what the builder edits
  published: { sections: [sectionSchema], version: Number, at: Date, by: →User },  // what the site serves
  hasUnpublishedChanges: Boolean,
  seo:    seoSchema,
  passwordProtected: { enabled: Boolean, passwordHash: String },
  ...publishableFields
}
```

Draft vs published live side by side → editors preview safely; **Publish** copies `draft` →
`published`, bumps version, snapshots a `PageRevision`, and invalidates `page:{slug}:*` cache.

### 5.5 `PageRevision` — undo history

```js
{ page: {type: →Page, index: true}, version: Number,
  snapshot: { sections: [sectionSchema], seo: seoSchema, title: TString },
  author: →User, note: String }
// keep last 25 per page (cleanup job) · index { page: 1, version: -1 }
```

### 5.6 `GlobalSection` — reusable sections (edit once, updates everywhere)

```js
{ name: String, key: {type: String, unique: true, sparse: true},   // 'site-cta', 'footer-main'
  section: sectionSchema, usedOn: [→Page], ...publishableFields }
```

### 5.7 `ComponentDefinition` — the widget registry (why nothing is hardcoded)

```js
{
  key:      { type: String, unique: true },   // 'hero', 'testimonials', 'pricing-table' …
  name:     String, icon: String,
  category: { type: String, enum: ['basic','content','media','commerce','forms','advanced'] },
  fields:   [fieldDefSchema],       // prop schema → auto-renders the admin form AND builds
                                    // the Zod validator for props (see §8.1 fieldDefSchema)
  defaultProps: Mixed, defaultStyle: Mixed,
  supportsDynamicSource: Boolean, dynamicKinds: [String],
  isSystem: Boolean, isActive: Boolean, order: Number
}
```

**~30 seeded definitions:** hero, banner, heading, paragraph, image, video, gallery, slider(→Slider),
button, button-group, icon-box, services-grid, portfolio-grid, projects-showcase, team-grid,
testimonials, partners-logos, brands-marquee, clients, counters, statistics, pricing-table, faq,
accordion, tabs, timeline, blog-grid, products-grid, contact-form(→Form), form-embed(→Form),
google-map, newsletter, call-to-action, spacer, divider, html-block (sanitized), custom-css, custom-js
(admin-gated). Adding a new widget later = insert one document + one React renderer.

---

## 6. Menus, sliders, popups

### 6.1 `Menu` — items embedded as adjacency list (flat array + parentUid → arbitrary nesting, cheap drag&drop reorder)

```js
{
  key:      { type: String, unique: true },   // 'header', 'footer-1', 'footer-2', 'sidebar', 'mobile'
  name:     String, location: String,
  items: [{
    uid: String, parentUid: {type: String, default: null}, order: Number,
    label: TString, link: linkSchema, icon: String,
    badge: { text: TString, color: String },
    mega: {                                    // mega-menu payload (header only)
      enabled: Boolean, columns: Number, width: String,
      content: [componentSchema]               // reuses builder widgets inside the dropdown
    },
    visibility: { desktop: Boolean, mobile: Boolean, roles: [String] },
    cssClass: String
  }],
  ...publishableFields
}
```

### 6.2 `Slider`

```js
{
  key:  { type: String, unique: true }, name: String,
  settings: { autoplay: Boolean, delayMs: Number, speedMs: Number, loop: Boolean,
              effect: {type: String, enum: ['slide','fade','cube','creative']},
              arrows: Boolean, dots: Boolean, pauseOnHover: Boolean, height: {desktop:String, mobile:String} },
  slides: [{
    uid: String, order: Number,
    image:       mediaRefSchema,               // desktop
    imageMobile: mediaRefSchema,
    video:       mediaRefSchema,
    preHeading: TString, heading: TString, subHeading: TString, body: TString,
    buttons: [{ label: TString, link: linkSchema, variant: String }],
    contentPosition: { type: String, enum: ['left','center','right'] },
    textColor: String, overlay: { color: String, opacity: Number },
    animation: { heading: String, body: String, buttons: String },
    schedule: { start: Date, end: Date },      // seasonal slides auto on/off
    isActive: Boolean
  }],
  ...publishableFields
}
```

### 6.3 `Popup`

```js
{
  name: String,
  purpose: { type: String, enum: ['newsletter','offer','announcement','exit','custom'] },
  trigger: { type: {type: String, enum: ['delay','scroll','exit-intent','click','pageload']},
             delaySeconds: Number, scrollPercent: Number, clickSelector: String },
  frequency: { showOncePerSession: Boolean, cooldownHours: Number, maxImpressions: Number },
  audience:  { pages: {type: String, enum: ['all','include','exclude']}, pageIds: [→Page],
               devices: [String], newVisitorsOnly: Boolean, roles: [String] },
  schedule:  { start: Date, end: Date },
  size: { type: String, enum: ['sm','md','lg','fullscreen'] }, position: String,
  content: [componentSchema],                  // full builder inside the popup
  form: →Form,                                 // optional embedded form (newsletter capture…)
  style: styleSchema,
  stats: { impressions: Number, conversions: Number, closes: Number },
  ...publishableFields
}
```

---

## 7. Form builder

### 7.1 `Form`

```js
{
  name: String, key: { type: String, unique: true },      // 'contact-main', 'quote-request'
  fields: [{
    uid: String, order: Number,
    type: { type: String, enum: ['text','email','phone','number','textarea','select','multiselect',
            'checkbox','radio','date','time','file','url','hidden','rating','heading','divider'] },
    name:  String,                              // submission data key
    label: TString, placeholder: TString, helpText: TString,
    required: Boolean,
    validation: { minLength: Number, maxLength: Number, min: Number, max: Number,
                  pattern: String, fileTypes: [String], maxFileSizeMb: Number },
    options: [{ label: TString, value: String }],
    defaultValue: String, width: { type: Number, default: 12 },
    conditional: { fieldUid: String, operator: {type: String, enum: ['eq','neq','contains','gt','lt']}, value: String }
  }],
  settings: {
    submitLabel: TString, successMessage: TString, redirectUrl: String,
    storeSubmissions: { type: Boolean, default: true },
    notify:  { enabled: Boolean, to: [String], subject: String, emailTemplate: →EmailTemplate },
    autoReply: { enabled: Boolean, toField: String, emailTemplate: →EmailTemplate },
    captcha: Boolean, honeypot: { type: Boolean, default: true },
    rateLimit: { max: Number, windowMinutes: Number }
  },
  stats: { views: Number, submissions: Number },
  ...publishableFields
}
```

### 7.2 `FormSubmission`

```js
{ form: { type: →Form, required: true, index: true },
  data: Mixed,                                  // { name: 'X', email: '…' } validated per Form.fields
  files: [→MediaAsset],
  status: { type: String, enum: ['new','read','replied','spam','archived'], default: 'new', index: true },
  meta: { ip: String, userAgent: String, page: String, referrer: String, utm: Mixed },
  readBy: →User, readAt: Date }
// index { form: 1, status: 1, createdAt: -1 }
```

---

## 8. Dynamic content engine (services, portfolio, team, testimonials, FAQ, pricing…)

Instead of ten near-identical collections, two: a **ContentType** (field definitions) and its
**Entries** — exactly how enterprise headless CMSs and WP custom-post-types work. New structured
content ("Awards", "Case Studies", "Job Openings") = create a ContentType in the admin, zero code.

### 8.1 `ContentType`

```js
{
  key:  { type: String, unique: true },        // 'service', 'project', 'team-member' …
  name: String, singularName: String, icon: String,
  fields: [fieldDefSchema], 
  hasSlug: Boolean, hasSeo: Boolean, hasDetailPage: Boolean,  // detail page → Entry gets builder sections
  orderable: Boolean,                          // manual drag ordering vs date sort
  isSystem: Boolean                            // seeded types: fields editable, type undeletable
}

// fieldDefSchema (shared with ComponentDefinition §5.7):
{ key: String, label: TString,
  type: { type: String, enum: ['text','textarea','richtext','number','boolean','media','gallery',
          'link','select','color','icon','date','repeater','reference'] },
  required: Boolean, translatable: Boolean,
  options: [ { label: String, value: String } ],   // for select
  of: [fieldDefSchema],                            // for repeater (nested rows)
  refContentType: String,                          // for reference fields
  default: Mixed, order: Number }
```

**Seeded content types** (mapped 1:1 to the existing frontend):

| key | fields (abridged) |
|---|---|
| `service` | icon, image, shortDescription, description(richtext), features(repeater), price, detail builder |
| `project` (portfolio) | client, categoryRef, gallery, coverImage, year, url, technologies(repeater), detail builder |
| `team-member` | photo, designation, bio, socialLinks(repeater), order |
| `testimonial` | authorName, authorRole, company, avatar, rating, quote, projectRef |
| `faq` | question, answer(richtext), categoryRef, order |
| `partner-brand` | logo, url, order |
| `pricing-plan` | price, period, features(repeater), highlighted, ctaLink |
| `counter-stat` | value, suffix, label, icon |
| `timeline-item` (process) | year/step, title, description, icon |
| `job-opening` (career) | department, location, type, description(richtext), applyForm→Form |

### 8.2 `Entry`

```js
{
  contentType: { type: →ContentType, required: true, index: true },
  typeKey:     { type: String, required: true, index: true },   // denormalized for fast filters
  title:  { type: TString, required: true },
  slug:   { type: String, index: true },       // unique per type (compound below)
  data:   Mixed,                                // validated against ContentType.fields
  featured: { type: Boolean, default: false, index: true },
  order:  Number,
  categories: [→Category], tags: [→Tag],
  seo:    seoSchema,
  sections: [sectionSchema],                    // optional builder tree for detail pages
  ...publishableFields
}
// unique sparse compound { typeKey: 1, slug: 1 } · index { typeKey: 1, status: 1, order: 1 }
// text index: title, slug
```

---

## 9. Taxonomy (shared by blog, catalog, portfolio, FAQ)

### 9.1 `Category` — one collection, scoped by `taxonomy` (the "avoid duplicated collections" answer)

```js
{
  taxonomy: { type: String, enum: ['blog','product','project','faq'], required: true, index: true },
  name:  { type: TString, required: true },
  slug:  { type: String, required: true },
  parent:{ type: →Category, default: null, index: true },     // unlimited nesting
  path:  String,                                // '/electronics/phones' materialized
  ancestors: [→Category],                       // fast subtree queries: { ancestors: id }
  description: TString, image: mediaRefSchema, icon: String,
  featured: Boolean, order: Number,
  seo:   seoSchema,
  counts: { items: Number },                    // denormalized, recomputed on write
  ...publishableFields
}
// unique compound { taxonomy: 1, slug: 1 }
```

### 9.2 `Tag`

```js
{ taxonomy: { type: String, enum: ['blog','product','project'], index: true },
  name: TString, slug: String, counts: { items: Number } }
// unique compound { taxonomy: 1, slug: 1 }
```

---

## 10. Blog

### 10.1 `Post`

```js
{
  title:   { type: TString, required: true },
  slug:    { type: String, required: true, unique: true },
  excerpt: TString,
  contentHtml: TString,                         // rich-text output (sanitized on save)
  sections: [sectionSchema],                    // optional: builder-composed long-form posts
  featuredImage: mediaRefSchema, gallery: [mediaRefSchema],
  author:  { type: →User, required: true, index: true },
  categories: [{ type: →Category, index: true }], tags: [→Tag],
  isFeatured: { type: Boolean, index: true }, isPinned: Boolean,
  allowComments: { type: Boolean, default: true },
  readingTimeMinutes: Number,                   // computed on save
  views: { type: Number, default: 0 },
  relatedPosts: [→Post],                        // manual picks; auto-fallback by shared categories
  seo: seoSchema,
  ...publishableFields
}
// text index: title, excerpt · index { status: 1, publishedAt: -1 } · { isFeatured: 1, publishedAt: -1 }
```

### 10.2 `Comment` — polymorphic (blog comments now, extensible later)

```js
{
  targetType: { type: String, enum: ['post'], default: 'post' },
  target:     { type: ObjectId, required: true, index: true, refPath: 'targetTypeModel' },
  parent:     { type: →Comment, default: null },        // one-level threading
  author:     →User,                                    // OR guest:
  guest:      { name: String, email: String, website: String },
  content:    { type: String, required: true, maxlength: 3000 },
  status:     { type: String, enum: ['pending','approved','spam','trash'], default: 'pending', index: true },
  ip: String, userAgent: String,
  likes: Number
}
// index { target: 1, status: 1, createdAt: -1 }
```

---

## 11. Catalog (products)

### 11.1 `Attribute` — global attribute registry (Color, Size, Material…)

```js
{ name: TString, slug: { type: String, unique: true },
  displayType: { type: String, enum: ['dropdown','buttons','swatches'] },
  values: [{ uid: String, label: TString, slug: String, colorCode: String, image: mediaRefSchema, order: Number }] }
```

### 11.2 `Brand`

```js
{ name: String, slug: { type: String, unique: true }, logo: mediaRefSchema,
  description: TString, website: String, featured: Boolean, order: Number,
  seo: seoSchema, counts: { products: Number }, ...publishableFields }
```

### 11.3 `Product`

```js
{
  name:  { type: TString, required: true },
  slug:  { type: String, required: true, unique: true },
  sku:   { type: String, unique: true, sparse: true },
  type:  { type: String, enum: ['simple','variable'], default: 'simple' },
  shortDescription: TString, description: TString,     // rich text, sanitized
  brand: { type: →Brand, index: true },
  categories: [{ type: →Category, index: true }], tags: [→Tag],

  pricing:   { price: Number, compareAtPrice: Number, costPrice: {type: Number, select: false},
               taxable: {type: Boolean, default: true} },          // used when type=simple
  inventory: { trackStock: {type: Boolean, default: true}, stock: {type: Number, default: 0},
               lowStockThreshold: Number, allowBackorder: Boolean,
               stockStatus: {type: String, enum: ['in-stock','low-stock','out-of-stock','backorder'], index: true} },

  attributes: [{ attribute: →Attribute, valueUids: [String], usedForVariants: Boolean }],
  variants: [{                                          // embedded — always fetched with product
    uid: String, sku: { type: String },
    optionValues: [{ attribute: →Attribute, valueUid: String }],   // Color=red, Size=xl
    pricing:   { price: Number, compareAtPrice: Number, costPrice: Number },
    inventory: { stock: Number, stockStatus: String },
    image: mediaRefSchema, weightGrams: Number,
    isDefault: Boolean, isActive: { type: Boolean, default: true }
  }],

  gallery: [mediaRefSchema], video: mediaRefSchema,
  specifications: [{ group: TString, name: TString, value: TString, order: Number }],

  flags: { isFeatured: {type: Boolean, index: true}, isTrending: {type: Boolean, index: true},
           isNewArrival: Boolean, isBestSeller: {type: Boolean, index: true} },   // bestSeller auto-set by job
  flashSale: { active: {type: Boolean, index: true}, salePrice: Number, startsAt: Date, endsAt: Date,
               totalQty: Number, soldQty: Number },

  rating: { average: {type: Number, default: 0}, count: {type: Number, default: 0} },  // denormalized from Review
  salesCount: { type: Number, default: 0, index: true },                                // denormalized from Orders
  relatedProducts: [→Product],                          // manual; auto-fallback by category
  shipping: { weightGrams: Number, dims: {l: Number, w: Number, h: Number}, shippingClass: String },
  seo: seoSchema,
  ...publishableFields
}
// text index: name, sku, shortDescription · { status: 1, 'flags.isFeatured': 1 }
// { categories: 1, status: 1 } · { 'pricing.price': 1 } · unique sparse on variants.sku (partial)
```

### 11.4 `Review`

```js
{ product: { type: →Product, required: true, index: true },
  customer: →User, order: →Order,                       // order set ⇒ "verified purchase" badge
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String, content: String, images: [mediaRefSchema],
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
  reply: { content: String, author: →User, at: Date },  // store owner response
  helpfulCount: Number, ip: String }
// unique compound { product: 1, customer: 1, order: 1 } — one review per purchase
// on approve/change: recompute Product.rating
```

---

## 12. Orders & checkout

### 12.1 `Cart` — server-side cart (guest via cookie token, merged into user cart at login)

```js
{ user: { type: →User, sparse: true, index: true },
  sessionToken: { type: String, sparse: true, index: true },
  items: [{ product: →Product, variantUid: String, qty: Number, priceAtAdd: Number }],
  couponCode: String,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } } }    // 30 days idle
```

### 12.2 `Order` — items carry full snapshots; an order is immutable history

```js
{
  orderNumber: { type: String, unique: true },          // 'AVR-2026-000123' (settings prefix + atomic counter)
  customer:  { type: →User, index: true },              // null ⇒ guest
  guest:     { name: String, email: String, phone: String },

  items: [{
    product: →Product, variantUid: String,
    snapshot: { name: String, sku: String, image: String,
                options: [{ name: String, value: String }] },      // frozen at purchase
    unitPrice: Number, qty: Number, subtotal: Number
  }],

  amounts: { subtotal: Number, discount: Number, shipping: Number, tax: Number,
             total: Number, currency: String },                    // currency snapshotted
  coupon:  { code: String, coupon: →Coupon, amount: Number },

  shippingAddress: addressSchema, billingAddress: addressSchema,
  shipping: { method: String, zone: →ShippingZone, cost: Number,
              carrier: String, trackingNumber: String, trackingUrl: String,
              shippedAt: Date, deliveredAt: Date, estimatedDelivery: Date },

  payment: { method: { type: String, enum: ['cod','card','bkash','nagad','stripe','sslcommerz','bank'] },
             status: { type: String, enum: ['pending','authorized','paid','failed','refunded','partially-refunded'], index: true },
             transaction: →Transaction, paidAt: Date },

  status: { type: String, enum: ['pending','confirmed','processing','shipped','delivered',
            'cancelled','returned','failed'], default: 'pending', index: true },
  statusHistory: [{ status: String, note: String, by: →User, at: Date, notifiedCustomer: Boolean }],

  refunds: [{ amount: Number, reason: String, by: →User, at: Date, transaction: →Transaction }],
  notes:   [{ content: String, author: →User, isPrivate: Boolean, at: Date }],
  invoice: { number: String, url: String, generatedAt: Date },     // rendered PDF → Cloudinary

  source: { type: String, enum: ['web','admin','api'], default: 'web' },
  ip: String, placedAt: { type: Date, index: true }
}
// { customer: 1, placedAt: -1 } · { status: 1, placedAt: -1 } · text: orderNumber, guest.email
// side effects on place (event bus): stock decrement, coupon usage++, salesCount++, emails, admin notification
```

### 12.3 `Transaction` — money ledger, separate from Order for accounting

```js
{ order: { type: →Order, index: true },
  type: { type: String, enum: ['payment','refund'] },
  gateway: String, gatewayRef: String,
  amount: Number, currency: String,
  status: { type: String, enum: ['pending','success','failed'], index: true },
  raw: Mixed, processedAt: Date }
```

### 12.4 `Coupon`

```js
{ code: { type: String, unique: true, uppercase: true },
  description: String,
  type:  { type: String, enum: ['percent','fixed','free-shipping'] }, value: Number,
  minSpend: Number, maxDiscount: Number,
  usageLimit: { total: Number, perCustomer: Number }, usedCount: { type: Number, default: 0 },
  appliesTo: { products: [→Product], categories: [→Category], brands: [→Brand] },   // empty = all
  excludes:  { products: [→Product], categories: [→Category], saleItems: Boolean },
  firstOrderOnly: Boolean,
  startsAt: Date, expiresAt: { type: Date, index: true },
  status: { type: String, enum: ['active','paused','expired'], default: 'active' } }
```

### 12.5 `ShippingZone`

```js
{ name: String, countries: [String], states: [String], postcodes: [String], order: Number,
  methods: [{ uid: String, name: TString, isActive: Boolean,
              type: { type: String, enum: ['flat','free','weight-tiers','price-tiers','local-pickup'] },
              cost: Number, freeOverAmount: Number,
              tiers: [{ upTo: Number, cost: Number }],
              etaDays: { min: Number, max: Number } }] }
```

---

## 13. Customer data

### 13.1 `Address`

```js
{ user: { type: →User, required: true, index: true }, label: String,   // 'Home', 'Office'
  ...addressSchema,
  isDefaultShipping: Boolean, isDefaultBilling: Boolean }
```

### 13.2 `Wishlist`

```js
{ user: { type: →User, unique: true },
  items: [{ product: →Product, variantUid: String, addedAt: Date }] }
```

(Customer order history = query on `Order.customer` — no duplicate collection.)

---

## 14. Marketing & inbox

### 14.1 `Subscriber`

```js
{ email: { type: String, unique: true, lowercase: true },
  name: String,
  status: { type: String, enum: ['subscribed','unsubscribed','bounced'], default: 'subscribed', index: true },
  source: String,                     // 'popup:offer-2026' | 'footer-form' | 'checkout'
  tags: [String],
  unsubscribeToken: { type: String, unique: true },
  confirmedAt: Date, unsubscribedAt: Date, ip: String }
```

### 14.2 `ContactMessage`

```js
{ name: String, email: { type: String, index: true }, phone: String,
  subject: String, message: String,
  source: { form: →Form, page: String },
  status: { type: String, enum: ['new','read','replied','archived','spam'], default: 'new', index: true },
  replies: [{ content: String, author: →User, sentAt: Date, emailMessageId: String }],  // sent via SMTP
  assignedTo: →User, ip: String, userAgent: String }
```

---

## 15. SEO infrastructure

### 15.1 `Redirect`

```js
{ from: { type: String, unique: true },    // '/old-page'
  to: String, code: { type: Number, enum: [301, 302], default: 301 },
  isActive: Boolean, hits: Number, lastHitAt: Date, note: String }
// auto-created when a published slug changes; also hand-managed in admin
```

Sitemap & robots.txt are **generated, not stored**: sitemap.xml is built from every published
Page/Post/Product/Category/Entry honoring each `seo.sitemap` block (cached 24 h);
robots.txt serves `Setting(group:'robotsTxt')`.

---

## 16. Analytics

### 16.1 `VisitEvent` — raw beacons, self-purging

```js
{ anonId: { type: String, index: true },   // random cookie id — no PII
  sessionId: String,
  path: { type: String, index: true }, referrer: String,
  utm: { source: String, medium: String, campaign: String },
  device: { type: String, enum: ['desktop','tablet','mobile'] },
  browser: String, os: String, country: String,
  createdAt: { type: Date, index: { expireAfterSeconds: 7776000 } } }   // TTL 90 days
```

### 16.2 `DailyStat` — permanent rollups (dashboard reads these, never raw events)

```js
{ date: { type: String, unique: true },    // '2026-07-16'
  pageViews: Number, uniqueVisitors: Number, sessions: Number,
  topPages: [{ path: String, views: Number }],
  topReferrers: [{ referrer: String, count: Number }],
  devices: { desktop: Number, tablet: Number, mobile: Number },
  orders: Number, revenue: Number, newCustomers: Number, newSubscribers: Number,
  formSubmissions: Number }
```

---

## 17. Relationship map (summary)

```
Role ──< User ──< Session / PasswordResetToken / ActivityLog / Notification / Address / Wishlist
MediaFolder ──< MediaAsset >── referenced by mediaRefSchema everywhere
ComponentDefinition ──(by key)── componentSchema ∈ Page/GlobalSection/Popup/Menu(mega)/Entry
Page ──< PageRevision          Page ─── GlobalSection (shared sections)
ContentType ──< Entry >── Category/Tag (taxonomy-scoped)
User(author) ──< Post >── Category/Tag ──< Comment
Brand/Attribute/Category ──< Product ──< Review        Product ∈ Cart/Wishlist/Order.items(snapshot)
User ──< Order ──< Transaction        Coupon/ShippingZone ─── Order
Form ──< FormSubmission               Form ∈ Popup / contact-form component
VisitEvent ══(nightly job)══▶ DailyStat
Setting / Language / UiTranslation / EmailTemplate / Redirect / Subscriber / ContactMessage (standalone)
```

**Normalization rules applied:** shared entities (media, categories, users, attributes) are always
referenced; page trees and order snapshots are always embedded (read-optimized, historically
immutable); denormalized counters (`rating`, `salesCount`, `counts.items`) are maintained by the
service layer inside the same write path and are rebuildable by a repair job.
