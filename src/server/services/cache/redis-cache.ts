import type { CacheSetOptions, CacheStore } from './cache.types';

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    modeOrOptions?: 'EX' | { ex: number },
    seconds?: number,
  ): Promise<unknown>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
};

export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisLike) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, options?: CacheSetOptions): Promise<void> {
    const ttl = options?.ttlSeconds;
    if (ttl && ttl > 0) {
      await this.redis.set(key, value, 'EX', ttl);
      return;
    }
    await this.redis.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const next = await this.redis.incr(key);
    if (ttlSeconds && ttlSeconds > 0 && next === 1) {
      await this.redis.expire(key, ttlSeconds);
    }
    return next;
  }
}
