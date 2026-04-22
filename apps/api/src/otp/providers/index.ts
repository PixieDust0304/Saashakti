import { env } from '../../config/env.js';
import type { SmsProvider } from './types.js';
import { MockSmsProvider } from './mock.js';
import { TwilioSmsProvider } from './twilio.js';
import { Msg91SmsProvider } from './msg91.js';
import { TextlocalSmsProvider } from './textlocal.js';

export type { SmsProvider } from './types.js';
export { SmsProviderError } from './types.js';

const providers: Record<string, () => SmsProvider> = {
  mock: () => new MockSmsProvider(),
  twilio: () => new TwilioSmsProvider(),
  msg91: () => new Msg91SmsProvider(),
  textlocal: () => new TextlocalSmsProvider(),
};

let instance: SmsProvider | null = null;

/**
 * Pick an SMS provider based on the SMS_PROVIDER env var.
 *
 * Production guard: if NODE_ENV === 'production' and SMS_PROVIDER is
 * 'mock' (or unset, which defaults to mock), the process throws at
 * first use. We refuse to silently ship a fake-OTP auth path to prod.
 *
 * Tests and CI run with NODE_ENV=test, so the mock provider stays
 * available there without overriding the env var.
 */
export const getSmsProvider = (): SmsProvider => {
  if (instance) return instance;

  const key = env.SMS_PROVIDER ?? 'mock';
  if (env.NODE_ENV === 'production' && key === 'mock') {
    throw new Error(
      'SMS_PROVIDER=mock is not allowed in production. Set SMS_PROVIDER to ' +
      'one of: twilio, msg91, textlocal (see docs/sms-providers.md).',
    );
  }

  const factory = providers[key];
  if (!factory) {
    const valid = Object.keys(providers).join(', ');
    throw new Error(`Unknown SMS_PROVIDER "${key}". Valid: ${valid}`);
  }

  instance = factory();
  return instance;
};

/** For tests — lets the suite inject a provider or reset the memoized one. */
export const __setSmsProviderForTests = (p: SmsProvider | null): void => {
  instance = p;
};
