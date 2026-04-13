import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  authenticate,
  buildTestApp,
  closeInfra,
  shouldSkip,
  truncateAll,
} from './helpers.js';

const maybeDescribe = shouldSkip() ? describe.skip : describe;

maybeDescribe('beneficiary + matching end-to-end', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await closeInfra();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it('creates beneficiary, saves profile, runs matching, exposes dashboard counts', async () => {
    const { token } = await authenticate(app);

    const create = await app.inject({
      method: 'POST',
      url: '/v1/beneficiary',
      headers: { authorization: `Bearer ${token}` },
      payload: { registrationMode: 'self' },
    });
    expect([200, 201]).toContain(create.statusCode);

    const profileRes = await app.inject({
      method: 'PUT',
      url: '/v1/beneficiary/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Test User',
        age: 28,
        district: 'Raipur',
        maritalStatus: 'married',
        casteCategory: 'obc',
        incomeBracket: 'below_50000',
        isBpl: true,
        hasBankAccount: true,
        hasRationCard: true,
        isPregnant: true,
        isShgMember: true,
      },
    });
    expect(profileRes.statusCode).toBe(200);

    const matchRes = await app.inject({
      method: 'POST',
      url: '/v1/matching/run',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(matchRes.statusCode).toBe(200);
    const matchBody = matchRes.json() as {
      results: Array<{ schemeId: string; status: string }>;
    };
    expect(matchBody.results.length).toBeGreaterThan(0);
    const eligible = matchBody.results.filter((r) => r.status === 'eligible');
    expect(eligible.length).toBeGreaterThan(0);

    const summary = await app.inject({ method: 'GET', url: '/v1/dashboard/summary' });
    expect(summary.statusCode).toBe(200);
    const summaryBody = summary.json() as {
      totals: { beneficiaries: number; profiles: number; matches: number };
    };
    expect(summaryBody.totals.beneficiaries).toBeGreaterThanOrEqual(1);
    expect(summaryBody.totals.profiles).toBeGreaterThanOrEqual(1);
    expect(summaryBody.totals.matches).toBeGreaterThanOrEqual(1);

    const recent = await app.inject({ method: 'GET', url: '/v1/dashboard/recent' });
    expect(recent.statusCode).toBe(200);
    const recentBody = recent.json() as { entries: Array<{ mobileNumber: string }> };
    expect(recentBody.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects unauthenticated beneficiary endpoints', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/beneficiary',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });
});
