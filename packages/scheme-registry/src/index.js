import rawRegistry from './data/schemes.json' with { type: 'json' };
import { validateRegistry } from './schema.js';

export const schemeRegistry = validateRegistry(rawRegistry);
export { validateRegistry };
