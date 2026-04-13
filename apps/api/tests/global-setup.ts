import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgres://saashakti:saashakti@localhost:5432/saashakti';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.OTP_MODE ??= 'mock';
process.env.LOG_LEVEL ??= 'silent';
process.env.PORT ??= '0';

const tryConnect = async (): Promise<boolean> => {
  try {
    const { sql } = await import('../src/db/client.js');
    await sql`SELECT 1`;
    const { redis } = await import('../src/redis/client.js');
    await redis.ping();
    await sql.end({ timeout: 2 });
    redis.disconnect();
    return true;
  } catch (err) {
    console.warn(
      '\n[tests] Skipping integration suite — Postgres/Redis not reachable.',
      '\n[tests] Start them with: docker compose up -d postgres redis',
      '\n[tests] Error:',
      (err as Error).message,
    );
    return false;
  }
};

export default async function setup() {
  const ready = await tryConnect();
  if (!ready) {
    // Short-circuit the whole suite when infra is missing.
    process.env.SAASHAKTI_SKIP_INTEGRATION = '1';
    return;
  }

  const { runMigrations } = await import('../src/db/migrate.js');
  const { sql } = await import('../src/db/client.js');
  await runMigrations();
  await sql.end({ timeout: 2 });
}
