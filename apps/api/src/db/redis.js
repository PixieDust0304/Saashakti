import { createClient } from 'redis';

let redis;

export async function getRedis() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
}
