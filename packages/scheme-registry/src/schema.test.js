import test from 'node:test';
import assert from 'node:assert/strict';
import { schemeRegistry } from './index.js';
import { validateRegistry } from './schema.js';

test('registry loads bundled schemes', () => {
  assert.ok(schemeRegistry.schemes.length > 0);
  assert.equal(schemeRegistry.version, '2026.04.13');
});

test('registry rejects invalid payload', () => {
  assert.throws(() => validateRegistry({ version: 'x', updatedAt: 'invalid', schemes: [] }));
});
