import { buildApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { sql } from './db/client.js';
import { redis } from './redis/client.js';

const start = async () => {
  if (env.NODE_ENV !== 'test') {
    try {
      await runMigrations();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[server] migration failed', err);
      process.exit(1);
    }
  }

  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await sql.end({ timeout: 5 });
      await redis.quit();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err, 'failed to start server');
    process.exit(1);
  }
};

start();
