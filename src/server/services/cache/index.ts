import { env } from '../../utils/env';
import type { CacheStore } from './cache.types';
import { MemoryCacheStore } from './memory-cache';
import { RedisCacheStore } from './redis-cache';
import { createRedisClient } from './create-redis-client';
export { createRedisClient } from './create-redis-client';

let cacheStore: CacheStore | null = null;

export function getCacheStore(): CacheStore {
  if (cacheStore) return cacheStore;

  if (env.REDIS_URL) {
    const client = createRedisClient(env.REDIS_URL);
    cacheStore = new RedisCacheStore(client);
    return cacheStore;
  }

  cacheStore = new MemoryCacheStore();
  return cacheStore;
}

export function resetCacheStoreForTests(): void {
  cacheStore = null;
}
