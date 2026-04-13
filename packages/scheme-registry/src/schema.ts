import type { Scheme } from '../../types/src/index.js';

export interface SchemeRegistry {
  version: string;
  updatedAt: string;
  totalSchemes: number;
  schemes: Scheme[];
}

export const validateScheme = (s: unknown): s is Scheme => {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.nameHi === 'string' &&
    typeof obj.nameEn === 'string' &&
    typeof obj.annualValueInr === 'number' &&
    Array.isArray(obj.rules) &&
    Array.isArray(obj.exclusions)
  );
};

export const validateRegistry = (data: unknown): data is SchemeRegistry => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.schemes)) return false;
  return obj.schemes.every(validateScheme);
};
