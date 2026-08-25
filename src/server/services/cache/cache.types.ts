export type CacheValue = string;

export type CacheSetOptions = {
  ttlSeconds?: number;
};

export interface CacheStore {
  get(key: string): Promise<CacheValue | null>;
  take(key: string): Promise<CacheValue | null>;
  set(key: string, value: CacheValue, options?: CacheSetOptions): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
}
