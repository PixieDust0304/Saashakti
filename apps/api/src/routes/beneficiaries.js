import { ApiError, toErrorEnvelope } from '../utils/errors.js';
import { evaluateBeneficiaryMatches } from '../services/matching-service.js';

const validAadhaarStatuses = new Set(['not_started', 'pending', 'verified', 'failed', 'mock_verified']);
const validRegistrationModes = new Set(['self', 'assisted']);

const ensureProfile = (profile) => {
  if (!profile || typeof profile !== 'object') throw new ApiError(400, 'invalid_profile', 'Profile is required.');
  if (!profile.district) throw new ApiError(400, 'invalid_profile', 'Profile district is required.');
};

export const createBeneficiaryHandlers = ({ beneficiaryStore, createRequestId }) => ({
  createBeneficiary: async (payload) => {
    const requestId = createRequestId();
    try {
      if (!payload || typeof payload !== 'object') throw new ApiError(400, 'invalid_payload', 'Expected JSON payload.');
      const mobileNumber = String(payload.mobileNumber || '').replace(/\D/g, '');
      if (mobileNumber.length !== 10) throw new ApiError(400, 'invalid_mobile_number', 'Enter a valid 10-digit mobile number.');

      if (!validAadhaarStatuses.has(payload.aadhaarStatus)) {
        throw new ApiError(400, 'invalid_aadhaar_status', 'Invalid Aadhaar status.');
      }
      if (!validRegistrationModes.has(payload.registrationMode)) {
        throw new ApiError(400, 'invalid_registration_mode', 'Invalid registration mode.');
      }

      ensureProfile(payload.profile);
      const result = await beneficiaryStore.upsertByMobile({
        mobileNumber,
        aadhaarStatus: payload.aadhaarStatus,
        registrationMode: payload.registrationMode,
        profile: payload.profile,
      });

      return {
        statusCode: result.created ? 201 : 200,
        body: {
          data: result,
          requestId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return toErrorEnvelope(error, requestId);
    }
  },

  matchBeneficiary: async (beneficiaryId) => {
    const requestId = createRequestId();
    try {
      const beneficiary = await beneficiaryStore.getById(beneficiaryId);
      if (!beneficiary) throw new ApiError(404, 'beneficiary_not_found', 'Beneficiary not found.');

      const matches = evaluateBeneficiaryMatches(beneficiary.profile);
      await beneficiaryStore.saveMatches(beneficiary.id, matches);

      return {
        statusCode: 200,
        body: {
          data: {
            beneficiaryId: beneficiary.id,
            matches,
          },
          requestId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return toErrorEnvelope(error, requestId);
    }
  },
});
