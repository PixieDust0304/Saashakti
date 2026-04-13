import { createHash, randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { sql } from '../db/client.js';
import { redis, keys } from '../redis/client.js';
import { HttpError } from '../plugins/error-handler.js';
import { smsProvider } from './provider.js';

const HOUR_SECONDS = 3600;

const hashOtp = (code: string): string =>
  createHash('sha256').update(`${code}|${env.SESSION_TTL_SECONDS}`).digest('hex');

const generateCode = (): string => {
  const n = randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
};

const normalizeMobile = (mobile: string): string => {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new HttpError(400, 'invalid_mobile', 'Mobile number must be 10-15 digits');
  }
  return digits;
};

interface RequestArgs {
  mobileNumber: string;
  ip: string;
}

export const requestOtp = async ({ mobileNumber, ip }: RequestArgs) => {
  const mobile = normalizeMobile(mobileNumber);

  const cooldownKey = keys.otpCooldown(mobile);
  const existingCooldown = await redis.ttl(cooldownKey);
  if (existingCooldown > 0) {
    throw new HttpError(429, 'otp_cooldown', `Please wait ${existingCooldown}s before requesting another OTP`, {
      retryAfterSeconds: existingCooldown,
    });
  }

  const mobileHourKey = keys.otpHourlyMobile(mobile);
  const mobileCount = await redis.incr(mobileHourKey);
  if (mobileCount === 1) await redis.expire(mobileHourKey, HOUR_SECONDS);
  if (mobileCount > env.OTP_HOURLY_LIMIT_PER_MOBILE) {
    throw new HttpError(429, 'otp_mobile_limit', 'Hourly OTP limit reached for this mobile');
  }

  const ipHourKey = keys.otpHourlyIp(ip);
  const ipCount = await redis.incr(ipHourKey);
  if (ipCount === 1) await redis.expire(ipHourKey, HOUR_SECONDS);
  if (ipCount > env.OTP_HOURLY_LIMIT_PER_IP) {
    throw new HttpError(429, 'otp_ip_limit', 'Hourly OTP limit reached for this IP');
  }

  const code = generateCode();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

  await sql`
    INSERT INTO otp_requests (mobile_number, otp_hash, status, attempts, expires_at)
    VALUES (${mobile}, ${otpHash}, 'pending', 0, ${expiresAt})
  `;

  await smsProvider.send(mobile, code);
  await redis.set(cooldownKey, '1', 'EX', env.OTP_COOLDOWN_SECONDS);

  return {
    mobileNumber: mobile,
    expiresInSeconds: env.OTP_TTL_SECONDS,
    cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
    mockCode: env.OTP_MODE === 'mock' ? code : undefined,
  };
};

interface VerifyArgs {
  mobileNumber: string;
  code: string;
}

export const verifyOtp = async ({ mobileNumber, code }: VerifyArgs): Promise<{ mobileNumber: string }> => {
  const mobile = normalizeMobile(mobileNumber);
  const otpHash = hashOtp(code);

  const [row] = await sql<
    { id: number; otp_hash: string; attempts: number; expires_at: Date; status: string }[]
  >`
    SELECT id, otp_hash, attempts, expires_at, status
    FROM otp_requests
    WHERE mobile_number = ${mobile} AND status = 'pending'
    ORDER BY requested_at DESC
    LIMIT 1
  `;

  if (!row) {
    throw new HttpError(400, 'otp_not_found', 'No active OTP request for this mobile');
  }

  if (row.expires_at.getTime() < Date.now()) {
    await sql`UPDATE otp_requests SET status = 'expired' WHERE id = ${row.id}`;
    throw new HttpError(400, 'otp_expired', 'OTP expired — request a new one');
  }

  if (row.attempts >= env.OTP_MAX_ATTEMPTS) {
    await sql`UPDATE otp_requests SET status = 'locked' WHERE id = ${row.id}`;
    throw new HttpError(429, 'otp_locked', 'Too many verification attempts — request a new OTP');
  }

  if (row.otp_hash !== otpHash) {
    await sql`UPDATE otp_requests SET attempts = attempts + 1 WHERE id = ${row.id}`;
    throw new HttpError(400, 'otp_mismatch', 'Incorrect OTP code');
  }

  await sql`
    UPDATE otp_requests
    SET status = 'verified', verified_at = NOW(), attempts = attempts + 1
    WHERE id = ${row.id}
  `;

  return { mobileNumber: mobile };
};
