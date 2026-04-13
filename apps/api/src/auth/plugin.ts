import type { FastifyInstance, FastifyRequest } from 'fastify';
import { HttpError } from '../plugins/error-handler.js';
import { verifySession, type Session } from './service.js';

declare module 'fastify' {
  interface FastifyRequest {
    session?: Session;
  }
}

const extractToken = (req: FastifyRequest): string => {
  const header = req.headers.authorization;
  if (!header) throw new HttpError(401, 'unauthenticated', 'Missing Authorization header');
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'unauthenticated', 'Expected Bearer token');
  }
  return token;
};

export const requireAuth = async (req: FastifyRequest): Promise<Session> => {
  const token = extractToken(req);
  const session = await verifySession(token);
  req.session = session;
  return session;
};

export const registerAuthDecorator = async (app: FastifyInstance) => {
  app.decorate('requireAuth', requireAuth);
};

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: typeof requireAuth;
  }
}
