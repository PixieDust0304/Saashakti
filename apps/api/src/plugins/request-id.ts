import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

export const registerRequestId = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req, reply) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    (req as unknown as { id: string }).id = id;
    void reply.header('x-request-id', id);
  });
};
