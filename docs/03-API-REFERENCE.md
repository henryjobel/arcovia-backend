# Avron CMS — REST API Architecture

> Base URL: `/api/v1`. Every list endpoint supports the standard query contract
> (`?page&limit&sort&search&filter[...]&fields`) documented in `01-ARCHITECTURE.md §7`.
> **Perm** = permission key enforced by `authorize()`. 🔓 = public (rate-limited + cached),
> 👤 = any authenticated user, 🛒 = customer token.

---

## 1. Auth — `/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | 🔓 | email+password → access token (+ refresh cookie). Returns `{twoFactorRequired, challengeToken}` if 2FA on |
| POST | `/auth/2fa/verify` | 🔓 | challengeToken + TOTP code → tokens |
| POST | `/auth/refresh` | 🔓 cookie | rotate refresh token → new access token (reuse detection) |
| POST | `/auth/logout` | 👤 | revoke current session, clear cookie |
| POST | `/auth/logout-all` | 👤 | revoke every session (bumps tokenVersion) |
| POST | `/auth/forgot-password` | 🔓 | always 200 (no enumeration); emails reset link |
| POST | `/auth/reset-password` | 🔓 | token + newPassword |
| POST | `/auth/change-password` | 👤 | currentPassword + newPassword; revokes other sessions |
| GET | `/auth/me` | 👤 | profile + resolved permissions (drives admin UI menu) |
| PATCH | `/auth/me` | 👤 | update own profile/avatar |
| GET | `/auth/sessions` | 👤 | list active sessions/devices |
| DELETE | `/auth/sessions/:id` | 👤 | revoke one session |
| POST | `/auth/2fa/setup` → `/auth/2fa/enable` → `/auth/2fa/disable` | 👤 | TOTP enrolment lifecycle |
| POST | `/auth/register` | 🔓 | customer self-registration (role forced to `customer`) |

## 2. Admin — users, roles, activity, notifications

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/users` | `users.view` / `users.create` |
| GET / PATCH / DELETE | `/admin/users/:id` | `users.view` / `users.update` / `users.delete` |
| PATCH | `/admin/users/:id/status` · `/admin/users/:id/role` | `users.update` (level guard) |
| GET / POST | `/admin/roles` | `roles.manage` |
| GET / PATCH / DELETE | `/admin/roles/:id` | `roles.manage` (isSystem locked) |
| GET | `/admin/permissions` | `roles.manage` — full permission catalog for the role editor UI |
| GET | `/admin/activity` | `activity.view` — filter by module/actor/date |
| GET | `/admin/notifications` · PATCH `/admin/notifications/:id/read` · POST `/admin/notifications/read-all` | 👤 admin |

## 3. Dashboard — `/admin/dashboard`

| Method | Path | Perm | Returns |
|---|---|---|---|
| GET | `/admin/dashboard` | `dashboard.view` | one payload: visitor stats (`?range=7d|30d|12m`), orders & revenue series, user counts, recent orders, recent activities, unread notifications, low-stock alerts, pending (comments/reviews/messages), system status (mongo/redis/cloudinary ping, uptime, last cron) |
| GET | `/admin/analytics` | `analytics.view` | deep analytics: top pages, referrers, devices, trends from DailyStat |

## 4. Settings — `/admin/settings`

| Method | Path | Perm |
|---|---|---|
| GET | `/admin/settings` — all groups (secrets masked) | `settings.view` |
| GET / PUT | `/admin/settings/:group` — atomic group save, Zod-validated per group | `settings.update` |
| POST | `/admin/settings/smtp/test` — send test email | `settings.update` |
| GET / POST / PATCH / DELETE | `/admin/email-templates(/:id)` + POST `/admin/email-templates/:id/preview` | `settings.update` |
| GET / POST / PATCH / DELETE | `/admin/languages(/:id)` | `settings.update` |
| GET / PUT | `/admin/translations?namespace=` | `settings.update` |

## 5. Media library — `/admin/media`

| Method | Path | Perm |
|---|---|---|
| GET | `/admin/media` — filter by folder/kind/tags, search | `media.view` |
| POST | `/admin/media/upload` — multipart (multer→cloudinary), multiple files | `media.upload` |
| PATCH | `/admin/media/:id` — alt/title/caption/tags/folder/focalPoint | `media.update` |
| POST | `/admin/media/:id/replace` — same publicId, all usages update | `media.update` |
| DELETE | `/admin/media/:id` · POST `/admin/media/bulk-delete` | `media.delete` |
| GET | `/admin/media/:id/usage` — where is this asset used | `media.view` |
| GET / POST / PATCH / DELETE | `/admin/media/folders(/:id)` | `media.update` |

## 6. Page builder — `/admin/pages`, `/admin/components`, `/admin/global-sections`

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/pages` | `pages.view` / `pages.create` |
| GET / PATCH / DELETE | `/admin/pages/:id` — PATCH saves **draft** tree + meta + seo | `pages.update` / `pages.delete` (system pages undeletable) |
| POST | `/admin/pages/:id/publish` · `/unpublish` | `pages.publish` |
| POST | `/admin/pages/:id/duplicate` | `pages.create` |
| PATCH | `/admin/pages/:id/sections/reorder` — `[{uid, order}]` (drag & drop) | `pages.update` |
| GET | `/admin/pages/:id/preview` — resolved **draft** tree (signed preview token for frontend) | `pages.view` |
| GET | `/admin/pages/:id/revisions` · POST `/admin/pages/:id/revisions/:version/restore` | `pages.update` |
| GET / POST / PATCH / DELETE | `/admin/global-sections(/:id)` | `pages.update` |
| GET | `/admin/components` — registry (drives the builder's widget panel + auto-forms) | `pages.view` |
| POST / PATCH / DELETE | `/admin/components(/:id)` — extend the widget catalog | `settings.update` |

## 7. Menus, sliders, popups

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/menus` · GET / PATCH / DELETE `/admin/menus/:id` (PATCH takes full items array — reorder/nest in one save) | `menus.manage` |
| GET / POST / PATCH / DELETE | `/admin/sliders(/:id)` · PATCH `/admin/sliders/:id/slides/reorder` | `sliders.manage` |
| GET / POST / PATCH / DELETE | `/admin/popups(/:id)` · GET `/admin/popups/:id/stats` | `popups.manage` |

## 8. Forms — `/admin/forms`

| Method | Path | Perm |
|---|---|---|
| GET / POST / PATCH / DELETE | `/admin/forms(/:id)` — PATCH takes full fields array | `forms.manage` |
| POST | `/admin/forms/:id/duplicate` | `forms.manage` |
| GET | `/admin/forms/:id/submissions` · GET `/admin/submissions` (all forms) | `submissions.view` |
| PATCH | `/admin/submissions/:id/status` · DELETE `/admin/submissions/:id` | `submissions.view` |
| GET | `/admin/forms/:id/submissions/export?format=csv` | `submissions.view` |

## 9. Content engine — `/admin/content`

| Method | Path | Perm |
|---|---|---|
| GET / POST / PATCH / DELETE | `/admin/content-types(/:id)` — define/edit types & fields | `content.manage` |
| GET / POST | `/admin/content/:typeKey` — list/create entries of a type | `content.manage` |
| GET / PATCH / DELETE | `/admin/content/:typeKey/:id` | `content.manage` |
| PATCH | `/admin/content/:typeKey/reorder` · POST `.../:id/publish` · `.../:id/duplicate` | `content.manage` |

## 10. Taxonomy — `/admin/categories`, `/admin/tags`

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/categories?taxonomy=blog|product|project|faq` | `taxonomy.manage` |
| GET / PATCH / DELETE | `/admin/categories/:id` · PATCH `/admin/categories/reorder` | `taxonomy.manage` |
| GET / POST / PATCH / DELETE | `/admin/tags(/:id)?taxonomy=` | `taxonomy.manage` |

## 11. Blog — `/admin/posts`

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/posts` — filters: status/category/tag/author/featured/date | `posts.view` / `posts.create` |
| GET / PATCH / DELETE | `/admin/posts/:id` (Content Writer: own drafts only — ownership guard) | `posts.update` / `posts.delete` |
| POST | `/admin/posts/:id/publish` · `/schedule` `{scheduledAt}` · `/duplicate` | `posts.publish` |
| GET | `/admin/comments?status=pending` · PATCH `/admin/comments/:id/status` · POST `/admin/comments/:id/reply` · DELETE | `comments.moderate` |

## 12. Catalog — `/admin/products`, brands, attributes, reviews

| Method | Path | Perm |
|---|---|---|
| GET / POST | `/admin/products` — filters: status/category/brand/stockStatus/flags/price range | `products.view` / `products.create` |
| GET / PATCH / DELETE | `/admin/products/:id` — PATCH includes variants array | `products.update` / `products.delete` |
| POST | `/admin/products/:id/duplicate` · PATCH `/admin/products/:id/flags` · PATCH `/admin/products/bulk` (status/category/flags) | `products.update` |
| PATCH | `/admin/products/:id/inventory` — stock adjust with reason (logged) | `products.update` |
| GET / POST / PATCH / DELETE | `/admin/brands(/:id)` · `/admin/attributes(/:id)` | `products.update` |
| GET | `/admin/reviews?status=pending` · PATCH `/admin/reviews/:id/status` · POST `/admin/reviews/:id/reply` | `products.update` |

## 13. Orders — `/admin/orders`, coupons, shipping

| Method | Path | Perm |
|---|---|---|
| GET | `/admin/orders` — filters: status/payment.status/date range/customer; search orderNumber/email | `orders.view` |
| GET | `/admin/orders/:id` · POST `/admin/orders` (manual/phone order) | `orders.view` / `orders.update` |
| PATCH | `/admin/orders/:id/status` `{status, note, notifyCustomer}` — guarded transitions, emails via event bus | `orders.update` |
| PATCH | `/admin/orders/:id/shipping` — carrier/tracking → "shipped" email | `orders.update` |
| PATCH | `/admin/orders/:id/payment` — mark paid (COD/bank) | `orders.update` |
| POST | `/admin/orders/:id/refund` `{amount, reason, restock}` | `orders.refund` |
| POST | `/admin/orders/:id/notes` · GET `/admin/orders/:id/invoice` (PDF) · POST `.../invoice/send` | `orders.view/update` |
| GET | `/admin/orders/export?format=csv&range=` | `orders.view` |
| GET / POST / PATCH / DELETE | `/admin/coupons(/:id)` · GET `/admin/coupons/:id/usage` | `coupons.manage` |
| GET / POST / PATCH / DELETE | `/admin/shipping-zones(/:id)` | `settings.update` |

## 14. Customers & inbox — admin side

| Method | Path | Perm |
|---|---|---|
| GET | `/admin/customers` — users(role customer) + aggregates: orders count, lifetime value, last order | `users.view` |
| GET | `/admin/customers/:id` — profile + orders + addresses + reviews + wishlist | `users.view` |
| GET | `/admin/messages` · GET/PATCH `/admin/messages/:id` · POST `/admin/messages/:id/reply` (sends email, threads) · DELETE | `marketing.manage` |
| GET | `/admin/subscribers` · POST (manual add) · PATCH `/:id` · DELETE · GET `/admin/subscribers/export?format=csv` | `marketing.manage` |

## 15. SEO — `/admin/seo`

| Method | Path | Perm |
|---|---|---|
| GET / PUT | `/admin/seo/global` (alias of settings group `seoDefaults`) | `seo.manage` |
| GET | `/admin/seo/overview` — every route + its resolved meta (audit table UI) | `seo.manage` |
| GET / POST / PATCH / DELETE | `/admin/redirects(/:id)` | `seo.manage` |
| POST | `/admin/seo/sitemap/regenerate` | `seo.manage` |

## 16. Customer account — `/account` 🛒

| Method | Path |
|---|---|
| GET / PATCH | `/account/profile` · POST `/account/change-password` |
| GET | `/account/orders` · `/account/orders/:orderNumber` · POST `/account/orders/:id/cancel` (while pending) |
| GET / POST / PATCH / DELETE | `/account/addresses(/:id)` · PATCH `.../:id/default` |
| GET / POST / DELETE | `/account/wishlist(/:productId)` |
| GET | `/account/reviews` · POST `/account/reviews` (verified-purchase check) |

## 17. Public delivery — `/public` 🔓 (what the React site consumes)

| Method | Path | Notes |
|---|---|---|
| GET | `/public/bootstrap?locale=` | **one call to boot the site**: public settings + branding + all menus + active languages + maintenance flag + active popups for path `/` |
| GET | `/public/pages/:slug?locale=` | fully-resolved **published** tree: sections→blocks→components with dynamicSource results injected, media URLs expanded, global sections inlined, + SEO block. `?preview=<token>` serves draft |
| GET | `/public/settings` · `/public/menus/:key` · `/public/sliders/:key` | individually cached pieces |
| GET | `/public/popups?path=` | active popups matching page/device/schedule; POST `/public/popups/:id/event` `{impression|conversion|close}` |
| GET | `/public/posts` · `/public/posts/:slug` | published only; list supports category/tag/author/search/pagination; detail includes related + approved comments |
| POST | `/public/posts/:slug/comments` | honeypot + rate limit → pending |
| GET | `/public/categories?taxonomy=` · `/public/entries/:typeKey(/:slug)` | services, projects, team, testimonials, FAQ… for dynamic components & detail pages |
| GET | `/public/products` · `/public/products/:slug` | filters: category/brand/price/attributes/flags/flash-sale; facets in `meta.facets`; detail = variants, specs, approved reviews, related |
| GET | `/public/search?q=` | unified: pages + posts + products + entries |
| GET/POST/PATCH/DELETE | `/public/cart` · `/public/cart/items(/:uid)` · POST `/public/cart/apply-coupon` | guest cart via httpOnly token cookie |
| POST | `/public/checkout` | validates stock+coupon+zone server-side, creates Order, returns orderNumber (+ gateway redirect when online payment) |
| POST | `/public/checkout/shipping-quote` | address → available methods & costs |
| GET | `/public/orders/track?number=&email=` | guest order tracking |
| POST | `/public/forms/:key/submit` | dynamic validation from Form.fields, files→cloudinary, honeypot+rate limit → store + notify + auto-reply |
| POST | `/public/newsletter/subscribe` · GET `/public/newsletter/unsubscribe?token=` | double-opt-in ready |
| POST | `/public/track` | analytics beacon (fire-and-forget, no PII) |
| GET | `/sitemap.xml` · `/robots.txt` | generated (see 02 §15) — served at root, not under /api |

## 18. Status codes & error contract

| Code | Meaning | `code` value |
|---|---|---|
| 400 | Zod validation failed | `VALIDATION_ERROR` (+ `errors[]` per field) |
| 401 | Missing/expired/invalid token | `UNAUTHORIZED` · `TOKEN_EXPIRED` (client auto-refreshes on this) |
| 403 | Authenticated but lacks permission | `FORBIDDEN` |
| 404 | Resource not found | `NOT_FOUND` |
| 409 | Duplicate (slug, email, SKU, coupon code) | `CONFLICT` |
| 422 | Business rule (out of stock, coupon expired, invalid status transition) | `BUSINESS_RULE` |
| 429 | Rate limited | `RATE_LIMITED` |
| 503 | Maintenance mode (public routes) | `MAINTENANCE` |
| 500 | Unhandled (logged with requestId, generic message in prod) | `INTERNAL` |
