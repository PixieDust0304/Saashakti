import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requestOtp, verifyOtp } from './service.js';
import { issueSession } from '../auth/service.js';

const requestBody = z.object({ mobileNumber: z.string().min(10).max(20) });
const verifyBody = z.object({
  mobileNumber: z.string().min(10).max(20),
  code: z.string().regex(/^\d{4,6}$/),
});

export const registerOtpRoutes = async (app: FastifyInstance) => {
  app.post(
    '/v1/otp/request',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = requestBody.parse(req.body);
      const result = await requestOtp({ mobileNumber: body.mobileNumber, ip: req.ip });
      return reply.status(200).send(result);
    },
  );

  app.post(
    '/v1/otp/verify',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = verifyBody.parse(req.body);
      const { mobileNumber } = await verifyOtp(body);
      const { token, expiresAt } = await issueSession(mobileNumber);
      return reply.status(200).send({
        mobileNumber,
        session: { token, expiresAt: expiresAt.toISOString() },
      });
    },
  );
};
