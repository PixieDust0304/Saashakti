export const validateScheme = (s) => {
  if (typeof s !== 'object' || s === null) return false;
  return typeof s.id === 'string' && typeof s.nameHi === 'string' && typeof s.nameEn === 'string' && typeof s.annualValueInr === 'number' && Array.isArray(s.rules) && Array.isArray(s.exclusions);
};
export const validateRegistry = (data) => {
  if (typeof data !== 'object' || data === null) return false;
  if (!Array.isArray(data.schemes)) return false;
  return data.schemes.every(validateScheme);
};
