import test from 'node:test';
import assert from 'node:assert/strict';
import { createBeneficiaryHandlers } from '../src/routes/beneficiaries.js';
import { createDashboardHandlers } from '../src/routes/dashboard.js';
import { InMemoryBeneficiaryStore } from '../src/services/beneficiary-store.js';

test('dashboard summary and recent registrations', async () => {
  const store = new InMemoryBeneficiaryStore();
  const beneficiaries = createBeneficiaryHandlers({
    beneficiaryStore: store,
    createRequestId: () => 'req-create',
  });
  const dashboard = createDashboardHandlers({
    beneficiaryStore: store,
    createRequestId: () => 'req-dashboard',
  });

  await beneficiaries.createBeneficiary({
    mobileNumber: '9999999991',
    aadhaarStatus: 'pending',
    registrationMode: 'assisted',
    profile: { district: 'Lucknow' },
  });

  await beneficiaries.createBeneficiary({
    mobileNumber: '9999999992',
    aadhaarStatus: 'mock_verified',
    registrationMode: 'self',
    profile: { district: 'Kanpur' },
  });

  const summary = await dashboard.summary();
  assert.equal(summary.statusCode, 200);
  assert.equal(summary.body.data.totalRegistrations, 2);
  assert.equal(summary.body.data.districtBreakdown.Lucknow, 1);

  const recent = await dashboard.recent({ limit: 1, offset: 0 });
  assert.equal(recent.statusCode, 200);
  assert.equal(recent.body.data.items.length, 1);
  assert.equal(recent.body.data.total, 2);
});
