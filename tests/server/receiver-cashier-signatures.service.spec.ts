import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { errorHandler } from '@/server/middlewares/error-handler';
import { paymentsRoutes } from '@/server/features/payments/routes';
import { getReceiverReceiptReprintSvc } from '@/server/features/receipt-reprint/receiver-receipt-reprint.service';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { db } from '@/db/config';
import {
  auditLogs,
  branches,
  cashierSessions,
  parcels,
  payments,
  pickupQueues,
  rolePermissions,
} from '@/db/schemas';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { collectReceiverPaymentAndDeliverSvc } from '@/server/features/payments/service';
import {
  captureReceiverHandoverSignature,
  confirmSignedReceiverHandover,
  getReceiverHandoverPreview,
  listReceiverHandovers,
} from '@/server/features/payments/services/receiver-handover.service';
import { waitForReceiverHandoverChange } from '@/server/features/payments/services/receiver-handover-changes';
import type { ReceiverHandoverPage } from '@/shared/shipments/receiver-cashier-signature';
import { encodeHandoverSignature } from '@/shared/shipments/handover-signature';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const app = new Elysia().use(errorHandler).group('/payments', (route) => route.use(paymentsRoutes));

const signatureImage = encodeHandoverSignature(
  [
    [
      { x: 15, y: 17 },
      { x: 75, y: 29 },
    ],
  ],
  200,
  80,
);

describe('Receiver Cashier signature handover', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db.insert(rolePermissions).values({
      roleId: fixture.roleId,
      companyId: fixture.companyId,
      permission: PermissionKeys.CanCreateReceiverPayments,
    });
    await db
      .update(branches)
      .set({
        requireReceiverOtp: false,
        usePickupQueue: true,
        requireReceiverCashierSignature: true,
      })
      .where(eq(branches.id, fixture.branchId));
    await db.insert(cashierSessions).values({
      cashierId: fixture.actor,
      branchId: fixture.branchId,
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 86_400_000),
      status: 'ACTIVE',
    });
  });

  afterAll(async () => {
    if (!fixture) return;
    await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
    await db.delete(cashierSessions).where(eq(cashierSessions.cashierId, fixture.actor));
    await fixture.cleanup();
  });

  async function setup() {
    const parcel = await fixture.parcel();
    await db.update(parcels).set({ receivedAt: new Date() }).where(eq(parcels.id, parcel.id));
    const ticket = await fixture.ticket(parcel.id);
    const scope = { companyId: fixture.companyId, branchId: fixture.branchId };
    const payment = {
      ...scope,
      parcelId: parcel.id,
      cashierUserId: fixture.actor,
      amountCedis: 10,
      method: PaymentMethod.CASH,
      confirmedBy: fixture.oldPicker,
      handoverTarget: 'main' as const,
      expectedReceiverId: parcel.receiverId,
      requestSignature: true,
    };
    return { parcel, ticket, scope, payment };
  }

  test('wakes the mobile list and open desktop dialog without confirming delivery', async () => {
    const { parcel, ticket, scope, payment } = await setup();
    await expect(
      collectReceiverPaymentAndDeliverSvc({ ...payment, requestSignature: false }),
    ).rejects.toThrow('Branch signature settings changed');
    const initial = await waitForReceiverHandoverChange(scope);
    const mobileUpdate = waitForReceiverHandoverChange(scope, initial.revision);
    const processed = await collectReceiverPaymentAndDeliverSvc(payment);
    expect(processed).toMatchObject({
      awaitingSignature: true,
      status: ParcelStatus.AWAITING_PICKUP,
    });
    const pendingRevision = await mobileUpdate;
    expect(pendingRevision.revision).not.toBe(initial.revision);
    const list = await listReceiverHandovers({ ...scope, search: parcel.trackingCode });
    const [pending] = list.rows;
    expect(pending).toMatchObject({
      id: parcel.id,
      signedAt: null,
      collectorName: 'Shelf customer',
      associateName: fixture.oldPicker,
    });
    expect((await listReceiverHandovers({ ...scope, branchId: fixture.companyId })).rows).toEqual(
      [],
    );
    const action = {
      ...scope,
      parcelId: parcel.id,
      handoverId: pending!.handoverId,
      actorId: fixture.actor,
    };
    expect(processed.handoverId).toBe(action.handoverId);
    await expect(collectReceiverPaymentAndDeliverSvc(payment)).rejects.toThrow('already processed');
    await expect(confirmSignedReceiverHandover(action)).rejects.toThrow('must sign');
    await expect(
      captureReceiverHandoverSignature({
        ...action,
        signature: { source: 'touchscreen', signatureImage: '' },
      }),
    ).rejects.toThrow('usable signature');

    const token = await createTestAccessToken({
      userId: fixture.actor,
      email: `${fixture.actor}@example.test`,
      permissions: [],
    });
    const confirmRequest = (client: 'desktop' | 'mobile') =>
      new Request(`http://localhost/payments/receiver-handovers/${parcel.id}/confirm`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'x-vipex-client': client,
        },
        body: JSON.stringify({ handoverId: action.handoverId }),
      });
    expect((await app.handle(confirmRequest('mobile'))).status).toBe(403);
    expect((await app.handle(confirmRequest('desktop'))).status).toBe(409);
    const watchDialog = async (since?: string, handoverId = action.handoverId) => {
      const query = new URLSearchParams({ parcelId: parcel.id, handoverId });
      if (since) query.set('since', since);
      const res = await app.handle(
        new Request(`http://localhost/payments/receiver-handovers?${query}`, {
          headers: { authorization: `Bearer ${token}`, 'x-vipex-client': 'desktop' },
        }),
      );
      expect(res.status).toBe(200);
      return res.json() as Promise<ReceiverHandoverPage>;
    };
    const dialog = await watchDialog();
    expect(dialog.rows).toEqual([pending!]);
    expect((await watchDialog(undefined, fixture.oldPicker)).rows).toEqual([]);
    const desktopUpdate = watchDialog(dialog.revision);
    const signed = await captureReceiverHandoverSignature({
      ...action,
      actorId: fixture.newPicker,
      signature: { source: 'touchscreen', signatureImage },
    });
    const updatedDialog = await desktopUpdate;
    expect(updatedDialog.revision).not.toBe(dialog.revision);
    expect(updatedDialog.rows).toMatchObject([
      { handoverId: action.handoverId, signedAt: signed.signedAt },
    ]);
    expect(await getReceiverHandoverPreview(action)).toMatchObject({
      signatureImage,
      signedAt: signed.signedAt,
    });
    const [before] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(before?.status).toBe(ParcelStatus.AWAITING_PICKUP);
    expect(before?.confirmedAt).toBeNull();
    const results = await Promise.all([
      confirmSignedReceiverHandover(action),
      confirmSignedReceiverHandover(action),
    ]);
    expect(results.filter(({ alreadyConfirmed }) => !alreadyConfirmed)).toHaveLength(1);
    const [after] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(after?.pendingReceiverHandover).toBeNull();
    expect((await watchDialog()).rows).toEqual([]);
    expect(after?.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
    expect(after?.deliveryConfirmationSnapshot?.receiverCashierSignature).toMatchObject({
      signatureImage,
      collectorId: parcel.receiverId,
      capturedBy: fixture.newPicker,
    });
    expect(await db.select().from(payments).where(eq(payments.parcelId, parcel.id))).toHaveLength(
      1,
    );
    expect(await db.select().from(auditLogs).where(eq(auditLogs.entityId, parcel.id))).toHaveLength(
      1,
    );
    const [queue] = await db.select().from(pickupQueues).where(eq(pickupQueues.id, ticket.id));
    expect(
      await getReceiverReceiptReprintSvc(
        parcel.id,
        {
          ...scope,
          sub: fixture.actor,
          email: `${fixture.actor}@example.test`,
        },
        true,
      ),
    ).toMatchObject({
      receiverPrincipalPsw: 1_000,
      receivedByName: 'Shelf customer',
      parcel: { trackingCode: parcel.trackingCode },
    });
    expect(queue?.endedAt).toBeInstanceOf(Date);
  });

  test('keeps the original payment and delivery action when the branch turns signing off', async () => {
    const { parcel, payment } = await setup();
    await db
      .update(branches)
      .set({ requireReceiverCashierSignature: false })
      .where(eq(branches.id, fixture.branchId));
    try {
      expect(
        await collectReceiverPaymentAndDeliverSvc({ ...payment, requestSignature: undefined }),
      ).toMatchObject({ awaitingSignature: false, status: ParcelStatus.DELIVERED_BY_OFFICE });
      const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
      expect(saved?.pendingReceiverHandover).toBeNull();
      expect(saved?.confirmedAt).toBeInstanceOf(Date);
    } finally {
      await db
        .update(branches)
        .set({ requireReceiverCashierSignature: true })
        .where(eq(branches.id, fixture.branchId));
    }
  });
});
