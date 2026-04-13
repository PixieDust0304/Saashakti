import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  buildTestApp,
  closeInfra,
  randomMobile,
  shouldSkip,
  truncateAll,
} from './helpers.js';

const maybeDescribe = shouldSkip() ? describe.skip : describe;

maybeDescribe('OTP flow', () => {
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

  it('requests then verifies an OTP and returns a session', async () => {
    const mobile = randomMobile();

    const reqRes = await app.inject({
      method: 'POST',
      url: '/v1/otp/request',
      payload: { mobileNumber: mobile },
    });
    expect(reqRes.statusCode).toBe(200);
    const reqBody = reqRes.json() as { mockCode?: string; expiresInSeconds: number };
    expect(reqBody.mockCode).toMatch(/^\d{6}$/);
    expect(reqBody.expiresInSeconds).toBeGreaterThan(0);

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/v1/otp/verify',
      payload: { mobileNumber: mobile, code: reqBody.mockCode },
    });
    expect(verifyRes.statusCode).toBe(200);
    const verifyBody = verifyRes.json() as {
      session: { token: string; expiresAt: string };
    };
    expect(verifyBody.session.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects a wrong OTP code', async () => {
    const mobile = randomMobile();
    await app.inject({
      method: 'POST',
      url: '/v1/otp/request',
      payload: { mobileNumber: mobile },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/otp/verify',
      payload: { mobileNumber: mobile, code: '000000' },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe('otp_mismatch');
  });

  it('enforces cooldown between OTP requests', async () => {
    const mobile = randomMobile();
    const first = await app.inject({
      method: 'POST',
      url: '/v1/otp/request',
      payload: { mobileNumber: mobile },
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: 'POST',
      url: '/v1/otp/request',
      payload: { mobileNumber: mobile },
    });
    expect(second.statusCode).toBe(429);
    expect((second.json() as { error: { code: string } }).error.code).toBe('otp_cooldown');
  });
});
