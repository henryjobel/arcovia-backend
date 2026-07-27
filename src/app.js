import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env, corsOrigins } from './config/env.js';
import { generalLimiter } from './core/middlewares/rateLimiters.js';
import { requestLogger } from './core/middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './core/errors/errorHandler.js';
import { dbStatus } from './config/db.js';
import { redisPing } from './config/redis.js';
import { flattenedApiCatalog, renderStatusDashboard } from './core/utils/statusDashboard.js';
import routes from './routes/index.js';

const app = express();

app.set('trust proxy', 1); // behind nginx/render/railway — correct req.ip for rate limiting

/* security */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin/no-origin (curl, mobile apps, SSR) and whitelisted origins
      if (!origin || corsOrigins.includes(origin.replace(/\/$/, ''))) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

/* parsers */
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* input hygiene: strip Mongo operators & prototype-pollution keys, collapse duplicate params.
   XSS defense is output/persist-side (core/utils/sanitizeHtml.js) so admin script fields survive. */
app.use(mongoSanitize());
app.use(hpp({ whitelist: ['sort', 'fields', 'tags'] }));

/* observability + flood control */
app.use(requestLogger);
app.use('/api', generalLimiter);

/* browser dashboard */
app.get('/', (req, res) => {
  res.type('html').send(renderStatusDashboard({ title: 'Avron CMS API Status' }));
});

app.get('/api', (req, res) => {
  res.redirect('/api/v1/health');
});

/* health */
app.get('/api/v1/health', async (req, res) => {
  const mongo = await dbStatus();
  const redis = await redisPing();
  res.status(mongo.connected ? 200 : 503).json({
    success: mongo.connected,
    data: {
      status: mongo.connected ? 'ok' : 'degraded',
      mongo,
      redis: redis === null ? 'not-configured' : redis,
      uptime: Math.floor(process.uptime()),
      env: env.NODE_ENV,
      apiBase: '/api/v1',
      endpoints: flattenedApiCatalog(),
      checkedAt: new Date().toISOString(),
    },
  });
});

/* api v1 */
app.use('/api/v1', routes);

/* errors */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
