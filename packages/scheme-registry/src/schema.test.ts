import { describe, expect, it } from 'vitest';
import { schemeRegistry } from './index';
import { validateRegistry } from './schema';

describe('scheme registry schema', () => {
  it('loads bundled registry data', () => {
    expect(schemeRegistry.schemes.length).toBeGreaterThan(0);
    expect(schemeRegistry.version).toBe('2026.04.13');
  });

  it('rejects invalid registries', () => {
    expect(() => validateRegistry({ version: 'x', updatedAt: 'invalid', schemes: [] })).toThrow();
  });
});
