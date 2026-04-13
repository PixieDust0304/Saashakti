import rawRegistry from './data/schemes.json';
import { validateRegistry } from './schema';

export const schemeRegistry = validateRegistry(rawRegistry);

export { validateRegistry } from './schema';
