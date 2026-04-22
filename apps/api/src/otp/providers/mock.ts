import type { SmsProvider } from './types.js';

/**
 * Dev/test provider. Logs the OTP to stdout and returns a synthetic
 * providerId. Never use in production — env validation pins this to
 * NODE_ENV !== 'production' in providers/index.ts.
 */
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock' as const;

  async send(mobile: string, code: string): Promise<{ providerId: string }> {
    // eslint-disable-next-line no-console
    console.log(`[mock-sms] OTP for ${mobile}: ${code}`);
    return { providerId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  }
}
