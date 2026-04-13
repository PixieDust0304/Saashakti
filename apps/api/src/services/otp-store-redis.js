import { getRedis } from '../db/redis.js';

export class RedisOtpStore {
  async set(mobile, data) {
    const redis = await getRedis();
    await redis.set(`otp:${mobile}`, JSON.stringify(data), { EX: 300 });
  }

  async get(mobile) {
    const redis = await getRedis();
    const data = await redis.get(`otp:${mobile}`);
    return data ? JSON.parse(data) : null;
  }

  async clear(mobile) {
    const redis = await getRedis();
    await redis.del(`otp:${mobile}`);
  }
}
