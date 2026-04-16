import { env } from '../../config/env.js';
import type { AadhaarProvider } from './types.js';
import { MockAadhaarProvider } from './mock.js';
import { KarzaAadhaarProvider } from './karza.js';
import { UidaiAadhaarProvider } from './uidai.js';

export type { AadhaarProvider, AadhaarStatus, KycRecord, KycAddress } from './types.js';

const providers: Record<string, () => AadhaarProvider> = {
  mock: () => new MockAadhaarProvider(),
  karza: () => new KarzaAadhaarProvider(),
  uidai: () => new UidaiAadhaarProvider(),
};

let instance: AadhaarProvider | null = null;

export const getAadhaarProvider = (): AadhaarProvider => {
  if (instance) return instance;
  const key = env.AADHAAR_PROVIDER ?? 'mock';
  const factory = providers[key];
  if (!factory) {
    const valid = Object.keys(providers).join(', ');
    throw new Error(`Unknown AADHAAR_PROVIDER "${key}". Valid: ${valid}`);
  }
  instance = factory();
  return instance;
};
