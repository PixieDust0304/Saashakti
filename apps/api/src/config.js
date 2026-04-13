export const otpConfig = {
  otpLength: 6,
  otpTtlMs: 5 * 60 * 1000,
  cooldownMs: 30 * 1000,
  maxRequestsPerWindow: 5,
  requestWindowMs: 10 * 60 * 1000,
  maxVerifyAttempts: 5,
  sessionTtlMs: 24 * 60 * 60 * 1000,
};
