import { env } from '../../config/env.js';
import { SmsProviderError, type SmsProvider } from './types.js';

/**
 * MSG91 OTP adapter — the pragmatic India-native choice.
 *
 * Why MSG91 over Twilio for a Chhattisgarh gov deployment:
 *   - DLT-compliant (TRAI Telecom Commercial Communications Customer
 *     Preference Regulations) — mandatory for transactional SMS in India
 *     since March 2021. Twilio via international routes hits throttling.
 *   - ~₹0.15 per SMS vs Twilio ~₹0.50
 *   - Hindi + Devanagari support built-in
 *   - One-shot OTP API: they generate, store, and verify the code on
 *     their side, but we use it as a dumb transport only (we own the
 *     code generation + storage in our otp_requests table) so Saashakti
 *     can switch providers without re-issuing sessions.
 *
 * POST https://control.msg91.com/api/v5/flow
 *   Headers: authkey: {AUTH_KEY}, content-type: application/json
 *   Body: {
 *     template_id: "...",  // DLT-approved template id
 *     recipients: [{ mobiles: "919XXXXXXXXX", VAR1: "123456" }],
 *   }
 *   2xx response: { type: "success", message: "bulk_id_str" }
 *
 * Required env:
 *   SMS_MSG91_AUTH_KEY       (from msg91.com dashboard)
 *   SMS_MSG91_TEMPLATE_ID    (DLT-approved OTP template with {#var#} slot)
 *   SMS_MSG91_SENDER_ID      (6-char DLT-registered sender, e.g. CGWCD)
 */
export class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91' as const;

  private assertConfigured(): void {
    const missing: string[] = [];
    if (!env.SMS_MSG91_AUTH_KEY) missing.push('SMS_MSG91_AUTH_KEY');
    if (!env.SMS_MSG91_TEMPLATE_ID) missing.push('SMS_MSG91_TEMPLATE_ID');
    if (!env.SMS_MSG91_SENDER_ID) missing.push('SMS_MSG91_SENDER_ID');
    if (missing.length > 0) {
      throw new SmsProviderError('msg91', undefined,
        `MSG91 provider missing env: ${missing.join(', ')}. See docs/sms-providers.md`);
    }
  }

  async send(mobile: string, code: string): Promise<{ providerId: string }> {
    this.assertConfigured();

    // MSG91 wants E.164 without the + — e.g. 919876543210. The beneficiary
    // flow already stores digits-only, so most inputs arrive as "91XXXXXXXXXX"
    // or "XXXXXXXXXX" (Indian 10-digit); prefix 91 when missing.
    const normalized = mobile.replace(/\D/g, '');
    const recipient = normalized.length === 10 ? `91${normalized}` : normalized;

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch('https://control.msg91.com/api/v5/flow', {
        method: 'POST',
        headers: {
          authkey: env.SMS_MSG91_AUTH_KEY!,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          template_id: env.SMS_MSG91_TEMPLATE_ID!,
          sender: env.SMS_MSG91_SENDER_ID!,
          short_url: '0',
          recipients: [
            {
              mobiles: recipient,
              // The DLT template must use {#var#} as a placeholder for the
              // OTP. MSG91 substitutes OTP into that slot when sending.
              OTP: code,
              otp: code,
              // Some MSG91 account templates use VAR1 instead. Sending
              // both keeps template-variant compatibility.
              VAR1: code,
            },
          ],
        }),
        signal: ac.signal,
      });
    } catch (err) {
      throw new SmsProviderError('msg91', undefined,
        `MSG91 request failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new SmsProviderError('msg91', res.status,
        `MSG91 ${res.status}: ${text.slice(0, 200)}`);
    }

    try {
      const data = JSON.parse(text) as { type?: string; message?: string };
      if (data.type !== 'success' || !data.message) {
        throw new SmsProviderError('msg91', res.status,
          `MSG91 rejected: ${text.slice(0, 200)}`);
      }
      return { providerId: data.message };
    } catch (err) {
      if (err instanceof SmsProviderError) throw err;
      throw new SmsProviderError('msg91', res.status,
        `MSG91 response parse failed: ${(err as Error).message}`);
    }
  }
}
