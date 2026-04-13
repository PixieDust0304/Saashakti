import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/plugin.js';
import { HttpError } from '../plugins/error-handler.js';
import {
  getBeneficiaryByMobile,
  getProfile,
  upsertBeneficiary,
  upsertProfile,
} from './service.js';

const createBody = z.object({
  registrationMode: z.enum(['self', 'assisted']).default('self'),
});

const profileBody = z.object({
  name: z.string().min(1).max(200),
  age: z.number().int().min(0).max(120).optional(),
  district: z.string().min(1).max(100).optional(),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced', 'separated']).optional(),
  casteCategory: z.enum(['general', 'obc', 'sc', 'st']).optional(),
  incomeBracket: z
    .enum(['below_50000', '50000_100000', '100000_200000', '200000_400000', 'above_400000'])
    .optional(),
  isBpl: z.boolean().optional(),
  hasBankAccount: z.boolean().optional(),
  hasRationCard: z.boolean().optional(),
  isPregnant: z.boolean().optional(),
  isLactating: z.boolean().optional(),
  hasGirlChild: z.boolean().optional(),
  isShgMember: z.boolean().optional(),
  exclusionFlags: z.array(z.string()).optional(),
  disability: z.record(z.unknown()).optional(),
});

export const registerBeneficiaryRoutes = async (app: FastifyInstance) => {
  app.post('/v1/beneficiary', async (req, reply) => {
    const session = await requireAuth(req);
    const body = createBody.parse(req.body ?? {});
    const result = await upsertBeneficiary({
      mobileNumber: session.mobileNumber,
      registrationMode: body.registrationMode,
    });
    return reply.status(result.created ? 201 : 200).send(result);
  });

  app.get('/v1/beneficiary/me', async (req, reply) => {
    const session = await requireAuth(req);
    const beneficiary = await getBeneficiaryByMobile(session.mobileNumber);
    if (!beneficiary) throw new HttpError(404, 'beneficiary_not_found', 'No beneficiary record yet');
    const profile = await getProfile(beneficiary.id);
    return reply.status(200).send({ beneficiary, profile });
  });

  app.put('/v1/beneficiary/profile', async (req, reply) => {
    const session = await requireAuth(req);
    const beneficiary = await getBeneficiaryByMobile(session.mobileNumber);
    if (!beneficiary) {
      throw new HttpError(400, 'beneficiary_required', 'Create a beneficiary record first');
    }
    const body = profileBody.parse(req.body);
    const profile = await upsertProfile({ beneficiaryId: beneficiary.id, profile: body });
    return reply.status(200).send({ profile });
  });
};
