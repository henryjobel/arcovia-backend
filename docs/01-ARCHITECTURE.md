# Avron CMS — System Architecture

> **Scope:** Enterprise headless CMS + page-builder engine (WordPress + Elementor class), API-first,
> designed to grow into a multi-tenant SaaS. Nothing hardcoded — every page, section, component,
> menu, setting, form, popup, and SEO field is data.

---

## 1. Guiding principles

| Principle | How it shows up in this design |
|---|---|
| **Nothing hardcoded** | Component types, content types, settings groups, roles, email templates — all live in MongoDB registries, seeded on install, extendable at runtime. |
| **Modular monolith** | One deployable Express app, but every feature is a self-contained module (routes → controller → service → repository → model → validation). Modules can later be extracted into services without rewrites. |
| **Thin controllers, fat services** | Controllers only translate HTTP ↔ service calls. All business logic lives in services. All DB access goes through repositories. |
| **Draft/publish everywhere** | Pages, posts, products, entries carry a lifecycle (`draft → published → archived`) with scheduled publishing. The public API only ever serves published data. |
| **Read path is cached** | Public delivery endpoints (pages, menus, settings, sliders) are served from Redis and invalidated on write. Admin endpoints always hit MongoDB. |
| **Everything auditable** | Every mutating admin action emits an ActivityLog entry via middleware — powers the dashboard "Recent Activities" for free. |

## 2. High-level topology

```
                        ┌────────────────────────────────────────────┐
 React Website ────────▶│  /api/v1/public/*   (no auth, cached)      │
 React Admin Panel ────▶│  /api/v1/admin/*    (JWT + RBAC)           │
 Customer Account ─────▶│  /api/v1/account/*  (JWT, customer role)   │
 Auth flows ───────────▶│  /api/v1/auth/*                            │
                        │                                            │
                        │   Express (modular monolith)               │
                        │   routes → middleware → controller         │
                        │        → service → repository → model      │
                        └───────┬───────────────┬────────────┬───────┘
                                │               │            │
                          MongoDB Atlas      Redis        Cloudinary
                          (Mongoose)     (cache, rate    (all media)
                                          limits, queues)
                                │
                          Cron jobs (node-cron): scheduled publishing,
                          daily analytics rollup, flash-sale expiry,
                          session/log cleanup, sitemap regeneration
```

## 3. Folder structure

```
Backend/
├─ src/
│  ├─ server.js                    # bootstrap: env → db → redis → http → jobs
│  ├─ app.js                       # express assembly: security, parsers, routes, errors
│  │
│  ├─ config/
│  │  ├─ env.js                    # zod-validated process.env (fail fast on boot)
│  │  ├─ db.js                     # mongoose connection + events
│  │  ├─ redis.js                  # ioredis client (optional — app runs without it)
│  │  ├─ cloudinary.js
│  │  ├─ cors.js                   # whitelist read from Settings at runtime
│  │  ├─ rateLimits.js             # per-scope limiter configs (auth, public, admin)
│  │  └─ constants.js              # enums: statuses, permission catalog, cache keys
│  │
│  ├─ core/                        # framework-level, feature-agnostic
│  │  ├─ errors/
│  │  │  ├─ AppError.js            # base + NotFoundError, ValidationError, AuthError,
│  │  │  │                         #   ForbiddenError, ConflictError, RateLimitError
│  │  │  └─ errorHandler.js        # global handler: normalize → log → envelope
│  │  ├─ middlewares/
│  │  │  ├─ authenticate.js        # verify access JWT, attach req.user
│  │  │  ├─ authorize.js           # authorize('pages.create') — RBAC gate
│  │  │  ├─ validate.js            # validate(zodSchema) for body/query/params
│  │  │  ├─ upload.js              # multer (memory) → cloudinary streaming
│  │  │  ├─ cache.js               # cache(key, ttl) wrapper for public GETs
│  │  │  ├─ sanitize.js            # mongo-sanitize + xss-clean + hpp
│  │  │  ├─ activityLog.js         # audit trail on mutating admin routes
│  │  │  └─ maintenance.js         # 503 for public routes when maintenance mode on
│  │  ├─ utils/
│  │  │  ├─ ApiResponse.js         # success/paginated envelope builders
│  │  │  ├─ asyncHandler.js
│  │  │  ├─ QueryBuilder.js        # ?page&limit&sort&search&filter[...] → mongoose query
│  │  │  ├─ slugify.js             # unique slug generation w/ collision suffix
│  │  │  ├─ token.js               # JWT sign/verify, refresh rotation, hash helpers
│  │  │  └─ i18n.js                # resolve TranslatableString → locale w/ fallback
│  │  ├─ services/
│  │  │  ├─ mail.service.js        # nodemailer w/ SMTP from Settings + EmailTemplate render
│  │  │  ├─ cache.service.js       # get/set/del/tag-invalidation (no-op if Redis absent)
│  │  │  ├─ cloudinary.service.js  # upload/replace/delete/transform
│  │  │  └─ event.bus.js           # in-process EventEmitter (order.placed → email + notif)
│  │  └─ repositories/
│  │     └─ BaseRepository.js      # generic CRUD + paginate + softDelete, extended per model
│  │
│  ├─ modules/                     # one folder per feature — the heart of the app
│  │  ├─ auth/                     #   *.routes.js  *.controller.js  *.service.js
│  │  ├─ users/                    #   *.validation.js  *.model.js  (repository if complex)
│  │  ├─ roles/
│  │  ├─ settings/
│  │  ├─ media/
│  │  ├─ components/               # component-type registry (the "widget catalog")
│  │  ├─ pages/                    # page builder: pages, sections, revisions, global sections
│  │  ├─ menus/
│  │  ├─ sliders/
│  │  ├─ popups/
│  │  ├─ forms/                    # form builder + submissions
│  │  ├─ content/                  # dynamic content engine: ContentType + Entry
│  │  ├─ taxonomy/                 # categories (typed, nested) + tags
│  │  ├─ blog/                     # posts + comments
│  │  ├─ catalog/                  # products, brands, attributes, reviews
│  │  ├─ orders/                   # orders, cart, coupons, shipping, transactions, refunds
│  │  ├─ customers/                # addresses, wishlist, account endpoints
│  │  ├─ marketing/                # newsletter subscribers, contact messages
│  │  ├─ seo/                      # redirects, sitemap.xml, robots.txt
│  │  ├─ analytics/                # visit events, daily stats, dashboard aggregation
│  │  ├─ notifications/
│  │  └─ activity/                 # activity log read API
│  │
│  ├─ jobs/                        # node-cron registrations
│  │  ├─ publishScheduled.job.js   # every minute: flip scheduled → published
│  │  ├─ dailyStats.job.js         # 00:05: roll VisitEvents + orders into DailyStat
│  │  ├─ flashSale.job.js          # expire flash sales
│  │  └─ cleanup.job.js            # purge expired sessions, old revisions, spam
│  │
│  └─ database/
│     ├─ seeders/                  # roles+permissions, super admin, settings groups,
│     │                            #   component definitions, content types, email
│     │                            #   templates, system pages (404, maintenance…)
│     └─ migrations/
│
├─ docs/                           # ← these documents + OpenAPI spec later
├─ logs/                           # winston file transport (rotated)
├─ .env.example
└─ package.json
```

**Module anatomy** (identical in every module — this consistency is the architecture):

```
modules/blog/
├─ post.model.js          # Mongoose schema only — no logic
├─ comment.model.js
├─ blog.validation.js     # Zod schemas: createPost, updatePost, listQuery…
├─ blog.repository.js     # extends BaseRepository; custom queries (related posts…)
├─ blog.service.js        # business rules: slugs, scheduling, cache invalidation
├─ blog.controller.js     # req/res translation only
└─ blog.routes.js         # router + authenticate + authorize + validate wiring
```

## 4. Request lifecycle

```
Request
 → helmet / cors / compression
 → rate limiter (scope-aware: auth 10/15min, public 300/min, admin 120/min — Redis store)
 → body parse (json 1mb, urlencoded) → mongo-sanitize → xss → hpp
 → router match
 → [maintenance gate]           (public routes only)
 → [authenticate]               (JWT access token — protected routes)
 → [authorize('perm.key')]      (RBAC — admin routes)
 → [validate(schema)]           (Zod — body/query/params, strips unknown keys)
 → [cache(key, ttl)]            (public GETs — serve from Redis when warm)
 → controller → service → repository → MongoDB
 → [activityLog]                (mutating admin routes — fire-and-forget)
 → ApiResponse envelope
 → errorHandler                 (any throw anywhere lands here)
```

## 5. Authentication & session design

- **Access token** — JWT, 15 min, returned in body, sent as `Authorization: Bearer`.
  Payload: `{ sub, role, tokenVersion }` — no permissions inside (roles change without re-login).
- **Refresh token** — opaque 256-bit random, 7–30 days, `httpOnly` + `Secure` + `SameSite=Strict`
  cookie. Only the **SHA-256 hash** is stored (Session collection).
- **Rotation with reuse detection** — every refresh issues a new token in the same `family`.
  If a consumed token is presented again (theft), the entire family is revoked.
- **Session management** — each Session records device/IP/last-seen; users can list and revoke
  sessions ("log out other devices"). TTL index auto-purges expired ones.
- **Password reset** — single-use hashed token, 15 min TTL, generic responses (no email enumeration).
- **2FA-ready** — `twoFactor { enabled, secret, recoveryCodes[] }` on User; login returns
  `{ twoFactorRequired: true, challengeToken }` when enabled; `/auth/2fa/verify` completes it (TOTP).
- **bcrypt** cost 12; login rate-limited per email+IP; account lock after repeated failures.

## 6. RBAC — permission-based access control

Permissions are strings in `module.action` form, held on the **Role** document (not hardcoded to
role names). Roles are editable; new roles can be created from the admin panel.

```
Catalog (seeded in constants.js, ~90 keys):
  dashboard.view    users.manage      roles.manage      settings.update
  pages.view/create/update/delete/publish
  media.view/upload/update/delete
  posts.* comments.moderate  taxonomy.manage
  products.* orders.view/update/refund  coupons.manage
  forms.manage submissions.view  menus.manage sliders.manage popups.manage
  content.manage seo.manage marketing.manage analytics.view activity.view
```

Seeded roles → permission sets:

| Role | Permissions |
|---|---|
| **Super Admin** | `*` (wildcard — bypasses checks; role is system-locked, cannot be edited/deleted) |
| **Admin** | everything except `roles.manage`, destructive settings |
| **Manager** | orders, products, customers, coupons, analytics, dashboard |
| **Editor** | pages, posts, media, menus, sliders, popups, forms, content, seo |
| **Content Writer** | posts.create/update (own), media.upload, drafts only — no publish |
| **Staff** | dashboard.view, orders.view, submissions.view |
| **Customer** | no admin permissions — `/account/*` only |

`authorize()` resolves the user's role from cache, supports wildcards (`pages.*`), plus per-user
`extraPermissions` / `deniedPermissions` overrides.

## 7. API conventions (contract for every endpoint)

**Envelope**

```json
{ "success": true,  "message": "Created", "data": { }, "meta": { } }
{ "success": false, "message": "Validation failed", "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Invalid email" }] }
```

**List queries** — one `QueryBuilder` implements this for every collection:

```
GET /api/v1/admin/products
  ?page=2&limit=20
  &sort=-createdAt,name
  &search=leather bag              → $text / regex across searchable fields
  &filter[status]=published
  &filter[price][gte]=100&filter[price][lte]=500
  &filter[categories][in]=slug-a,slug-b
  &fields=name,slug,pricing        → projection
meta.pagination → { page, limit, total, totalPages, hasNext, hasPrev }
```

**Route namespaces**

| Namespace | Auth | Purpose |
|---|---|---|
| `/api/v1/auth/*` | mixed | login, refresh, reset, 2FA, sessions |
| `/api/v1/admin/*` | JWT + RBAC | every management endpoint |
| `/api/v1/account/*` | JWT (customer) | profile, orders, addresses, wishlist |
| `/api/v1/public/*` | none (cached) | website delivery: resolved pages, menus, settings, catalog, cart, checkout, form submit |

Versioned under `/v1` from day one. Public GETs send `Cache-Control` + ETag.

## 8. Caching strategy (Redis)

| Key pattern | Content | TTL | Invalidated by |
|---|---|---|---|
| `settings:public` | merged public settings | ∞ | settings update |
| `menus:{key}` | resolved menu tree | ∞ | menu update |
| `page:{slug}:{locale}` | fully-resolved published page JSON | 1 h | page publish, global-section update, referenced entry change |
| `components:registry` | component definitions | ∞ | registry change |
| `catalog:*`, `posts:*` | public list/detail responses | 10 min | respective writes |
| `role:{id}` | permission set | 1 h | role update |
| `sitemap` | generated XML | 24 h | any publish |

Cache service is a **no-op passthrough when Redis is absent** — Redis stays optional.
Writes invalidate by tag (`cache.invalidateTag('pages')`), never by flushing all.

## 9. Cross-cutting concerns

- **Logging** — Winston: console (dev, pretty) + rotating files `logs/error.log`, `logs/combined.log`;
  every request logged with requestId, userId, duration; errors with stack + context.
- **Events** — in-process event bus decouples side effects:
  `order.placed → [email invoice, notify admins, decrement stock, bump coupon usage]`,
  `user.registered → [welcome email]`, `form.submitted → [notification email, admin notif]`.
  Swappable for BullMQ later without touching services.
- **Soft delete** — `deletedAt` on content-bearing collections; hard delete is Super Admin only.
- **Uploads** — Multer memory storage → streamed to Cloudinary (nothing written to disk);
  type/size whitelists per media kind; all files organized in Cloudinary folders mirroring the Media Library.
- **i18n** — translatable fields are `Map<locale, string>`; the delivery layer resolves to the
  requested `?locale=` with default-language fallback. Languages are a DB collection.
- **Env validation** — boot fails loudly if any required var is missing (see `.env.example` list in §11).

## 10. Dashboard data sources (no separate "stats" writes needed)

| Widget | Source |
|---|---|
| Total visitors / analytics | `DailyStat` rollups + live `VisitEvent` counts |
| Orders / revenue | aggregation on `Order` (paid) grouped by day/month |
| Users | `User` counts by role/status, signups over time |
| Notifications | `Notification` (unread for current admin) |
| Recent activities | `ActivityLog` latest N |
| System status | uptime, Mongo ping, Redis ping, Cloudinary quota, last cron run, app version |

One endpoint — `GET /admin/dashboard` — returns the whole widget payload in a single round trip.

## 11. Environment variables

```
NODE_ENV, PORT, API_URL, CLIENT_URL, ADMIN_URL
MONGO_URI
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d, REFRESH_COOKIE_NAME
BCRYPT_ROUNDS=12
REDIS_URL                      (optional)
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SMTP_* fallback                (runtime SMTP comes from Settings; env is bootstrap fallback)
SEED_SUPERADMIN_EMAIL, SEED_SUPERADMIN_PASSWORD
```

## 12. Build phases

| Phase | Modules | Outcome |
|---|---|---|
| **1 — Core** | bootstrap, config, core/*, auth, users, roles, settings, media | Secure API skeleton, login to a working admin, upload media, edit settings |
| **2 — Builder** | components, pages, menus, sliders, popups, forms, content engine | The Elementor part: build & publish any page; public delivery API |
| **3 — Blog + SEO** | taxonomy, blog, comments, seo (redirects/sitemap/robots) | Full blog CMS with per-entity SEO |
| **4 — Commerce** | catalog, orders, customers, coupons, shipping | Full shop: products → cart → checkout → order lifecycle |
| **5 — Growth** | marketing, analytics, notifications, activity, jobs, i18n polish | Dashboard fully live, newsletter, audit, scheduled everything |

Each phase ships independently usable and tested — no big-bang integration at the end.
