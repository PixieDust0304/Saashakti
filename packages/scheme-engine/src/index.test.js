import test from 'node:test';
import assert from 'node:assert/strict';
import { matchSchemes } from './index.js';
import { schemeRegistry } from '../../scheme-registry/src/index.js';

test('matchSchemes returns eligible and partial matches', () => {
  const profile = {
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
  assert.equal(results[0].status, 'eligible');
  assert.ok(results.some((result) => result.status === 'partial'));
  assert.ok(results[0].explanationHi.length > 0);
});
