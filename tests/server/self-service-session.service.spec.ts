import { describe, expect, spyOn, test } from 'bun:test';
import { MemoryCacheStore } from '../../src/server/services/cache/memory-cache';
import {
  consumeSelfServiceSessionSvc,
  continueSelfServiceSessionSvc,
  createSelfServiceSessionToken,
  validateSelfServiceSessionSvc,
} from '../../src/server/features/self-service/session.service';

describe('Self-service session tokens', () => {
  test('expires at 15 minutes according to the server clock', async () => {
    const cache = new MemoryCacheStore();
    const clock = spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });
      clock.mockReturnValue(1_899_999);
      await expect(
        validateSelfServiceSessionSvc({
          branchId: 'branch-a',
          sessionToken: session.sessionToken,
          cache,
        }),
      ).resolves.toMatchObject({ branchId: 'branch-a' });
      clock.mockReturnValue(1_900_000);
      await expect(
        validateSelfServiceSessionSvc({
          branchId: 'branch-a',
          sessionToken: session.sessionToken,
          cache,
        }),
      ).rejects.toMatchObject({ status: 410 });
    } finally {
      clock.mockRestore();
    }
  });
  test('creates a branch-bound session that can be validated', async () => {
    const cache = new MemoryCacheStore();
    const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });

    expect(session.sessionToken.length).toBeGreaterThan(32);
    expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
    expect(
      await validateSelfServiceSessionSvc({
        branchId: 'branch-a',
        sessionToken: session.sessionToken,
        cache,
      }),
    ).toMatchObject({ branchId: 'branch-a' });
  });

  test('consumes a session exactly once', async () => {
    const cache = new MemoryCacheStore();
    const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });

    await consumeSelfServiceSessionSvc({
      branchId: 'branch-a',
      sessionToken: session.sessionToken,
      cache,
    });

    await expect(
      consumeSelfServiceSessionSvc({
        branchId: 'branch-a',
        sessionToken: session.sessionToken,
        cache,
      }),
    ).rejects.toMatchObject({ status: 410 });
  });

  test('does not consume a session presented for another branch', async () => {
    const cache = new MemoryCacheStore();
    const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });

    await expect(
      consumeSelfServiceSessionSvc({
        branchId: 'branch-b',
        sessionToken: session.sessionToken,
        cache,
      }),
    ).rejects.toMatchObject({ status: 410 });

    await expect(
      validateSelfServiceSessionSvc({
        branchId: 'branch-a',
        sessionToken: session.sessionToken,
        cache,
      }),
    ).resolves.toMatchObject({ branchId: 'branch-a' });
  });
  test('allows ten single-use bookings with the original deadline and no eleventh token', async () => {
    const cache = new MemoryCacheStore();
    const first = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });
    let session: typeof first | null = first;
    for (let booking = 1; booking <= 10; booking++) {
      expect(session?.bookingNumber).toBe(booking);
      expect(session?.expiresAt).toBe(first.expiresAt);
      const consumed = await consumeSelfServiceSessionSvc({
        branchId: 'branch-a',
        sessionToken: session!.sessionToken,
        cache,
      });
      await expect(
        consumeSelfServiceSessionSvc({
          branchId: 'branch-a',
          sessionToken: session!.sessionToken,
          cache,
        }),
      ).rejects.toMatchObject({ status: 410 });
      session = await continueSelfServiceSessionSvc(consumed, cache);
    }
    expect(session).toBeNull();
    const rescanned = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });
    expect(rescanned.bookingNumber).toBe(1);
  });
  test('does not extend an expired scan with a continuation', async () => {
    const cache = new MemoryCacheStore();
    const session = await createSelfServiceSessionToken({ branchId: 'branch-a', cache });
    const consumed = await consumeSelfServiceSessionSvc({
      branchId: 'branch-a',
      sessionToken: session.sessionToken,
      cache,
    });
    const clock = spyOn(Date, 'now').mockReturnValue(Date.parse(session.expiresAt));
    try {
      expect(await continueSelfServiceSessionSvc(consumed, cache)).toBeNull();
    } finally {
      clock.mockRestore();
    }
  });
});
