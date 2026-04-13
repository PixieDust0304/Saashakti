import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { Redis } from 'ioredis';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgres://saashakti:saashakti@localhost:5432/saashakti';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.OTP_MODE ??= 'mock';
process.env.LOG_LEVEL ??= 'silent';
process.env.PORT ??= '0';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../../infra/sql');

const probeInfra = async (): Promise<void> => {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 1 });
  try {
    await sql`SELECT 1`;
  } finally {
    await sql.end({ timeout: 2 });
  }

  const redis = new Redis(process.env.REDIS_URL!, { lazyConnect: true });
  try {
    await redis.connect();
    await redis.ping();
  } finally {
    redis.disconnect();
  }
};

const applyMigrations = async (): Promise<void> => {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 1 });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const rows = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
    const applied = new Set(rows.map((r) => r.name));

    const entries = await readdir(MIGRATIONS_DIR);
    const files = entries.filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      const body = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`INSERT INTO _migrations (name) VALUES (${file})`;
      });
    }
  } finally {
    await sql.end({ timeout: 2 });
  }
};

export default async function setup() {
  try {
    await probeInfra();
  } catch (err) {
    console.warn(
      '\n[tests] Skipping integration suite — Postgres/Redis not reachable.',
      '\n[tests] Start them with: docker compose up -d postgres redis',
      '\n[tests] Error:',
      (err as Error).message,
    );
    process.env.SAASHAKTI_SKIP_INTEGRATION = '1';
    return;
  }

  await applyMigrations();
}
