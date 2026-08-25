import { describe, expect, test } from 'bun:test';
import { MemoryCacheStore } from '../../src/server/services/cache/memory-cache';
import {
  consumeSelfServiceSessionSvc,
  createSelfServiceSessionToken,
  validateSelfServiceSessionSvc,
} from '../../src/server/features/self-service/session.service';

describe('Self-service session tokens', () => {
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
});
