import test from 'node:test';
import assert from 'node:assert/strict';
import { OtpService } from '../src/services/otp-service.js';
import { InMemoryOtpStore } from '../src/services/otp-store.js';
import { MockSmsProvider } from '../src/services/sms-provider.js';
import { createAuthHandlers } from '../src/routes/auth.js';

const createFixedClock = (start = 1_700_000_000_000) => {
  let now = start;
  return {
    now: () => now,
    tick: (ms) => {
      now += ms;
    },
  };
};

const setup = () => {
  const clock = createFixedClock();
  const smsProvider = new MockSmsProvider();
  const otpService = new OtpService(new InMemoryOtpStore(), smsProvider, clock.now);
  const handlers = createAuthHandlers({ otpService, createRequestId: () => 'req-test' });
  return { clock, smsProvider, handlers };
};

test('request + verify OTP success', async () => {
  const { handlers, smsProvider } = setup();

  const requestResult = await handlers.requestOtp({ mobileNumber: '9876543210' });
  assert.equal(requestResult.statusCode, 200);
  const otp = smsProvider.getLastOtp('9876543210');
  assert.ok(otp);

  const verifyResult = await handlers.verifyOtp({ mobileNumber: '9876543210', otp });
  assert.equal(verifyResult.statusCode, 200);
  assert.ok(verifyResult.body.data.session.token.length > 10);
});

test('request OTP cooldown enforced', async () => {
  const { handlers } = setup();
  const first = await handlers.requestOtp({ mobileNumber: '9876543210' });
  assert.equal(first.statusCode, 200);

  const second = await handlers.requestOtp({ mobileNumber: '9876543210' });
  assert.equal(second.statusCode, 429);
  assert.equal(second.body.error.code, 'otp_cooldown_active');
});

test('verify fails for invalid OTP', async () => {
  const { handlers } = setup();
  await handlers.requestOtp({ mobileNumber: '9876543210' });

  const result = await handlers.verifyOtp({ mobileNumber: '9876543210', otp: '000000' });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.error.code, 'otp_invalid');
});

test('verify fails when OTP expired', async () => {
  const { handlers, smsProvider, clock } = setup();
  await handlers.requestOtp({ mobileNumber: '9876543210' });
  const otp = smsProvider.getLastOtp('9876543210');

  clock.tick(6 * 60 * 1000);
  const result = await handlers.verifyOtp({ mobileNumber: '9876543210', otp });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.error.code, 'otp_expired');
});
