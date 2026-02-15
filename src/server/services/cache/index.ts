import { env } from '../../utils/env';
import type { CacheStore } from './cache.types';
import { MemoryCacheStore } from './memory-cache';
import { RedisCacheStore } from './redis-cache';

let cacheStore: CacheStore | null = null;

function createRedisClient(url: string): {
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
} | null {
  if (typeof Bun === 'undefined' || typeof Bun.Redis !== 'function') return null;
  return new Bun.Redis(url);
}

export function getCacheStore(): CacheStore {
  if (cacheStore) return cacheStore;

  if (env.REDIS_URL) {
    const client = createRedisClient(env.REDIS_URL);
    if (client) {
      cacheStore = new RedisCacheStore(client);
      return cacheStore;
    }
  }

  cacheStore = new MemoryCacheStore();
  return cacheStore;
}

export function resetCacheStoreForTests(): void {
  cacheStore = null;
}
