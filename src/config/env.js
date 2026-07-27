import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const boolFromString = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_URL: z.string().default('http://localhost:5000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(30),
  REFRESH_COOKIE_NAME: z.string().default('avron_rt'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  REDIS_URL: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_BASE_FOLDER: z.string().default('avron'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: boolFromString,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('Avron Studio'),
  SMTP_FROM_EMAIL: z.string().default('no-reply@avron.local'),

  SEED_SUPERADMIN_NAME: z.string().default('Super Admin'),
  SEED_SUPERADMIN_EMAIL: z.string().default('admin@avron.local'),
  SEED_SUPERADMIN_PASSWORD: z.string().default('Admin@12345'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n✖ Invalid environment configuration:\n${details}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

export const corsOrigins = [
  env.CLIENT_URL,
  env.ADMIN_URL,
  ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : []),
]
  .filter(Boolean)
  .map((o) => o.trim().replace(/\/$/, ''));
