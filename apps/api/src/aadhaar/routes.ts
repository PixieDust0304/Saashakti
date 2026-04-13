import type { FastifyInstance } from 'fastify';
import { aadhaarProvider, updateAadhaarStatus } from './service.js';
import { requireAuth } from '../auth/plugin.js';

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
};
