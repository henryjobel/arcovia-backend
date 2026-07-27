# Avron CMS — Backend

Enterprise CMS backend for Avron Studio. Express + MongoDB (Mongoose) + Cloudinary + Redis (optional).

**Design docs:** [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) · [docs/02-DATABASE-SCHEMAS.md](docs/02-DATABASE-SCHEMAS.md) · [docs/03-API-REFERENCE.md](docs/03-API-REFERENCE.md)

## Quick start

```bash
cd Backend
npm install

# 1. configure
cp .env.example .env        # then edit: MONGO_URI, JWT_ACCESS_SECRET, CLOUDINARY_*

# 2. seed roles, super admin, settings (idempotent)
npm run seed

# 3. run
npm run dev                 # nodemon
# or
npm start
```

- Health check: `GET http://localhost:5000/api/v1/health`
- Login: `POST /api/v1/auth/login` with the seeded super admin
  (`SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` from `.env` — **change the password after first login**)

## What's implemented (Phase 1 — Core)

| Area | Endpoints |
|---|---|
| Auth | login, logout, logout-all, refresh (rotation + reuse detection), register, forgot/reset/change password, profile, sessions & device management, full TOTP 2FA |
| Users | CRUD + status/role changes, role-level hierarchy guard |
| Roles & permissions | CRUD, permission catalog, wildcard RBAC (`*`, `module.*`), per-user grant/revoke overrides |
| Settings | 11 editable groups (general, branding, contact, social, SEO defaults, scripts, maintenance, SMTP, commerce, security, robots.txt), SMTP test, public settings endpoint |
| Media library | Cloudinary upload (multi-file), folders with nesting, metadata (alt/caption/tags/focal point), in-place replace, delete + bulk delete |
| Activity log | automatic audit trail on every mutating admin route |
| Notifications | per-user inbox, unread counts, mark read |
| Dashboard | one-call widget payload: users, media, activity, sessions, system status |

Upcoming phases (see docs/01 §12): **2** Page builder · **3** Blog + SEO · **4** Commerce · **5** Analytics & marketing.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | development server with reload |
| `npm start` | production server |
| `npm run seed` | seed roles / super admin / settings (safe to re-run) |
| `npm run smoke` | load the whole app without listening — catches wiring errors |
| `npm run verify` | full end-to-end self-test on an in-memory MongoDB (33 checks: auth, RBAC, refresh rotation, settings, media, dashboard) |

## Environment

See [.env.example](.env.example). Required: `MONGO_URI`, `JWT_ACCESS_SECRET` (32+ chars).
Optional: `REDIS_URL` (cache), `CLOUDINARY_*` (media uploads fail gracefully without it), `SMTP_*` (bootstrap fallback — runtime SMTP lives in Settings → smtp).

## Conventions

- Every module: `*.model.js → *.validation.js (Zod) → *.service.js → *.controller.js → *.routes.js`
- Responses: `{ success, message, data, meta }`; errors add `code` + optional `errors[]`
- List endpoints: `?page&limit&sort=-createdAt&search=&filter[field][op]=value&fields=`
- Auth: `Authorization: Bearer <accessToken>` (15 min) + httpOnly refresh cookie (rotated on every refresh)
