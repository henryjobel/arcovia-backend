/**
 * Phase 1 end-to-end self-test against an in-memory MongoDB.
 * No external services needed:  npm run verify
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, pass: Boolean(cond) });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? ` — ${detail}` : ''}`);
};

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('avron_cms_test');
process.env.NODE_ENV = 'development';

// ── seed ──────────────────────────────────────────────────────
const { connectDB } = await import('../src/config/db.js');
await connectDB();
const { seedRoles } = await import('../src/database/seeders/roles.seeder.js');
const { seedSuperAdmin } = await import('../src/database/seeders/admin.seeder.js');
const { seedSettings } = await import('../src/database/seeders/settings.seeder.js');
await seedRoles();
await seedSuperAdmin();
await seedSettings();
check('seeders ran', true);

// ── boot ──────────────────────────────────────────────────────
const { default: app } = await import('../src/app.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api/v1`;

const api = async (path, { method = 'GET', token, cookie, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json, setCookie: res.headers.getSetCookie?.() || [] };
};

// health
const health = await api('/health');
check('health: mongo connected', health.status === 200 && health.json?.data?.mongo === true, JSON.stringify(health.json));

// bad login
const badLogin = await api('/auth/login', { method: 'POST', body: { email: 'admin@avron.local', password: 'wrong-pass' } });
check('login rejects wrong password (401)', badLogin.status === 401, `got ${badLogin.status}`);

// good login
const login = await api('/auth/login', { method: 'POST', body: { email: 'admin@avron.local', password: 'Admin@12345' } });
const token = login.json?.data?.accessToken;
const refreshCookie = login.setCookie.find((c) => c.startsWith('avron_rt='));
check('login returns access token', login.status === 200 && Boolean(token), JSON.stringify(login.json));
check('login sets httpOnly refresh cookie', Boolean(refreshCookie) && /httponly/i.test(refreshCookie || ''), refreshCookie);

// me
const me = await api('/auth/me', { token });
check('GET /auth/me → profile + wildcard perms', me.json?.data?.permissions?.includes('*'), JSON.stringify(me.json));

// unauthenticated admin route
const noAuth = await api('/admin/users');
check('admin route without token → 401', noAuth.status === 401, `got ${noAuth.status}`);

// roles + permission catalog
const roles = await api('/admin/roles?limit=50', { token });
check('7 system roles seeded', roles.json?.data?.length === 7, `got ${roles.json?.data?.length}`);
const perms = await api('/admin/permissions', { token });
check('permission catalog served', Array.isArray(perms.json?.data?.all) && perms.json.data.all.length > 30, `got ${perms.json?.data?.all?.length}`);

// settings: read, update, mask, public
const settings = await api('/admin/settings', { token });
check('settings groups load', Boolean(settings.json?.data?.general && settings.json?.data?.smtp), JSON.stringify(Object.keys(settings.json?.data || {})));

const upd = await api('/admin/settings/general', { method: 'PUT', token, body: { siteName: { en: 'Avron Test' } } });
check('settings group update persists', upd.json?.data?.siteName?.en === 'Avron Test', JSON.stringify(upd.json));

const smtpMasked = await api('/admin/settings/smtp', { token });
check('smtp password masked or empty', ['', '••••••••'].includes(smtpMasked.json?.data?.password), JSON.stringify(smtpMasked.json?.data));

const pub = await api('/public/settings');
check('public settings exclude smtp', pub.status === 200 && Boolean(pub.json?.data?.general) && !pub.json?.data?.smtp, JSON.stringify(Object.keys(pub.json?.data || {})));
check('public settings reflect update', pub.json?.data?.general?.siteName?.en === 'Avron Test');

// validation error contract
const badUser = await api('/admin/users', { method: 'POST', token, body: { name: 'x', email: 'not-an-email', password: 'short', role: 'nope' } });
check('validation errors return field list (400)', badUser.status === 400 && Array.isArray(badUser.json?.errors) && badUser.json.errors.length >= 3, JSON.stringify(badUser.json));

// create editor + RBAC boundary
const editorRole = roles.json.data.find((r) => r.slug === 'editor');
const createUser = await api('/admin/users', {
  method: 'POST', token,
  body: { name: 'Test Editor', email: 'editor@avron.local', password: 'Editor@12345', role: editorRole._id },
});
check('create user (editor)', createUser.status === 201 && createUser.json?.data?.email === 'editor@avron.local', JSON.stringify(createUser.json));

const editorLogin = await api('/auth/login', { method: 'POST', body: { email: 'editor@avron.local', password: 'Editor@12345' } });
const editorToken = editorLogin.json?.data?.accessToken;
check('editor can log in', Boolean(editorToken));
const editorForbidden = await api('/admin/roles', { token: editorToken });
check('editor blocked from roles.manage (403)', editorForbidden.status === 403, `got ${editorForbidden.status}`);
const editorDash = await api('/admin/dashboard', { token: editorToken });
check('editor can view dashboard', editorDash.status === 200, `got ${editorDash.status}`);

// dashboard payload
const dash = await api('/admin/dashboard', { token });
check('dashboard: users total >= 2', dash.json?.data?.users?.total >= 2, JSON.stringify(dash.json?.data?.users));
check('dashboard: system healthy', dash.json?.data?.system?.status === 'healthy', JSON.stringify(dash.json?.data?.system));

// activity trail
const activity = await api('/admin/activity', { token });
check('activity log recorded actions', activity.json?.data?.length >= 2, `got ${activity.json?.data?.length}`);

// refresh rotation + reuse detection
const cookieHeader = refreshCookie.split(';')[0];
const refresh1 = await api('/auth/refresh', { method: 'POST', cookie: cookieHeader });
const newCookie = refresh1.setCookie.find((c) => c.startsWith('avron_rt='));
check('refresh rotates token', refresh1.status === 200 && Boolean(refresh1.json?.data?.accessToken) && Boolean(newCookie), JSON.stringify(refresh1.json));

const reuse = await api('/auth/refresh', { method: 'POST', cookie: cookieHeader });
check('refresh reuse detected (SESSION_COMPROMISED)', reuse.status === 401 && reuse.json?.code === 'SESSION_COMPROMISED', JSON.stringify(reuse.json));

const burned = await api('/auth/refresh', { method: 'POST', cookie: newCookie.split(';')[0] });
check('token family burned after reuse', burned.status === 401, `got ${burned.status}`);

// change password
const relogin = await api('/auth/login', { method: 'POST', body: { email: 'admin@avron.local', password: 'Admin@12345' } });
const relToken = relogin.json?.data?.accessToken;
const relCookie = relogin.setCookie.find((c) => c.startsWith('avron_rt=')).split(';')[0];
const chg = await api('/auth/change-password', { method: 'POST', token: relToken, cookie: relCookie, body: { currentPassword: 'Admin@12345', newPassword: 'Admin@54321' } });
check('change password works', chg.status === 200, JSON.stringify(chg.json));
check('old password rejected after change', (await api('/auth/login', { method: 'POST', body: { email: 'admin@avron.local', password: 'Admin@12345' } })).status === 401);
const newPwLogin = await api('/auth/login', { method: 'POST', body: { email: 'admin@avron.local', password: 'Admin@54321' } });
check('new password accepted', newPwLogin.status === 200, `got ${newPwLogin.status}`);
const adminToken = newPwLogin.json.data.accessToken;
const adminCookie = newPwLogin.setCookie.find((c) => c.startsWith('avron_rt=')).split(';')[0];

// sessions
const sess = await api('/auth/sessions', { token: adminToken, cookie: adminCookie });
check('sessions listed with current flag', Array.isArray(sess.json?.data) && sess.json.data.some((s) => s.current), JSON.stringify(sess.json?.data));

// media upload without cloudinary → clean business error, not a crash
const fd = new FormData();
fd.append('files', new Blob([Buffer.from('fake image bytes')], { type: 'image/png' }), 'test.png');
const up = await fetch(`${base}/admin/media/upload`, { method: 'POST', headers: { authorization: `Bearer ${adminToken}` }, body: fd });
const upJson = await up.json().catch(() => null);
check('media upload w/o cloudinary → clean 422', up.status === 422 && upJson?.code === 'BUSINESS_RULE', `got ${up.status} ${JSON.stringify(upJson)}`);

// media folders
const folder = await api('/admin/media/folders', { method: 'POST', token: adminToken, body: { name: 'Products 2026' } });
check('media folder created with path', folder.status === 201 && folder.json?.data?.path === '/products-2026', JSON.stringify(folder.json));

// notifications
const notif = await api('/admin/notifications', { token: adminToken });
check('notifications endpoint works', notif.status === 200 && typeof notif.json?.meta?.unread === 'number', JSON.stringify(notif.json));

// 404 contract
const missing = await api('/nope');
check('unknown route → 404 envelope', missing.status === 404 && missing.json?.code === 'NOT_FOUND');

// ── summary ───────────────────────────────────────────────────
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
server.close();
await (await import('mongoose')).default.disconnect();
await mongod.stop();
process.exit(failed.length ? 1 : 0);
