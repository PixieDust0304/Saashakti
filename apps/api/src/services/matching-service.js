import { matchSchemes } from '../../../../packages/scheme-engine/src/index.js';
import { schemeRegistry } from '../../../../packages/scheme-registry/src/index.js';

export const evaluateBeneficiaryMatches = (profile) =>
  matchSchemes(profile, schemeRegistry.schemes);
