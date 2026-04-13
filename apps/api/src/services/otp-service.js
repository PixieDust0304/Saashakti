import crypto from 'node:crypto';
import { otpConfig } from '../config.js';
import { ApiError } from '../utils/errors.js';

const normalizePhone = (mobileNumber) => {
  const digits = String(mobileNumber || '').replace(/\D/g, '');
  if (digits.length !== 10) throw new ApiError(400, 'invalid_mobile_number', 'Enter a valid 10-digit mobile number.');
  return digits;
};

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const randomOtp = () =>
  Array.from({ length: otpConfig.otpLength }, () => Math.floor(Math.random() * 10)).join('');

const generateSessionToken = () => crypto.randomBytes(24).toString('hex');

export class OtpService {
  constructor(store, smsProvider, now = () => Date.now()) {
    this.store = store;
    this.smsProvider = smsProvider;
    this.now = now;
  }

  async requestOtp(input) {
    const mobileNumber = normalizePhone(input.mobileNumber);
    const currentTime = this.now();
    const existing = await this.store.get(mobileNumber);

    if (existing && existing.nextRequestAllowedAt > currentTime) {
      const retryAfterSec = Math.ceil((existing.nextRequestAllowedAt - currentTime) / 1000);
      throw new ApiError(429, 'otp_cooldown_active', `Please wait ${retryAfterSec} seconds before requesting another OTP.`);
    }

    const recentRequests = existing && currentTime - existing.windowStartedAt <= otpConfig.requestWindowMs
      ? existing.requestCount
      : 0;

    if (recentRequests >= otpConfig.maxRequestsPerWindow) {
      throw new ApiError(429, 'otp_rate_limited', 'Too many OTP requests. Please try again later.');
    }

    const otp = randomOtp();
    await this.smsProvider.sendOtp(mobileNumber, otp);

    await this.store.set(mobileNumber, {
      otpHash: hashOtp(otp),
      expiresAt: currentTime + otpConfig.otpTtlMs,
      nextRequestAllowedAt: currentTime + otpConfig.cooldownMs,
      requestCount: recentRequests + 1,
      windowStartedAt: recentRequests > 0 ? existing.windowStartedAt : currentTime,
      verifyAttempts: 0,
    });

    return {
      mobileNumber,
      expiresInSec: Math.floor(otpConfig.otpTtlMs / 1000),
      cooldownSec: Math.floor(otpConfig.cooldownMs / 1000),
    };
  }

  async verifyOtp(input) {
    const mobileNumber = normalizePhone(input.mobileNumber);
    const otp = String(input.otp || '').trim();
    const currentTime = this.now();
    const record = await this.store.get(mobileNumber);

    if (!record) throw new ApiError(400, 'otp_not_requested', 'Request OTP first.');
    if (record.expiresAt < currentTime) throw new ApiError(400, 'otp_expired', 'OTP has expired. Please request a new one.');

    const nextAttempts = record.verifyAttempts + 1;
    if (nextAttempts > otpConfig.maxVerifyAttempts) {
      throw new ApiError(429, 'otp_attempts_exceeded', 'Maximum verification attempts exceeded.');
    }

    if (hashOtp(otp) !== record.otpHash) {
      await this.store.set(mobileNumber, {
        ...record,
        verifyAttempts: nextAttempts,
      });
      throw new ApiError(400, 'otp_invalid', 'Invalid OTP entered.');
    }

    await this.store.clear(mobileNumber);
    return {
      mobileNumber,
      session: {
        token: generateSessionToken(),
        expiresInSec: Math.floor(otpConfig.sessionTtlMs / 1000),
      },
    };
  }
}
