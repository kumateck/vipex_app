import { describe, expect, spyOn, test } from 'bun:test';
import { MemoryCacheStore } from '../../src/server/services/cache/memory-cache';

describe('Memory cache store', () => {
  test('set/get/del lifecycle', async () => {
    const cache = new MemoryCacheStore();
    await cache.set('k1', 'v1');
    expect(await cache.get('k1')).toBe('v1');
    await cache.del('k1');
    expect(await cache.get('k1')).toBeNull();
  });

  test('incr with ttl keeps a monotonic counter during window', async () => {
    const cache = new MemoryCacheStore();
    expect(await cache.incr('counter', 5)).toBe(1);
    expect(await cache.incr('counter', 5)).toBe(2);
    expect(await cache.incr('counter', 5)).toBe(3);
  });

  test('incr does not extend the original expiry after repeated requests', async () => {
    const clock = spyOn(Date, 'now');
    const cache = new MemoryCacheStore();
    try {
      clock.mockReturnValue(1_000);
      expect(await cache.incr('counter', 60)).toBe(1);
      clock.mockReturnValue(59_000);
      expect(await cache.incr('counter', 60)).toBe(2);
      clock.mockReturnValue(61_000);
      expect(await cache.incr('counter', 60)).toBe(1);
    } finally {
      clock.mockRestore();
    }
  });

  test('take returns and atomically removes a value', async () => {
    const cache = new MemoryCacheStore();
    await cache.set('single-use', 'payload');

    expect(await cache.take('single-use')).toBe('payload');
    expect(await cache.take('single-use')).toBeNull();
  });
});
