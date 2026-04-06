import { z } from 'zod';
import { buildEmbeddedPostgresUrl } from '@/infrastructure/db/runtime-defaults';

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default(buildEmbeddedPostgresUrl()),
  APP_BASE_URL: z.string().optional(),
  TOKEN_ENC_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  BOOKING_WEBHOOK_DELIVERY_ENABLED: booleanFromEnv.default(true),
  RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_AVAILABILITY_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_BOOKING_MAX: z.coerce.number().int().positive().default(30)
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = EnvSchema.parse(process.env);
  }
  return cachedEnv;
}
