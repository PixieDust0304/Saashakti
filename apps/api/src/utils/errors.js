export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const toErrorEnvelope = (error, requestId) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'internal_error';
  const message = error.message || 'Unexpected error';

  return {
    statusCode,
    body: {
      error: {
        code,
        message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
};
