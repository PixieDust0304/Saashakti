import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { sql } from './client.js';
import { env } from '../config/env.js';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATIONS_DIR = resolve(here, '../../../../infra/sql');
const MIGRATIONS_DIR = env.MIGRATIONS_DIR
  ? resolve(env.MIGRATIONS_DIR)
  : DEFAULT_MIGRATIONS_DIR;

const ensureMigrationsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const getApplied = async (): Promise<Set<string>> => {
  const rows = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  return new Set(rows.map((r) => r.name));
};

const runOne = async (name: string, fullPath: string) => {
  const body = await readFile(fullPath, 'utf8');
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`INSERT INTO _migrations (name) VALUES (${name})`;
  });
};

export const runMigrations = async (): Promise<{ applied: string[]; skipped: string[] }> => {
  await ensureMigrationsTable();
  const applied = await getApplied();

  const entries = await readdir(MIGRATIONS_DIR);
  const sqlFiles = entries.filter((f) => f.endsWith('.sql')).sort();

  const appliedNow: string[] = [];
  const skipped: string[] = [];

  for (const file of sqlFiles) {
    if (applied.has(file)) {
      skipped.push(file);
      continue;
    }
    const full = join(MIGRATIONS_DIR, file);
    // eslint-disable-next-line no-console
    console.log(`[migrate] applying ${file}`);
    await runOne(file, full);
    appliedNow.push(file);
  }

  return { applied: appliedNow, skipped };
};

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runMigrations()
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log('[migrate] done', result);
      return sql.end();
    })
    .catch(async (err) => {
      // eslint-disable-next-line no-console
      console.error('[migrate] failed', err);
      await sql.end({ timeout: 5 });
      process.exit(1);
    });
}
