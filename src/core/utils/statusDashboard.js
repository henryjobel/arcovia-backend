export const apiCatalog = [
  {
    title: 'Core',
    items: [
      { method: 'GET', path: '/api/v1/health', label: 'Server, MongoDB, Redis health' },
      { method: 'GET', path: '/api/v1/admin/dashboard', label: 'Admin dashboard widgets' },
    ],
  },
  {
    title: 'Auth',
    items: [
      { method: 'POST', path: '/api/v1/auth/login', label: 'Admin login' },
      { method: 'POST', path: '/api/v1/auth/refresh', label: 'Refresh access token' },
      { method: 'GET', path: '/api/v1/auth/me', label: 'Current user profile' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { method: 'GET', path: '/api/v1/admin/users', label: 'Users' },
      { method: 'GET', path: '/api/v1/admin/roles', label: 'Roles' },
      { method: 'GET', path: '/api/v1/admin/settings', label: 'Settings' },
      { method: 'GET', path: '/api/v1/admin/media', label: 'Media library' },
      { method: 'GET', path: '/api/v1/admin/pages', label: 'Pages' },
      { method: 'GET', path: '/api/v1/admin/content-types', label: 'Content types' },
      { method: 'GET', path: '/api/v1/admin/posts', label: 'Blog posts' },
      { method: 'GET', path: '/api/v1/admin/inquiries', label: 'Inquiries' },
      { method: 'GET', path: '/api/v1/admin/seo', label: 'SEO' },
    ],
  },
  {
    title: 'Public',
    items: [
      { method: 'GET', path: '/api/v1/public/settings', label: 'Public site settings' },
      { method: 'GET', path: '/api/v1/public/components', label: 'Component registry' },
      { method: 'GET', path: '/api/v1/public/pages/:slug', label: 'Published page by slug' },
      { method: 'GET', path: '/api/v1/public/page-meta/:slug', label: 'Published page metadata' },
      { method: 'GET', path: '/api/v1/public/entries/:typeKey', label: 'Content entries' },
      { method: 'GET', path: '/api/v1/public/posts', label: 'Published posts' },
      { method: 'POST', path: '/api/v1/public/inquiries', label: 'Submit inquiry' },
      { method: 'GET', path: '/api/v1/public/categories', label: 'Public categories' },
    ],
  },
];

export const flattenedApiCatalog = () =>
  apiCatalog.flatMap((group) => group.items.map((item) => ({ group: group.title, ...item })));

export const renderStatusDashboard = ({ title, healthPath = '/api/v1/health' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fb;
      --panel: #ffffff;
      --panel-soft: #eef4f8;
      --text: #17202a;
      --muted: #667085;
      --line: #d9e2ea;
      --ok: #0f9f6e;
      --warn: #c47a00;
      --bad: #d92d20;
      --ink: #102a43;
      --brand: #2563eb;
      --brand-2: #13a38b;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(135deg, rgba(37, 99, 235, 0.12), transparent 32rem),
        linear-gradient(225deg, rgba(19, 163, 139, 0.12), transparent 30rem),
        var(--bg);
      color: var(--text);
    }

    main {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 36px 0 42px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 5vw, 4.5rem);
      line-height: 0.95;
      letter-spacing: 0;
      color: var(--ink);
    }

    .subtitle {
      margin: 0;
      max-width: 720px;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.55;
    }

    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 38px;
      padding: 8px 13px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.76);
      color: var(--muted);
      font-weight: 700;
      white-space: nowrap;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--warn);
      box-shadow: 0 0 0 5px rgba(196, 122, 0, 0.12);
    }

    .dot.ok {
      background: var(--ok);
      box-shadow: 0 0 0 5px rgba(15, 159, 110, 0.14);
    }

    .dot.bad {
      background: var(--bad);
      box-shadow: 0 0 0 5px rgba(217, 45, 32, 0.13);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .card, .section {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 18px 45px rgba(16, 42, 67, 0.08);
    }

    .card {
      min-height: 136px;
      padding: 18px;
    }

    .card span, .section h2 span {
      display: block;
      margin-bottom: 11px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .value {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 0;
      font-size: 1.45rem;
      font-weight: 850;
      color: var(--ink);
    }

    .meta {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .section {
      padding: 20px;
      margin-top: 16px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }

    h2 {
      margin: 0;
      color: var(--ink);
      font-size: 1.25rem;
      letter-spacing: 0;
    }

    .small-link {
      color: var(--brand);
      font-weight: 800;
      text-decoration: none;
    }

    .small-link:hover { text-decoration: underline; }

    .api-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .api-group {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      overflow: hidden;
    }

    .api-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 44px;
      padding: 11px 13px;
      background: var(--panel-soft);
      color: var(--ink);
      font-weight: 850;
    }

    .api-title small {
      color: var(--muted);
      font-weight: 800;
    }

    .endpoint {
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr);
      gap: 10px;
      padding: 12px 13px;
      border-top: 1px solid var(--line);
      align-items: start;
    }

    .method {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      min-height: 28px;
      border-radius: 6px;
      background: #e8f1ff;
      color: #1647a8;
      font-size: 0.77rem;
      font-weight: 900;
    }

    .method.post { background: #e6f7f2; color: #08765a; }
    .method.put, .method.patch { background: #fff5df; color: #9a5b00; }
    .method.delete { background: #ffebe8; color: #b42318; }

    code {
      display: block;
      color: var(--ink);
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 0.92rem;
      overflow-wrap: anywhere;
    }

    .endpoint p {
      margin: 5px 0 0;
      color: var(--muted);
      line-height: 1.35;
      font-size: 0.88rem;
    }

    .log {
      display: grid;
      gap: 8px;
      margin-top: 10px;
      color: var(--muted);
      font-size: 0.93rem;
    }

    .mono { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }

    @media (max-width: 900px) {
      .grid, .api-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .topbar { flex-direction: column; }
    }

    @media (max-width: 620px) {
      main { width: min(100% - 22px, 1180px); padding-top: 24px; }
      .grid, .api-grid { grid-template-columns: 1fr; }
      .card, .section { padding: 15px; }
      .endpoint { grid-template-columns: 64px minmax(0, 1fr); }
      .section-head { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <div>
        <h1>Avron CMS API</h1>
        <p class="subtitle">Live backend status dashboard. It refreshes automatically so you can keep this tab open while developing.</p>
      </div>
      <div class="live-pill"><span id="liveDot" class="dot"></span><span id="liveText">Checking...</span></div>
    </div>

    <section class="grid" aria-label="System status">
      <article class="card">
        <span>MongoDB</span>
        <p class="value"><span id="mongoDot" class="dot"></span><b id="mongoValue">Checking</b></p>
        <p class="meta" id="mongoMeta">Waiting for database ping...</p>
      </article>
      <article class="card">
        <span>Redis</span>
        <p class="value"><span id="redisDot" class="dot"></span><b id="redisValue">Checking</b></p>
        <p class="meta" id="redisMeta">Optional cache service</p>
      </article>
      <article class="card">
        <span>Server</span>
        <p class="value" id="serverValue">Checking</p>
        <p class="meta" id="serverMeta">Runtime details loading...</p>
      </article>
      <article class="card">
        <span>Updated</span>
        <p class="value" id="updatedValue">--</p>
        <p class="meta">Refreshes every 5 seconds</p>
      </article>
    </section>

    <section class="section">
      <div class="section-head">
        <h2><span>API Map</span>Available endpoints</h2>
        <a class="small-link" href="${healthPath}">Open health JSON</a>
      </div>
      <div class="api-grid">
        ${apiCatalog
          .map(
            (group) => `<div class="api-group">
          <div class="api-title">${group.title}<small>${group.items.length} routes</small></div>
          ${group.items
            .map(
              (item) => `<div class="endpoint">
            <span class="method ${item.method.toLowerCase()}">${item.method}</span>
            <div><code>${item.path}</code><p>${item.label}</p></div>
          </div>`
            )
            .join('')}
        </div>`
          )
          .join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2><span>Live Log</span>Latest check</h2>
      </div>
      <div class="log">
        <div>Health endpoint: <span class="mono">${healthPath}</span></div>
        <div id="lastMessage">Dashboard is starting...</div>
      </div>
    </section>
  </main>

  <script>
    const healthPath = '${healthPath}';
    const $ = (id) => document.getElementById(id);
    const text = (id, value) => { $(id).textContent = value; };
    const dot = (id, state) => { $(id).className = 'dot ' + state; };
    const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
    const uptime = (seconds) => {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (d) return d + 'd ' + h + 'h';
      if (h) return h + 'h ' + m + 'm';
      if (m) return m + 'm ' + s + 's';
      return s + 's';
    };

    async function refresh() {
      try {
        const res = await fetch(healthPath, { cache: 'no-store' });
        const payload = await res.json();
        const data = payload.data || {};
        const mongo = data.mongo || {};
        const redis = data.redis;
        const healthy = Boolean(payload.success);

        dot('liveDot', healthy ? 'ok' : 'bad');
        text('liveText', healthy ? 'Live' : 'Degraded');
        dot('mongoDot', mongo.connected ? 'ok' : 'bad');
        text('mongoValue', mongo.connected ? 'Connected' : title(mongo.state || 'down'));
        text('mongoMeta', mongo.database ? (mongo.database + (mongo.host ? ' on ' + mongo.host : '')) : 'No active MongoDB connection');

        const redisOk = redis === true;
        const redisMissing = redis === 'not-configured';
        dot('redisDot', redisOk ? 'ok' : redisMissing ? '' : 'bad');
        text('redisValue', redisOk ? 'Connected' : redisMissing ? 'Not set' : 'Down');
        text('redisMeta', redisMissing ? 'REDIS_URL is optional and not configured' : redisOk ? 'Cache ping returned PONG' : 'Redis ping failed');

        text('serverValue', title(data.status || 'unknown'));
        text('serverMeta', 'Env: ' + (data.env || 'unknown') + ' | Uptime: ' + uptime(Number(data.uptime || 0)));
        text('updatedValue', new Date(data.checkedAt || Date.now()).toLocaleTimeString());
        text('lastMessage', (healthy ? 'All required services are healthy.' : 'Backend is reachable, but one or more services need attention.') + ' HTTP ' + res.status);
      } catch (err) {
        dot('liveDot', 'bad');
        text('liveText', 'Offline');
        dot('mongoDot', 'bad');
        dot('redisDot', 'bad');
        text('mongoValue', 'Unknown');
        text('redisValue', 'Unknown');
        text('serverValue', 'Offline');
        text('updatedValue', new Date().toLocaleTimeString());
        text('lastMessage', 'Could not load health JSON: ' + err.message);
      }
    }

    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;
