import { describe, expect, test } from 'bun:test';
import { createRedisClient } from '@/server/services/cache';
import { RedisCacheStore } from '@/server/services/cache/redis-cache';

describe.skipIf(!process.env.REDIS_TEST_URL)('Bun Redis cache adapter', () => {
  test('uses the configured Redis server, respects TTL and consumes atomically', async () => {
    const client = createRedisClient(process.env.REDIS_TEST_URL!);
    const cache = new RedisCacheStore(client);
    const key = `test:self-service:${crypto.randomUUID()}`;
    try {
      await cache.set(key, 'payload', { ttlSeconds: 15 });
      const other = createRedisClient(process.env.REDIS_TEST_URL!);
      try {
        expect(await other.get(key)).toBe('payload');
        const results = await Promise.all([cache.take(key), other.getdel(key)]);
        expect(results.filter((value) => value === 'payload')).toHaveLength(1);
      } finally {
        other.close();
      }
      await cache.set(key, 'expired', { ttlSeconds: 1 });
      await Bun.sleep(1100);
      expect(await cache.get(key)).toBeNull();
      expect(await cache.incr(key, 15)).toBe(1);
      expect(await cache.incr(key, 15)).toBe(2);
    } finally {
      await cache.del(key);
      client.close();
    }
  });
});
