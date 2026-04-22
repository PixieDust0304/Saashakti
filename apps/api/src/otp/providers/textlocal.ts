import { env } from '../../config/env.js';
import { SmsProviderError, type SmsProvider } from './types.js';

/**
 * Textlocal India adapter.
 *
 * Kept as a third option because some CG state departments already
 * have active Textlocal contracts via GeM / e-marketplace purchase.
 *
 * POST https://api.textlocal.in/send/
 *   Body (application/x-www-form-urlencoded):
 *     apikey, numbers, message, sender
 *   2xx response: { status: "success", messages: [{ id, recipient }] }
 *
 * Required env:
 *   SMS_TEXTLOCAL_API_KEY
 *   SMS_TEXTLOCAL_SENDER (6-char sender ID, DLT-registered)
 */
export class TextlocalSmsProvider implements SmsProvider {
  readonly name = 'textlocal' as const;

  private assertConfigured(): void {
    const missing: string[] = [];
    if (!env.SMS_TEXTLOCAL_API_KEY) missing.push('SMS_TEXTLOCAL_API_KEY');
    if (!env.SMS_TEXTLOCAL_SENDER) missing.push('SMS_TEXTLOCAL_SENDER');
    if (missing.length > 0) {
      throw new SmsProviderError('textlocal', undefined,
        `Textlocal provider missing env: ${missing.join(', ')}. See docs/sms-providers.md`);
    }
  }

  async send(mobile: string, code: string): Promise<{ providerId: string }> {
    this.assertConfigured();

    const normalized = mobile.replace(/\D/g, '');
    const recipient = normalized.length === 10 ? `91${normalized}` : normalized;

    const body = new URLSearchParams({
      apikey: env.SMS_TEXTLOCAL_API_KEY!,
      numbers: recipient,
      sender: env.SMS_TEXTLOCAL_SENDER!,
      message: `${code} is your Saashakti OTP. Expires in 5 minutes. (CG WCD)`,
    });

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch('https://api.textlocal.in/send/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: ac.signal,
      });
    } catch (err) {
      throw new SmsProviderError('textlocal', undefined,
        `Textlocal request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new SmsProviderError('textlocal', res.status,
        `Textlocal ${res.status}: ${text.slice(0, 200)}`);
    }

    try {
      const data = JSON.parse(text) as {
        status?: string
        messages?: { id?: string | number }[]
        errors?: { code?: number; message?: string }[]
      };
      if (data.status !== 'success') {
        const err = data.errors?.[0]?.message ?? text.slice(0, 200);
        throw new SmsProviderError('textlocal', res.status, `Textlocal rejected: ${err}`);
      }
      const id = String(data.messages?.[0]?.id ?? '');
      if (!id) {
        throw new SmsProviderError('textlocal', res.status,
          `Textlocal returned success without message id: ${text.slice(0, 200)}`);
      }
      return { providerId: id };
    } catch (err) {
      if (err instanceof SmsProviderError) throw err;
      throw new SmsProviderError('textlocal', res.status,
        `Textlocal response parse failed: ${(err as Error).message}`);
    }
  }
}
