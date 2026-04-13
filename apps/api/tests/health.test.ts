import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeInfra, shouldSkip } from './helpers.js';

const maybeDescribe = shouldSkip() ? describe.skip : describe;

maybeDescribe('health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeInfra();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('GET /ready reports infra checks', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect([200, 503]).toContain(res.statusCode);
    const body = res.json() as { checks: Record<string, { ok: boolean }> };
    expect(body.checks.postgres).toBeDefined();
    expect(body.checks.redis).toBeDefined();
  });
});
