import type { RedisClient } from 'bun';

// Bun.redis is the default client object; custom URLs require the constructor.
// Expose only commands the cache needs, preserving their receiver binding.
export function createRedisClient(url: string) {
  if (typeof Bun === 'undefined' || typeof Bun.RedisClient !== 'function') {
    throw new Error('REDIS_URL requires a Bun runtime with RedisClient support');
  }
  const client: RedisClient = new Bun.RedisClient(url);
  return {
    get: (key: string) => client.get(key),
    getdel: (key: string) => client.getdel(key),
    set: (key: string, value: string, mode?: 'EX', seconds?: number) =>
      mode === 'EX' && seconds !== undefined
        ? client.set(key, value, 'EX', seconds)
        : client.set(key, value),
    del: (key: string) => client.del(key),
    incr: (key: string) => client.incr(key),
    expire: (key: string, seconds: number) => client.expire(key, seconds),
    close: () => client.close(),
  };
}
