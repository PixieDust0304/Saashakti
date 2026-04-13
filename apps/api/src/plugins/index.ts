import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from '../config/env.js';
import { registerRequestId } from './request-id.js';
import { registerErrorHandler } from './error-handler.js';

export const registerPlugins = async (app: FastifyInstance) => {
  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
    credentials: true,
  });
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    allowList: (req) => req.url === '/health' || req.url === '/ready',
  });
  await registerRequestId(app);
  await registerErrorHandler(app);
};
