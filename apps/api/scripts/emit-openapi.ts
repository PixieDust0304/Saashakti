import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../../../docs/openapi.json');

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Saashakti API',
    version: '0.1.0',
    description:
      'Saashakti backend — OTP onboarding, Aadhaar (mock), beneficiary, scheme matching, dashboard.',
  },
  servers: [{ url: 'http://localhost:3001' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
            required: ['code', 'message'],
          },
        },
      },
      OtpRequestBody: {
        type: 'object',
        properties: { mobileNumber: { type: 'string' } },
        required: ['mobileNumber'],
      },
      OtpRequestResponse: {
        type: 'object',
        properties: {
          mobileNumber: { type: 'string' },
          expiresInSeconds: { type: 'integer' },
          cooldownSeconds: { type: 'integer' },
          mockCode: { type: 'string', description: 'Only present in OTP_MODE=mock' },
        },
      },
      OtpVerifyBody: {
        type: 'object',
        properties: {
          mobileNumber: { type: 'string' },
          code: { type: 'string', pattern: '^\\d{4,6}$' },
        },
        required: ['mobileNumber', 'code'],
      },
      OtpVerifyResponse: {
        type: 'object',
        properties: {
          mobileNumber: { type: 'string' },
          session: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      AadhaarStatus: {
        type: 'string',
        enum: ['not_started', 'pending', 'verified', 'failed', 'mock_verified'],
      },
      BeneficiaryProfile: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          district: { type: 'string' },
          maritalStatus: {
            type: 'string',
            enum: ['single', 'married', 'widowed', 'divorced', 'separated'],
          },
          casteCategory: { type: 'string', enum: ['general', 'obc', 'sc', 'st'] },
          incomeBracket: {
            type: 'string',
            enum: ['below_50000', '50000_100000', '100000_200000', '200000_400000', 'above_400000'],
          },
          isBpl: { type: 'boolean' },
          hasBankAccount: { type: 'boolean' },
          hasRationCard: { type: 'boolean' },
          isPregnant: { type: 'boolean' },
          isLactating: { type: 'boolean' },
          hasGirlChild: { type: 'boolean' },
          isShgMember: { type: 'boolean' },
          exclusionFlags: { type: 'array', items: { type: 'string' } },
          disability: { type: 'object', additionalProperties: true },
        },
        required: ['name'],
      },
      MatchResult: {
        type: 'object',
        properties: {
          schemeId: { type: 'string' },
          schemeNameHi: { type: 'string' },
          schemeNameEn: { type: 'string' },
          status: { type: 'string', enum: ['eligible', 'partial', 'ineligible'] },
          annualValueInr: { type: 'number' },
          matchedRules: { type: 'array', items: { type: 'string' } },
          missingRules: { type: 'array', items: { type: 'string' } },
          nextActionHi: { type: 'string' },
          nextActionEn: { type: 'string' },
          explanationHi: { type: 'string' },
          explanationEn: { type: 'string' },
        },
      },
      DashboardSummary: {
        type: 'object',
        properties: {
          totals: {
            type: 'object',
            properties: {
              beneficiaries: { type: 'integer' },
              profiles: { type: 'integer' },
              matches: { type: 'integer' },
              last24hBeneficiaries: { type: 'integer' },
            },
          },
          byDistrict: {
            type: 'array',
            items: {
              type: 'object',
              properties: { district: { type: 'string' }, count: { type: 'integer' } },
            },
          },
          byAadhaarStatus: {
            type: 'array',
            items: {
              type: 'object',
              properties: { status: { type: 'string' }, count: { type: 'integer' } },
            },
          },
          generatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Liveness probe',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/ready': {
      get: {
        summary: 'Readiness probe (Postgres + Redis)',
        responses: { '200': { description: 'Ready' }, '503': { description: 'Degraded' } },
      },
    },
    '/v1/otp/request': {
      post: {
        summary: 'Request an OTP code',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/OtpRequestBody' } },
          },
        },
        responses: {
          '200': {
            description: 'OTP dispatched',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OtpRequestResponse' },
              },
            },
          },
          '429': {
            description: 'Cooldown or hourly limit',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/otp/verify': {
      post: {
        summary: 'Verify an OTP code and obtain a session',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/OtpVerifyBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Verified',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OtpVerifyResponse' },
              },
            },
          },
          '400': {
            description: 'Bad code',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/aadhaar/start': {
      post: {
        summary: 'Start Aadhaar verification (mock provider)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { $ref: '#/components/schemas/AadhaarStatus' } },
                },
              },
            },
          },
        },
      },
    },
    '/v1/aadhaar/status': {
      get: {
        summary: 'Get Aadhaar verification status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Status' } },
      },
    },
    '/v1/beneficiary': {
      post: {
        summary: 'Create or fetch beneficiary record',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { registrationMode: { type: 'string', enum: ['self', 'assisted'] } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Existing beneficiary returned' },
          '201': { description: 'Beneficiary created' },
        },
      },
    },
    '/v1/beneficiary/me': {
      get: {
        summary: 'Get current beneficiary and profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Beneficiary + profile' } },
      },
    },
    '/v1/beneficiary/profile': {
      put: {
        summary: 'Upsert profile fields',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BeneficiaryProfile' } },
          },
        },
        responses: { '200': { description: 'Profile saved' } },
      },
    },
    '/v1/matching/run': {
      post: {
        summary: 'Run scheme matching and persist results',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Match results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    results: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MatchResult' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/matching/me': {
      get: {
        summary: 'Get last-persisted match results',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Match results' } },
      },
    },
    '/v1/dashboard/summary': {
      get: {
        summary: 'Aggregated dashboard counts (cached)',
        responses: {
          '200': {
            description: 'Summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardSummary' },
              },
            },
          },
        },
      },
    },
    '/v1/dashboard/recent': {
      get: {
        summary: 'Recent registrations feed (cached)',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: { '200': { description: 'Entries' } },
      },
    },
  },
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
// eslint-disable-next-line no-console
console.log(`[openapi] wrote ${outPath}`);
