import type { FastifyInstance } from 'fastify';
import { sql } from '../db/client.js';
import { redis } from '../redis/client.js';

export const registerHealthRoutes = async (app: FastifyInstance) => {
  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  app.get('/ready', async (_req, reply) => {
    const checks: Record<string, { ok: boolean; error?: string }> = {};

    try {
      await sql`SELECT 1`;
      checks.postgres = { ok: true };
    } catch (e) {
      checks.postgres = { ok: false, error: (e as Error).message };
    }

    try {
      const pong = await redis.ping();
      checks.redis = { ok: pong === 'PONG' };
    } catch (e) {
      checks.redis = { ok: false, error: (e as Error).message };
    }

    const allOk = Object.values(checks).every((c) => c.ok);
    return reply.status(allOk ? 200 : 503).send({ status: allOk ? 'ready' : 'degraded', checks });
  });
};
