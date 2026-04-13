import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { validateScheme, validateRegistry } from './schema.js';

const require = createRequire(import.meta.url);
const data = require('./data/schemes.json');

test('validates the full registry', () => {
  assert.equal(validateRegistry(data), true);
});

test('rejects null and non-object input', () => {
  assert.equal(validateScheme(null), false);
  assert.equal(validateScheme('not-an-object'), false);
});

test('registry has at least one scheme', () => {
  assert.ok(Array.isArray(data.schemes));
  assert.ok(data.schemes.length > 0);
});
