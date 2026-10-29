import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { db } from '@/db/config';
import { branches, locations, selfServiceBookingDrafts } from '@/db/schemas';
import {
  createSelfServiceSessionToken,
  validateSelfServiceSessionSvc,
} from '@/server/features/self-service/session.service';
import { DatabaseSelfServiceSessionStore } from '@/server/features/self-service/session-store';
import { persistPublicDraft } from '@/server/features/self-service/persist-public-draft';
import { createId } from '@paralleldrive/cuid2';
import { submitSelfServiceDraftSvc } from '@/server/features/self-service/public-draft.service';
import { env } from '@/server/utils/env';
import { resetCacheStoreForTests, getCacheStore } from '@/server/services/cache';
import { SELF_SERVICE_TERMS_VERSION } from '@/shared/self-service/terms';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

describe('self-service persisted continuation', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  const tokens: string[] = [];
  const destinationId = createId();
  const destinationLocationId = createId();
  const redisUrl = env.REDIS_URL;
  beforeAll(async () => {
    env.REDIS_URL = undefined;
    resetCacheStoreForTests();
    fixture = await createShelfPickupFixture();
    await db.insert(branches).values({
      id: destinationId,
      companyId: fixture.companyId,
      name: 'Test destination',
      createdBy: fixture.actor,
    });
    await db.insert(locations).values({
      id: destinationLocationId,
      companyId: fixture.companyId,
      branchId: destinationId,
      name: 'Destination receiving desk',
      createdBy: fixture.actor,
    });
  });
  afterAll(async () => {
    const store = new DatabaseSelfServiceSessionStore();
    for (const token of tokens) {
      await store.del(`self-service:session:${createHash('sha256').update(token).digest('hex')}`);
      await store.del(
        `self-service:submission:${createHash('sha256').update(token).digest('hex')}`,
      );
    }
    env.REDIS_URL = redisUrl;
    resetCacheStoreForTests();
    if (fixture) {
      await db
        .delete(selfServiceBookingDrafts)
        .where(eq(selfServiceBookingDrafts.companyId, fixture.companyId));
      await fixture.cleanup();
    }
  });
  const start = async () => {
    const session = await createSelfServiceSessionToken({ branchId: fixture.branchId });
    tokens.push(session.sessionToken);
    return session;
  };
  const submit = (sessionToken: string, companyId = fixture.companyId) =>
    persistPublicDraft({
      sessionToken,
      fingerprint: 'test-request',
      branchName: 'Test branch',
      values: {
        companyId,
        branchId: fixture.branchId,
        senderFullname: 'Sender',
        senderPhone: '0551112222',
        receiverFullname: 'Receiver',
        receiverPhone: '0553334444',
        parcelContent: 'Documents',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  const publicSubmit = (sessionToken: string) =>
    submitSelfServiceDraftSvc({
      sessionToken,
      branchId: fixture.branchId,
      sender: { fullname: 'Sender', phone: '0551112222' },
      receiver: { fullname: 'Receiver', phone: '0553334444' },
      destinationBranchId: destinationId,
      parcelContent: 'Documents',
      parcelValueCedis: 0,
      termsAccepted: true,
      termsVersion: SELF_SERVICE_TERMS_VERSION,
    });
  test('accepts ten public drafts from one phone and replays successful retries', async () => {
    let session: Awaited<ReturnType<typeof start>> | null = await start();
    for (let count = 1; count <= 10; count++) {
      const current = session!;
      const result = await publicSubmit(current.sessionToken);
      expect(result.bookingsCompleted).toBe(count);
      expect(await publicSubmit(current.sessionToken)).toEqual(result);
      session = result.nextSession;
      if (session) tokens.push(session.sessionToken);
    }
    expect(session).toBeNull();
    const rows = await db
      .select()
      .from(selfServiceBookingDrafts)
      .where(eq(selfServiceBookingDrafts.companyId, fixture.companyId));
    expect(rows).toHaveLength(10);
    expect(rows.every((row) => row.destinationLocationId === destinationLocationId)).toBe(true);
    expect(await getCacheStore().get('rl:self-service-draft:phone:0551112222')).toBe('10');
    const firstToken = tokens[0]!;
    const original = await publicSubmit(firstToken);
    await expect(
      persistPublicDraft({
        sessionToken: firstToken,
        fingerprint: 'changed-request',
        branchName: 'Test branch',
        values: {
          companyId: fixture.companyId,
          branchId: fixture.branchId,
          senderFullname: 'Changed',
          senderPhone: '0551112222',
          receiverFullname: 'Receiver',
          receiverPhone: '0553334444',
          parcelContent: 'Other contents',
          expiresAt: new Date(),
        },
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await publicSubmit(firstToken)).draftId).toBe(original.draftId);
  });
  test('concurrent submissions return the same draft and continuation', async () => {
    const session = await start();
    const results = await Promise.allSettled([
      publicSubmit(session.sessionToken),
      publicSubmit(session.sessionToken),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    expect(await getCacheStore().get('rl:self-service-draft:phone:0551112222')).toBe('11');
    if (results[0]?.status === 'fulfilled' && results[1]?.status === 'fulfilled')
      expect(results[0].value).toEqual(results[1].value);
    for (const result of results)
      if (result.status === 'fulfilled' && result.value.nextSession)
        tokens.push(result.value.nextSession.sessionToken);
  });
  test('rolls back consumption if saving the draft fails', async () => {
    const session = await start();
    await expect(submit(session.sessionToken, 'missing-company')).rejects.toThrow();
    await expect(
      validateSelfServiceSessionSvc({
        branchId: fixture.branchId,
        sessionToken: session.sessionToken,
      }),
    ).resolves.toMatchObject({ bookingNumber: 1 });
    const saved = await submit(session.sessionToken);
    expect(saved.bookingsCompleted).toBe(1);
    if (saved.nextSession) tokens.push(saved.nextSession.sessionToken);
  });
});
