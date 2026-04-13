import data from './data/schemes.json' with { type: 'json' };

export const schemeRegistry = data;
export const schemes = data.schemes;
export const schemeVersion = data.version;
export default data;
export { validateRegistry, validateScheme } from './schema.js';
export type { SchemeRegistry } from './schema.js';
