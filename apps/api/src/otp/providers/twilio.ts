import { env } from '../../config/env.js';
import { SmsProviderError, type SmsProvider } from './types.js';

/**
 * Twilio Programmable Messaging adapter.
 *
 * POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
 *   Auth: Basic base64(SID:AUTH_TOKEN)
 *   Body (x-www-form-urlencoded): From, To, Body
 *   Response 2xx: { sid: "SM...", status: "queued", ... }
 *
 * Required env:
 *   SMS_TWILIO_ACCOUNT_SID      (AC...)
 *   SMS_TWILIO_AUTH_TOKEN
 *   SMS_TWILIO_FROM             (E.164, e.g. +14155551234 or Twilio sender ID)
 *
 * Failure modes handled:
 *   - Missing env → 503 provider_not_configured at dispatch time
 *   - Twilio 4xx/5xx → SmsProviderError with HTTP status bubbled up
 *   - Network timeout → AbortError surfaced as SmsProviderError
 */
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio' as const;

  private assertConfigured(): void {
    const missing: string[] = [];
    if (!env.SMS_TWILIO_ACCOUNT_SID) missing.push('SMS_TWILIO_ACCOUNT_SID');
    if (!env.SMS_TWILIO_AUTH_TOKEN) missing.push('SMS_TWILIO_AUTH_TOKEN');
    if (!env.SMS_TWILIO_FROM) missing.push('SMS_TWILIO_FROM');
    if (missing.length > 0) {
      throw new SmsProviderError('twilio', undefined,
        `Twilio provider missing env: ${missing.join(', ')}. See docs/sms-providers.md`);
    }
  }

  async send(mobile: string, code: string): Promise<{ providerId: string }> {
    this.assertConfigured();

    const sid = env.SMS_TWILIO_ACCOUNT_SID!;
    const token = env.SMS_TWILIO_AUTH_TOKEN!;
    const from = env.SMS_TWILIO_FROM!;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    // Prefix + with E.164 "+91" for India mobiles unless already present.
    const to = mobile.startsWith('+') ? mobile
             : mobile.startsWith('91') ? `+${mobile}`
             : `+91${mobile}`;

    const body = new URLSearchParams({
      From: from,
      To: to,
      Body: `${code} आपका सशक्ति OTP है। 5 मिनट में समाप्त होगा। / Your Saashakti OTP is ${code}. Expires in 5 minutes.`,
    });

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            authorization: `Basic ${auth}`,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: ac.signal,
        },
      );
    } catch (err) {
      throw new SmsProviderError('twilio', undefined,
        `Twilio request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new SmsProviderError('twilio', res.status,
        `Twilio ${res.status}: ${text.slice(0, 200)}`);
    }

    try {
      const data = JSON.parse(text) as { sid?: string; status?: string };
      if (!data.sid) {
        throw new SmsProviderError('twilio', res.status,
          `Twilio returned OK without sid: ${text.slice(0, 200)}`);
      }
      return { providerId: data.sid };
    } catch (err) {
      if (err instanceof SmsProviderError) throw err;
      throw new SmsProviderError('twilio', res.status,
        `Twilio response parse failed: ${(err as Error).message}`);
    }
  }
}
