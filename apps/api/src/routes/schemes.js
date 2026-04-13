import { schemeRegistry } from '../../../../packages/scheme-registry/src/index.js';

export const createSchemeHandlers = ({ createRequestId }) => ({
  listSchemes: async () => {
    const requestId = createRequestId();
    return {
      statusCode: 200,
      body: {
        data: {
          version: schemeRegistry.version,
          schemes: schemeRegistry.schemes,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  },
});
