import http from 'node:http';
import { createRequestId } from './utils/request-id.js';
import { InMemoryOtpStore } from './services/otp-store.js';
import { RedisOtpStore } from './services/otp-store-redis.js';
import { MockSmsProvider } from './services/sms-provider.js';
import { OtpService } from './services/otp-service.js';
import { InMemoryBeneficiaryStore } from './services/beneficiary-store.js';
import { PostgresBeneficiaryStore } from './services/beneficiary-store-pg.js';
import { createAuthHandlers } from './routes/auth.js';
import { createBeneficiaryHandlers } from './routes/beneficiaries.js';
import { createDashboardHandlers } from './routes/dashboard.js';
import { createSchemeHandlers } from './routes/schemes.js';
import { logger } from './utils/logger.js';

const usePersistentStores = process.env.STORE_MODE === 'persistent';

const otpStore = usePersistentStores ? new RedisOtpStore() : new InMemoryOtpStore();
const beneficiaryStore = usePersistentStores ? new PostgresBeneficiaryStore() : new InMemoryBeneficiaryStore();

const otpService = new OtpService(otpStore, new MockSmsProvider());

const authHandlers = createAuthHandlers({ otpService, createRequestId });
const beneficiaryHandlers = createBeneficiaryHandlers({ beneficiaryStore, createRequestId });
const dashboardHandlers = createDashboardHandlers({ beneficiaryStore, createRequestId });
const schemeHandlers = createSchemeHandlers({ createRequestId });

const parseBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const parseRecentQuery = (urlString) => {
  const parsed = new URL(urlString, 'http://localhost');
  return {
    limit: parsed.searchParams.get('limit') || '20',
    offset: parsed.searchParams.get('offset') || '0',
  };
};

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', service: 'saashakti-api', storeMode: usePersistentStores ? 'persistent' : 'memory' }));
    return;
  }

  if (request.method === 'POST' && request.url === '/auth/request-otp') {
    const result = await authHandlers.requestOtp(await parseBody(request));
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'POST' && request.url === '/auth/verify-otp') {
    const result = await authHandlers.verifyOtp(await parseBody(request));
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'POST' && request.url === '/beneficiaries') {
    const result = await beneficiaryHandlers.createBeneficiary(await parseBody(request));
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'POST' && /^\/beneficiaries\/[^/]+\/match$/.test(request.url || '')) {
    const beneficiaryId = String(request.url).split('/')[2];
    const result = await beneficiaryHandlers.matchBeneficiary(beneficiaryId);
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'GET' && request.url === '/dashboard/summary') {
    const result = await dashboardHandlers.summary();
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'GET' && String(request.url || '').startsWith('/dashboard/recent')) {
    const query = parseRecentQuery(String(request.url));
    const result = await dashboardHandlers.recent(query);
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  if (request.method === 'GET' && request.url === '/schemes') {
    const result = await schemeHandlers.listSchemes();
    response.writeHead(result.statusCode, { 'content-type': 'application/json' });
    response.end(JSON.stringify(result.body));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: { code: 'not_found', message: 'Route not found' } }));
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 4000);
  server.listen(port, () => {
    logger.info({ port, storeMode: usePersistentStores ? 'persistent' : 'memory' }, 'Saashakti API listening');
  });
}

export {
  server,
  authHandlers,
  beneficiaryHandlers,
  dashboardHandlers,
  schemeHandlers,
  beneficiaryStore,
};
