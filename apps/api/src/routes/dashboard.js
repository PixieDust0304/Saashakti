export const createDashboardHandlers = ({ beneficiaryStore, createRequestId }) => ({
  summary: async () => {
    const requestId = createRequestId();
    return {
      statusCode: 200,
      body: {
        data: await beneficiaryStore.getSummary(),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  },

  recent: async ({ limit = 20, offset = 0 } = {}) => {
    const requestId = createRequestId();
    return {
      statusCode: 200,
      body: {
        data: await beneficiaryStore.getRecent(Number(limit), Number(offset)),
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  },
});
