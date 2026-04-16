import 'dotenv/config';
import { z } from 'zod';

const csv = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().nonnegative().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  OTP_MODE: z.enum(['mock', 'sms']).default('mock'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(30),
  OTP_HOURLY_LIMIT_PER_MOBILE: z.coerce.number().int().positive().default(5),
  OTP_HOURLY_LIMIT_PER_IP: z.coerce.number().int().positive().default(20),

  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(86400),

  CORS_ORIGINS: z.string().optional(),

  DASHBOARD_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(15),

  MIGRATIONS_DIR: z.string().optional(),

  AADHAAR_PROVIDER: z.enum(['mock', 'karza', 'uidai']).default('mock'),
  AADHAAR_KARZA_API_KEY: z.string().optional(),
  AADHAAR_KARZA_BASE_URL: z.string().optional(),
  AADHAAR_AUA_CODE: z.string().optional(),
  AADHAAR_AUA_LICENSE_KEY: z.string().optional(),
  AADHAAR_ASA_API_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: csv(parsed.data.CORS_ORIGINS),
};

export type Env = typeof env;
