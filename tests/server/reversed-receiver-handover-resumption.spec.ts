import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, parcels, payments } from '@/db/schemas';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import { collectReceiverPaymentAndDeliverSvc } from '@/server/features/payments/service';
import {
  confirmSignedReceiverHandover,
  listReceiverHandovers,
} from '@/server/features/payments/services/receiver-handover.service';
import { reverseParcelDeliverySvc } from '@/server/features/shipments/parcel-delivery-reversal.service';
import { listParcelsSvc } from '@/server/features/shipments/parcel-services/queries';
import { createReceiverHandoverFixture } from '../utils/receiver-handover-fixture';

// Live case AN2524984O (27 Nov 2026): signed and confirmed, then delivery was reversed for a wrong
// printout. The parcel must reappear in Receiver Cashier and accept a fresh signed handover.
describe('Receiver Cashier handover after a delivery reversal', () => {
  let fixture: Awaited<ReturnType<typeof createReceiverHandoverFixture>>;
  beforeAll(async () => {
    fixture = await createReceiverHandoverFixture();
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });

  const awaitingCollection = (search: string) =>
    listParcelsSvc({
      ...fixture.scope,
      destinationId: fixture.branchId,
      status: ParcelStatus.AWAITING_PICKUP,
      cashierCollectionRequired: true,
      search,
      limit: 20,
      offset: 0,
    });

  const addSecondReceiver = async (parcelId: string) => {
    const [second] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Reversal second collector',
        telephone: '0244424488',
        telephone2: '0209988776',
        createdBy: fixture.actor,
      })
      .returning();
    await db.update(parcels).set({ secondReceiverId: second!.id }).where(eq(parcels.id, parcelId));
    return second!;
  };

  test('finds parcels and pending requests by the second receiver phone', async () => {
    const { parcel } = await fixture.prepare();
    await addSecondReceiver(parcel.id);
    for (const search of ['0244424488', '0209988776', 'Reversal second']) {
      const page = await listReceiverHandovers({ ...fixture.scope, search });
      expect(page.rows.some((row) => row.id === parcel.id)).toBe(true);
    }
    await db
      .update(parcels)
      .set({ pendingReceiverHandover: null })
      .where(eq(parcels.id, parcel.id));
    for (const search of ['0244424488', '0209988776']) {
      const list = await awaitingCollection(search);
      expect(list.data.some((row) => row.id === parcel.id)).toBe(true);
    }
  });

  test('a reversed delivery returns to collection and completes with a new request', async () => {
    const { parcel, action } = await fixture.prepare();
    await fixture.sign(action);
    await confirmSignedReceiverHandover(action);
    await reverseParcelDeliverySvc({
      ...fixture.scope,
      parcelId: parcel.id,
      actorUserId: fixture.actor,
      reason: 'wrong printout',
    });

    const [reversed] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(reversed).toMatchObject({
      status: ParcelStatus.AWAITING_PICKUP,
      pendingReceiverHandover: null,
      plannedToBePaidPsw: 1000,
    });
    expect(
      (await listReceiverHandovers({ ...fixture.scope, search: parcel.bookingCode })).rows,
    ).toEqual([]);
    const list = await awaitingCollection(parcel.bookingCode);
    expect(list.data.map((row) => row.id)).toEqual([parcel.id]);

    const retry = await collectReceiverPaymentAndDeliverSvc({
      ...fixture.scope,
      parcelId: parcel.id,
      cashierUserId: fixture.newPicker,
      amountCedis: 10,
      storageAmountCedis: 0,
      method: PaymentMethod.CASH,
      confirmedBy: fixture.oldPicker,
      handoverTarget: 'main',
      expectedReceiverId: parcel.receiverId,
      requestSignature: true,
    });
    expect(retry.awaitingSignature).toBe(true);
    const nextAction = { ...action, handoverId: retry.handoverId!, actorId: fixture.newPicker };
    await fixture.sign(nextAction);
    await confirmSignedReceiverHandover(nextAction);

    const [delivered] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(delivered!.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
    expect(delivered!.pendingReceiverHandover).toBeNull();
    const active = await db
      .select()
      .from(payments)
      .where(and(eq(payments.parcelId, parcel.id), isNull(payments.voidedAt)));
    expect(active).toHaveLength(1);
    expect(active[0]!.cashierUserId).toBe(fixture.newPicker);
  });
});
