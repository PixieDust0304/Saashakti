import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis: Redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[redis] error', err.message);
});

export const keys = {
  otpCooldown: (mobile: string) => `otp:cooldown:${mobile}`,
  otpHourlyMobile: (mobile: string) => `otp:hourly:mobile:${mobile}`,
  otpHourlyIp: (ip: string) => `otp:hourly:ip:${ip}`,
  dashboardSummary: () => `dashboard:summary`,
  dashboardRecent: (limit: number) => `dashboard:recent:${limit}`,
};
