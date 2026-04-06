import crypto from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { createDbClient } from '@/infrastructure/db/client';
import type { DbClientProvider } from '@/ports/db';

interface EnforceDbRateLimitInput {
  keyPrefix: string;
  fingerprint: string;
  max: number;
  windowMs: number;
}

export interface EnforceDbRateLimitResult {
  allowed: boolean;
  count: number;
}

type RateLimitDeps = {
  createDbClient?: () => DbClientProvider;
};

export async function enforceDbRateLimit(
  input: EnforceDbRateLimitInput,
  deps: RateLimitDeps = {}
): Promise<EnforceDbRateLimitResult> {
  const { db, schema } = (deps.createDbClient || createDbClient)();
  const now = Date.now();
  const windowStartMs = Math.floor(now / input.windowMs) * input.windowMs;
  const key = `${input.keyPrefix}:${input.fingerprint}`;
  const nowIso = new Date().toISOString();
  const table = (schema as any).rateLimitCounters;

  await (db as any)
    .insert(table)
    .values({
      id: crypto.randomUUID(),
      key,
      windowStartMs,
      count: 1,
      expiresAtMs: windowStartMs + input.windowMs,
      createdAt: nowIso,
      updatedAt: nowIso
    })
    .onConflictDoUpdate({
      target: [table.key, table.windowStartMs],
      set: {
        count: sql`${table.count} + 1`,
        expiresAtMs: windowStartMs + input.windowMs,
        updatedAt: nowIso
      }
    });

  const rows = await (db as any)
    .select({ count: table.count })
    .from(table)
    .where(and(eq(table.key, key), eq(table.windowStartMs, windowStartMs)))
    .limit(1);

  const count = Number(rows[0]?.count || 0);

  return {
    allowed: count <= input.max,
    count
  };
}
