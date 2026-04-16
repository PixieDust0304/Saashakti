import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAadhaarProvider, updateAadhaarStatus } from './service.js';
import { requireAuth } from '../auth/plugin.js';

const kycQuery = z.object({
  aadhaarNumber: z.string().min(8).max(20),
});

export const registerAadhaarRoutes = async (app: FastifyInstance) => {
  app.post('/v1/aadhaar/start', async (req, reply) => {
    const session = await requireAuth(req);
    const provider = getAadhaarProvider();
    const result = await provider.startVerification(session.mobileNumber);
    const applied = await updateAadhaarStatus(session.mobileNumber, result.status);
    return reply.status(200).send({ status: applied.status });
  });

  app.get('/v1/aadhaar/status', async (req, reply) => {
    const session = await requireAuth(req);
    const provider = getAadhaarProvider();
    const result = await provider.getStatus(session.mobileNumber);
    return reply.status(200).send({ status: result.status });
  });

  app.get(
    '/v1/aadhaar/kyc',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const query = kycQuery.parse(req.query);
      const provider = getAadhaarProvider();
      const record = await provider.fetchKyc(query.aadhaarNumber);
      return reply.status(200).send({ kyc: record });
    },
  );
};
