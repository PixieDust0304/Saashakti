import { ApiError, toErrorEnvelope } from '../utils/errors.js';

const ensureObject = (payload) => {
  if (!payload || typeof payload !== 'object') throw new ApiError(400, 'invalid_payload', 'Expected JSON payload.');
};

export const createAuthHandlers = ({ otpService, createRequestId }) => ({
  requestOtp: async (payload) => {
    const requestId = createRequestId();
    try {
      ensureObject(payload);
      const data = await otpService.requestOtp(payload);
      return {
        statusCode: 200,
        body: {
          data,
          requestId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return toErrorEnvelope(error, requestId);
    }
  },

  verifyOtp: async (payload) => {
    const requestId = createRequestId();
    try {
      ensureObject(payload);
      const data = await otpService.verifyOtp(payload);
      return {
        statusCode: 200,
        body: {
          data,
          requestId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return toErrorEnvelope(error, requestId);
    }
  },
});
