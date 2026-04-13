import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { submitIntake } from './service.js';

const matchBody = z.object({
  schemeId: z.string().min(1),
  schemeNameHi: z.string().optional(),
  schemeNameEn: z.string().optional(),
  eligibilityStatus: z.enum(['eligible', 'partial', 'not_eligible', 'ineligible']),
  annualValueInr: z.number().nullable().optional(),
  explanationHi: z.string().optional(),
  explanationEn: z.string().optional(),
});

const intakeBody = z.object({
  profile: z.record(z.unknown()),
  matches: z.array(matchBody).optional(),
  fieldWorkerCode: z.string().optional(),
});

export const registerIntakeRoutes = async (app: FastifyInstance) => {
  app.post(
    '/v1/intake',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = intakeBody.parse(req.body);
      const result = await submitIntake(body);
      return reply.status(result.created ? 201 : 200).send(result);
    },
  );
};
