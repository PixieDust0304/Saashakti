const allowedOperators = new Set(['eq', 'neq', 'gte', 'lte', 'in', 'includes', 'truthy']);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const validateRule = (rule) => {
  assert(typeof rule.field === 'string' && rule.field.length > 0, 'Rule field is required');
  assert(allowedOperators.has(rule.operator), `Unsupported operator: ${String(rule.operator)}`);
  assert(typeof rule.labelHi === 'string' && rule.labelHi.length > 0, 'Rule labelHi is required');
  assert(typeof rule.labelEn === 'string' && rule.labelEn.length > 0, 'Rule labelEn is required');
};

const validateScheme = (scheme) => {
  assert(typeof scheme.id === 'string' && scheme.id.length > 0, 'Scheme id is required');
  assert(typeof scheme.nameHi === 'string' && scheme.nameHi.length > 0, 'Scheme nameHi is required');
  assert(typeof scheme.nameEn === 'string' && scheme.nameEn.length > 0, 'Scheme nameEn is required');
  assert(Number.isFinite(scheme.annualValueInr) && scheme.annualValueInr >= 0, 'annualValueInr invalid');
  assert(Array.isArray(scheme.rules) && scheme.rules.length > 0, 'Scheme rules are required');
  for (const rule of scheme.rules) validateRule(rule);
};

export const validateRegistry = (input) => {
  assert(input && typeof input === 'object', 'Registry must be an object');
  assert(typeof input.version === 'string' && input.version.length > 0, 'Registry version is required');
  assert(!Number.isNaN(Date.parse(input.updatedAt)), 'Registry updatedAt must be ISO date');
  assert(Array.isArray(input.schemes) && input.schemes.length > 0, 'Registry schemes are required');

  for (const scheme of input.schemes) validateScheme(scheme);

  return input;
};
