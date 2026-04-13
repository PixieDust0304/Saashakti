import { describe, it, expect } from 'vitest';
import { validateScheme, validateRegistry } from './schema.js';
import data from './data/schemes.json' assert { type: 'json' };

describe('scheme-registry validation', () => {
  it('validates full registry', () => {
    expect(validateRegistry(data)).toBe(true);
  });

  it('validates each scheme has required fields', () => {
    for (const s of data.schemes) {
      expect(validateScheme(s)).toBe(true);
    }
  });

  it('has 21 schemes', () => {
    expect(data.schemes.length).toBe(21);
  });

  it('every scheme has rules array', () => {
    for (const s of data.schemes) {
      expect(Array.isArray(s.rules)).toBe(true);
      expect(s.rules.length).toBeGreaterThan(0);
    }
  });

  it('every scheme has exclusions array', () => {
    for (const s of data.schemes) {
      expect(Array.isArray(s.exclusions)).toBe(true);
    }
  });

  it('Mahtari Vandan has 4 exclusions', () => {
    const mv = data.schemes.find((s: any) => s.id === 'cg-mahtari-vandan');
    expect(mv).toBeDefined();
    expect(mv!.exclusions.length).toBe(4);
  });

  it('rejects invalid data', () => {
    expect(validateScheme(null)).toBe(false);
    expect(validateScheme({})).toBe(false);
    expect(validateScheme({ id: 'x' })).toBe(false);
    expect(validateRegistry(null)).toBe(false);
    expect(validateRegistry({ schemes: [null] })).toBe(false);
  });
});
