import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/plugin.js';
import { HttpError } from '../plugins/error-handler.js';
import { getBeneficiaryByMobile } from '../beneficiary/service.js';
import { getMatchesForBeneficiary, runMatching } from './service.js';

export const registerMatchingRoutes = async (app: FastifyInstance) => {
  app.post('/v1/matching/run', async (req, reply) => {
    const session = await requireAuth(req);
    const beneficiary = await getBeneficiaryByMobile(session.mobileNumber);
    if (!beneficiary) {
      throw new HttpError(400, 'beneficiary_required', 'Create a beneficiary record first');
    }
    const results = await runMatching(beneficiary.id);
    return reply.status(200).send({ results });
  });

  app.get('/v1/matching/me', async (req, reply) => {
    const session = await requireAuth(req);
    const beneficiary = await getBeneficiaryByMobile(session.mobileNumber);
    if (!beneficiary) {
      throw new HttpError(404, 'beneficiary_not_found', 'No beneficiary record yet');
    }
    const results = await getMatchesForBeneficiary(beneficiary.id);
    return reply.status(200).send({ results });
  });
};
