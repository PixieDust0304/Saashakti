import { describe, expect, it } from 'vitest';
import { matchSchemes } from './index';
import { schemeRegistry } from '../../scheme-registry/src';
import type { BeneficiaryProfile } from '../../types/src';

describe('scheme engine', () => {
  it('returns eligible and partial matches with explanations', () => {
    const profile: BeneficiaryProfile = {
      age: 27,
      district: 'Lucknow',
      maritalStatus: 'married',
      casteCategory: 'obc',
      annualIncome: 100000,
      isBpl: true,
      hasBankAccount: true,
      hasRationCard: false,
      isPregnant: true,
      isLactating: false,
      isShgMember: true,
      hasDisability: false,
    };

    const results = matchSchemes(profile, schemeRegistry.schemes);

    expect(results[0].status).toBe('eligible');
    expect(results.some((result) => result.status === 'partial')).toBe(true);
    expect(results[0].explanationHi.length).toBeGreaterThan(0);
  });
});
