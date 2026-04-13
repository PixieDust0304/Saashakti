import test from 'node:test';
import assert from 'node:assert/strict';
import { createBeneficiaryHandlers } from '../src/routes/beneficiaries.js';
import { InMemoryBeneficiaryStore } from '../src/services/beneficiary-store.js';

const makePayload = () => ({
  mobileNumber: '9876543210',
  aadhaarStatus: 'pending',
  registrationMode: 'self',
  profile: {
    district: 'Lucknow',
    age: 27,
    isPregnant: true,
    isBpl: true,
    hasBankAccount: true,
    hasRationCard: true,
    isShgMember: false,
  },
});

test('create beneficiary is idempotent by mobile number', async () => {
  const handlers = createBeneficiaryHandlers({
    beneficiaryStore: new InMemoryBeneficiaryStore(),
    createRequestId: () => 'req-beneficiary',
  });

  const first = await handlers.createBeneficiary(makePayload());
  assert.equal(first.statusCode, 201);

  const second = await handlers.createBeneficiary(makePayload());
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.data.beneficiary.id, first.body.data.beneficiary.id);
});

test('match endpoint returns ranked schemes', async () => {
  const store = new InMemoryBeneficiaryStore();
  const handlers = createBeneficiaryHandlers({
    beneficiaryStore: store,
    createRequestId: () => 'req-match',
  });

  const created = await handlers.createBeneficiary(makePayload());
  const beneficiaryId = created.body.data.beneficiary.id;

  const matchResult = await handlers.matchBeneficiary(beneficiaryId);
  assert.equal(matchResult.statusCode, 200);
  assert.ok(matchResult.body.data.matches.length > 0);
});

test('create beneficiary validates profile payload', async () => {
  const handlers = createBeneficiaryHandlers({
    beneficiaryStore: new InMemoryBeneficiaryStore(),
    createRequestId: () => 'req-invalid',
  });

  const result = await handlers.createBeneficiary({
    mobileNumber: '9999999999',
    aadhaarStatus: 'pending',
    registrationMode: 'self',
    profile: {},
  });

  assert.equal(result.statusCode, 400);
  assert.equal(result.body.error.code, 'invalid_profile');
});
