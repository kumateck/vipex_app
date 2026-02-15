import type { CacheSetOptions, CacheStore } from './cache.types';

type CacheEntry = {
  value: string;
  expiresAtMs: number | null;
};

export class MemoryCacheStore implements CacheStore {
  private readonly map = new Map<string, CacheEntry>();

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAtMs !== null && entry.expiresAtMs <= Date.now();
  }

  private toExpiresAtMs(ttlSeconds: number | undefined): number | null {
    if (!ttlSeconds || ttlSeconds <= 0) return null;
    return Date.now() + ttlSeconds * 1000;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, options?: CacheSetOptions): Promise<void> {
    this.map.set(key, {
      value,
      expiresAtMs: this.toExpiresAtMs(options?.ttlSeconds),
    });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const current = await this.get(key);
    const next = (current ? Number.parseInt(current, 10) : 0) + 1;
    await this.set(key, String(next), { ttlSeconds });
    return next;
  }
}
