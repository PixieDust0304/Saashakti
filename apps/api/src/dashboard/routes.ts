import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getRecent, getSummary } from './service.js';

const recentQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const registerDashboardRoutes = async (app: FastifyInstance) => {
  app.get('/v1/dashboard/summary', async (_req, reply) => {
    const summary = await getSummary();
    return reply.status(200).send(summary);
  });

  app.get('/v1/dashboard/recent', async (req, reply) => {
    const query = recentQuery.parse(req.query);
    const entries = await getRecent(query.limit);
    return reply.status(200).send({ entries });
  });
};
