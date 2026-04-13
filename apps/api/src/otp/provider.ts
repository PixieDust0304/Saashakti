import { env } from '../config/env.js';

export interface SmsProvider {
  send(mobile: string, code: string): Promise<{ providerId: string }>;
}

class MockSmsProvider implements SmsProvider {
  async send(mobile: string, code: string) {
    // eslint-disable-next-line no-console
    console.log(`[mock-sms] OTP for ${mobile}: ${code}`);
    return { providerId: `mock-${Date.now()}` };
  }
}

class ProductionSmsProvider implements SmsProvider {
  async send(_mobile: string, _code: string): Promise<{ providerId: string }> {
    throw new Error('SMS provider not configured');
  }
}

export const smsProvider: SmsProvider =
  env.OTP_MODE === 'mock' ? new MockSmsProvider() : new ProductionSmsProvider();
