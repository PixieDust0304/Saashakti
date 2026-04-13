import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { registerPlugins } from './plugins/index.js';
import { registerAuthDecorator } from './auth/plugin.js';
import { registerHealthRoutes } from './health/routes.js';
import { registerOtpRoutes } from './otp/routes.js';
import { registerAadhaarRoutes } from './aadhaar/routes.js';
import { registerBeneficiaryRoutes } from './beneficiary/routes.js';
import { registerMatchingRoutes } from './matching/routes.js';
import { registerDashboardRoutes } from './dashboard/routes.js';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : {}),
    },
    genReqId: (req) => {
      const header = req.headers['x-request-id'];
      return typeof header === 'string' && header.length > 0
        ? header
        : `req-${Math.random().toString(36).slice(2, 10)}`;
    },
  });

  await registerPlugins(app);
  await registerAuthDecorator(app);

  await registerHealthRoutes(app);
  await registerOtpRoutes(app);
  await registerAadhaarRoutes(app);
  await registerBeneficiaryRoutes(app);
  await registerMatchingRoutes(app);
  await registerDashboardRoutes(app);

  return app;
};
