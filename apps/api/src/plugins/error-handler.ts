import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const registerErrorHandler = async (app: FastifyInstance) => {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      req.log.warn({ err, code: err.code }, 'http error');
      return reply.status(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details ?? null },
      });
    }

    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Request validation failed',
          details: err.flatten(),
        },
      });
    }

    if ((err as { statusCode?: number }).statusCode) {
      const status = (err as { statusCode?: number }).statusCode ?? 500;
      return reply.status(status).send({
        error: {
          code: (err as { code?: string }).code ?? 'error',
          message: err.message,
          details: null,
        },
      });
    }

    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send({
      error: { code: 'internal_error', message: 'Internal server error', details: null },
    });
  });
};
