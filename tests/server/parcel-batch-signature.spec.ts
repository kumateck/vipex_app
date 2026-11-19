import { describe, expect, test } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { parcelReceiverOtps, parcels, payments, pickupQueues } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { parcelBatchHandoverRoutes } from '@/server/features/parcel-batch-handover';
import { confirmBatchHandover } from '@/server/features/parcel-batch-handover/confirm';
import {
  requestBatchSignature,
  cancelBatchSignature,
} from '@/server/features/parcel-batch-handover/signature-request';
import {
  captureBatchSignature,
  getBatchSignatureStatus,
  listBatchSignatures,
} from '@/server/features/parcel-batch-handover/signature-capture';
import { errorHandler } from '@/server/middlewares/error-handler';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { createTestAccessToken } from '../utils/auth-session';
import { createBatchSignatureFixture } from '../utils/batch-signature-fixture';

const app = new Elysia()
  .use(errorHandler)
  .group('/payments', (routes) => routes.use(parcelBatchHandoverRoutes));
const signatureImage = encodeHandoverSignature(
  [
    [
      { x: 3, y: 5 },
      { x: 22, y: 30 },
    ],
  ],
  90,
  50,
);
const signature = { source: 'touchscreen' as const, signatureImage };

describe('desktop batch signatures captured on mobile', () => {
  test.each([false, true])(
    'one mobile signature completes the exact selection, cashier=%s',
    async (cashier) => {
      const f = await createBatchSignatureFixture(cashier);
      try {
        const token = await createTestAccessToken({
          userId: f.actor.actorId,
          email: `${f.actor.actorId}@example.test`,
          companyId: f.actor.companyId,
          branchId: f.actor.branchId,
          locationId: f.actor.locationId,
          permissions: [],
        });
        const mobileToken = await createTestAccessToken({
          userId: f.reader.actorId,
          email: `${f.reader.actorId}@example.test`,
          companyId: f.actor.companyId,
          branchId: f.actor.branchId,
          locationId: f.actor.locationId,
          permissions: [],
        });
        const request = (path: string, token: string, body?: unknown, client = 'desktop') =>
          app.handle(
            new Request(`http://localhost/payments${path}`, {
              method: body === undefined ? 'GET' : 'POST',
              headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json',
                'x-vipex-client': client,
              },
              body: body === undefined ? undefined : JSON.stringify(body),
            }),
          );
        const root = `/${f.actor.workflow}-batch-handover`;
        const prepared = await request(`${root}/signature/request`, token, f.input);
        expect(prepared.status).toBe(200);
        const { requestId } = await prepared.json();
        const listed = await request(
          '/batch-handover-signatures',
          mobileToken,
          undefined,
          'mobile',
        );
        expect(listed.status).toBe(200);
        expect(listed.headers.get('cache-control')).toBe('no-store');
        const page = await listed.json();
        expect(page.rows).toHaveLength(1);
        expect(page.rows[0].parcels.map((row: { id: string }) => row.id).sort()).toEqual(
          f.input.items.map(({ id }) => id).sort(),
        );
        expect(JSON.stringify(page)).not.toContain('verificationToken');
        expect(JSON.stringify(page)).not.toContain('otpHash');
        const capturePath = `/batch-handover-signatures/${f.input.id}/signature`;
        expect(
          (await request(capturePath, mobileToken, { requestId, signature }, 'desktop')).status,
        ).toBe(403);
        expect(
          (
            await request(
              `/batch-handover-signatures/${f.input.id}/signature`,
              mobileToken,
              { requestId, signature },
              'mobile',
            )
          ).status,
        ).toBe(200);
        const signedPage = await listBatchSignatures(f.reader, {});
        expect(signedPage.rows[0]?.signedAt).toBeTruthy();
        expect(JSON.stringify(signedPage)).not.toContain(signatureImage);
        const restored = await request(`${root}/${f.input.id}/signature`, token);
        expect(await restored.json()).toMatchObject({ requestId, signature });
        const input = { ...f.input, ...(cashier ? { paymentMethod: 'cash' as const } : {}) };
        const completed = await request(`${root}/confirm`, token, input);
        expect(completed.status).toBe(200);
        expect(await completed.json()).toMatchObject({ alreadyConfirmed: false });
        expect((await confirmBatchHandover(f.actor, input)).alreadyConfirmed).toBe(true);
        const rows = await db
          .select()
          .from(parcels)
          .where(
            inArray(
              parcels.id,
              f.rows.map(({ id }) => id),
            ),
          );
        for (const row of rows.filter(({ id }) => f.input.items.some((item) => item.id === id))) {
          expect(row.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
          expect(row.deliveryConfirmationSnapshot).toMatchObject({
            batchHandoverId: f.input.id,
            [cashier ? 'receiverCashierSignature' : 'officePickupSignature']: {
              signatureImage,
              capturedBy: f.reader.actorId,
            },
          });
        }
        expect(rows.find(({ id }) => id === f.rows[2]!.id)?.status).toBe(
          ParcelStatus.AWAITING_PICKUP,
        );
        expect((await listBatchSignatures(f.reader, {})).rows).toHaveLength(0);
      } finally {
        await f.cleanup();
      }
    },
  );

  test('rejects wrong scope and stale selection, retains the first capture, and expires the request', async () => {
    const f = await createBatchSignatureFixture(false);
    try {
      await expect(
        requestBatchSignature(f.actor, { ...f.input, verificationToken: 'invalid' }),
      ).rejects.toMatchObject({ status: 403 });
      const { requestId } = await requestBatchSignature(f.actor, f.input);
      expect(await requestBatchSignature(f.actor, f.input)).toEqual({ requestId });
      const capture = { id: f.input.id, requestId, signature };
      expect(
        (await listBatchSignatures({ ...f.reader, companyId: 'other' }, {})).rows,
      ).toHaveLength(0);
      expect((await listBatchSignatures({ ...f.reader, branchId: 'other' }, {})).rows).toHaveLength(
        0,
      );
      expect(
        (await listBatchSignatures({ ...f.reader, workflows: ['receiver-cashier'] }, {})).rows,
      ).toHaveLength(0);
      expect(
        (await listBatchSignatures(f.reader, { search: f.rows[1]!.trackingCode })).rows,
      ).toHaveLength(1);
      await expect(
        captureBatchSignature({ ...f.reader, branchId: 'other' }, capture),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        getBatchSignatureStatus({ ...f.actor, actorId: f.reader.actorId }, f.input.id),
      ).rejects.toMatchObject({ status: 404 });
      await cancelBatchSignature(f.actor, f.input.id, requestId);
      const next = await requestBatchSignature(f.actor, f.input);
      expect(next.requestId).not.toBe(requestId);
      await expect(captureBatchSignature(f.reader, capture)).rejects.toMatchObject({ status: 409 });
      const saved = await captureBatchSignature(f.reader, {
        ...capture,
        requestId: next.requestId,
      });
      expect(
        await captureBatchSignature(
          { ...f.reader, actorId: f.fixture.newPicker },
          { ...capture, requestId: next.requestId },
        ),
      ).toEqual(saved);
      const [row] = await db
        .select()
        .from(parcelReceiverOtps)
        .where(eq(parcelReceiverOtps.id, f.input.id));
      expect(row?.batchSignatureRequest?.capture?.capturedBy).toBe(f.reader.actorId);
      await db
        .update(parcelReceiverOtps)
        .set({ verificationTokenExpiresAt: new Date(Date.now() - 1) })
        .where(eq(parcelReceiverOtps.id, f.input.id));
      expect((await listBatchSignatures(f.reader, {})).rows).toHaveLength(0);
      await expect(
        captureBatchSignature(f.reader, { ...capture, requestId: next.requestId }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(confirmBatchHandover(f.actor, f.input)).rejects.toMatchObject({ status: 409 });
    } finally {
      await f.cleanup();
    }
  });

  test('changing any member after mobile signing rolls back every cashier payment and delivery', async () => {
    const f = await createBatchSignatureFixture(true);
    try {
      const { requestId } = await requestBatchSignature(f.actor, f.input);
      await captureBatchSignature(f.reader, { id: f.input.id, requestId, signature });
      await db
        .update(pickupQueues)
        .set({ endedAt: new Date() })
        .where(eq(pickupQueues.id, f.tickets[1]!.id));
      await expect(
        confirmBatchHandover(f.actor, { ...f.input, paymentMethod: 'cash' }),
      ).rejects.toThrow('Issue a pickup ticket');
      expect(
        await db.select().from(payments).where(eq(payments.companyId, f.actor.companyId)),
      ).toHaveLength(0);
      const rows = await db
        .select()
        .from(parcels)
        .where(
          inArray(
            parcels.id,
            f.input.items.map(({ id }) => id),
          ),
        );
      expect(rows.every(({ status }) => status === ParcelStatus.AWAITING_PICKUP)).toBe(true);
    } finally {
      await f.cleanup();
    }
  });
});
