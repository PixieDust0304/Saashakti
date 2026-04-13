import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aadhaarProvider, updateAadhaarStatus } from './service.js';
import { requireAuth } from '../auth/plugin.js';

const kycQuery = z.object({
  aadhaarNumber: z.string().min(8).max(20),
});

export const registerAadhaarRoutes = async (app: FastifyInstance) => {
  app.post('/v1/aadhaar/start', async (req, reply) => {
    const session = await requireAuth(req);
    const provider = await aadhaarProvider.startVerification(session.mobileNumber);
    const applied = await updateAadhaarStatus(session.mobileNumber, provider.status);
    return reply.status(200).send({ status: applied.status });
  });

  app.get('/v1/aadhaar/status', async (req, reply) => {
    const session = await requireAuth(req);
    const result = await aadhaarProvider.getStatus(session.mobileNumber);
    return reply.status(200).send({ status: result.status });
  });

  // Public, rate-limited mock e-KYC fetch for the admin-web intake form.
  // Not protected by auth because the admin-web doesn't run a session
  // (yet); the field worker auth code is checked on /v1/intake instead.
  app.get(
    '/v1/aadhaar/kyc',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const query = kycQuery.parse(req.query);
      const record = await aadhaarProvider.fetchKyc(query.aadhaarNumber);
      return reply.status(200).send({ kyc: record });
    },
  );
};
