import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const data = require('./data/schemes.json');
export const schemeRegistry = data;
export const schemes = data.schemes;
export const schemeVersion = data.version;
export default data;
