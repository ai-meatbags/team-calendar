import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { buildEmbeddedPostgresUrl } from './src/infrastructure/db/runtime-defaults';

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || buildEmbeddedPostgresUrl()
  }
});
