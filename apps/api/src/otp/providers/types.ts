/**
 * Shared contract every SMS provider implements. Keeping it in its own
 * file so concrete providers only import types — the factory in index.ts
 * is the single place that picks an implementation at runtime.
 */
export interface SmsProvider {
  readonly name: 'mock' | 'twilio' | 'msg91' | 'textlocal';
  /**
   * Dispatch an OTP to the recipient mobile. Providers MUST:
   *   - throw a clear error on transport failure (so callers can 502)
   *   - return an implementation-specific providerId (SID, message id,
   *     batch id) so audit log + delivery reports can correlate.
   * Implementations MUST NOT log the raw OTP code in production.
   */
  send(mobile: string, code: string): Promise<{ providerId: string }>;
}

export class SmsProviderError extends Error {
  constructor(
    public readonly providerName: string,
    public readonly httpStatus: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'SmsProviderError';
  }
}
