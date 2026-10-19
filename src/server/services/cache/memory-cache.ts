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

  async take(key: string): Promise<string | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    this.map.delete(key);
    return this.isExpired(entry) ? null : entry.value;
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
    const entry = this.map.get(key);
    const activeEntry = entry && !this.isExpired(entry) ? entry : null;
    const next = (activeEntry ? Number.parseInt(activeEntry.value, 10) : 0) + 1;
    this.map.set(key, {
      value: String(next),
      // A rate-limit window starts with the first increment. Later requests must
      // not extend it, including requests that have already exceeded the limit.
      expiresAtMs: activeEntry ? activeEntry.expiresAtMs : this.toExpiresAtMs(ttlSeconds),
    });
    return next;
  }
}
