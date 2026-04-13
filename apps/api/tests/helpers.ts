import type { FastifyInstance } from 'fastify';

export const shouldSkip = (): boolean => process.env.SAASHAKTI_SKIP_INTEGRATION === '1';

export const buildTestApp = async (): Promise<FastifyInstance> => {
  const { buildApp } = await import('../src/app.js');
  const app = await buildApp();
  await app.ready();
  return app;
};

export const truncateAll = async (): Promise<void> => {
  const { sql } = await import('../src/db/client.js');
  await sql`TRUNCATE matched_schemes, beneficiary_profiles, beneficiaries, user_sessions, otp_requests, audit_logs, dashboard_events RESTART IDENTITY CASCADE`;
  const { redis } = await import('../src/redis/client.js');
  const keys = await redis.keys('otp:*');
  if (keys.length > 0) await redis.del(...keys);
  const dashKeys = await redis.keys('dashboard:*');
  if (dashKeys.length > 0) await redis.del(...dashKeys);
};

export const closeInfra = async (): Promise<void> => {
  const { sql } = await import('../src/db/client.js');
  const { redis } = await import('../src/redis/client.js');
  await sql.end({ timeout: 2 });
  redis.disconnect();
};

export const randomMobile = (): string => {
  const suffix = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, '0');
  return `91900${suffix}`;
};

export const authenticate = async (
  app: FastifyInstance,
  mobile: string = randomMobile(),
): Promise<{ token: string; mobile: string }> => {
  const req = await app.inject({
    method: 'POST',
    url: '/v1/otp/request',
    payload: { mobileNumber: mobile },
  });
  if (req.statusCode !== 200) {
    throw new Error(`otp request failed: ${req.statusCode} ${req.body}`);
  }
  const reqBody = req.json() as { mockCode?: string };
  if (!reqBody.mockCode) throw new Error('mock OTP mode required for tests');

  const verify = await app.inject({
    method: 'POST',
    url: '/v1/otp/verify',
    payload: { mobileNumber: mobile, code: reqBody.mockCode },
  });
  if (verify.statusCode !== 200) {
    throw new Error(`otp verify failed: ${verify.statusCode} ${verify.body}`);
  }
  const body = verify.json() as { session: { token: string } };
  return { token: body.session.token, mobile };
};
