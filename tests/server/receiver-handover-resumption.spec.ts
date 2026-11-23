import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  cashierSessions,
  customers,
  parcels,
  payments,
  pickupQueues,
} from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { collectReceiverPaymentAndDeliverSvc } from '@/server/features/payments/service';
import {
  confirmSignedReceiverHandover,
  listReceiverHandovers,
} from '@/server/features/payments/services/receiver-handover.service';
import { createReceiverHandoverFixture } from '../utils/receiver-handover-fixture';

describe('Interrupted Receiver Cashier handovers stay searchable and resumable', () => {
  let fixture: Awaited<ReturnType<typeof createReceiverHandoverFixture>>;
  beforeAll(async () => {
    fixture = await createReceiverHandoverFixture();
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });

  test('searches pending handovers by code, receiver snapshot and both phone numbers', async () => {
    const { parcel } = await fixture.prepare();
    await db
      .update(customers)
      .set({
        fullname: 'Current receiver name',
        telephone: '0241234567',
        telephone2: '0207654321',
      })
      .where(eq(customers.id, parcel.receiverId));
    await db
      .update(parcels)
      .set({
        receiverNameSnapshot: 'Original receiver name',
        senderNameSnapshot: 'Original sender name',
      })
      .where(eq(parcels.id, parcel.id));
    for (const search of [
      parcel.bookingCode,
      parcel.trackingCode,
      'original receiver',
      'original sender',
      'Shelf customer',
      '0241234567',
      '0207654321',
    ]) {
      const page = await listReceiverHandovers({ ...fixture.scope, search });
      expect(page.rows.some((row) => row.id === parcel.id)).toBe(true);
    }
    expect((await listReceiverHandovers({ ...fixture.scope, search: '%' })).rows).toEqual([]);
    expect((await listReceiverHandovers({ ...fixture.scope, search: '_' })).rows).toEqual([]);
    expect(
      (
        await listReceiverHandovers({
          ...fixture.scope,
          branchId: fixture.companyId,
          search: parcel.bookingCode,
        })
      ).rows,
    ).toEqual([]);
    expect(
      (
        await listReceiverHandovers({
          ...fixture.scope,
          companyId: fixture.branchId,
          search: parcel.bookingCode,
        })
      ).rows,
    ).toEqual([]);
  });

  test('finds the main receiver and a second collector by their own names and phones', async () => {
    const { parcel, input } = await fixture.prepare();
    await db
      .update(customers)
      .set({ telephone: '0241234567' })
      .where(eq(customers.id, parcel.receiverId));
    const [collector] = await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Second collector',
        telephone: '0551234567',
        telephone2: '0271234567',
        createdBy: fixture.actor,
      })
      .returning();
    await db
      .update(parcels)
      .set({ pendingReceiverHandover: null, secondReceiverId: collector!.id })
      .where(eq(parcels.id, parcel.id));
    await collectReceiverPaymentAndDeliverSvc({
      ...input,
      handoverTarget: 'second',
      secondReceiverId: collector!.id,
      expectedSecondReceiverId: collector!.id,
    });
    for (const search of ['Second collector', '0551234567', '0271234567', '0241234567']) {
      const page = await listReceiverHandovers({ ...fixture.scope, search });
      expect(page.rows.some((row) => row.id === parcel.id)).toBe(true);
    }
  });

  test('another cashier finishes a previous-day request after the original session closes', async () => {
    const { parcel, action, ticket } = await fixture.prepare();
    const [before] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    const yesterday = new Date(Date.now() - 86_400_000);
    await db
      .update(parcels)
      .set({
        pendingReceiverHandover: {
          ...before!.pendingReceiverHandover!,
          requestedAt: yesterday.toISOString(),
        },
      })
      .where(eq(parcels.id, parcel.id));
    await db
      .update(pickupQueues)
      .set({ queueDate: yesterday })
      .where(eq(pickupQueues.id, ticket.id));
    await db
      .update(cashierSessions)
      .set({ status: 'CLOSED' })
      .where(eq(cashierSessions.cashierId, fixture.actor));
    await db
      .update(branches)
      .set({ requireReceiverCashierSignature: false })
      .where(eq(branches.id, fixture.branchId));
    try {
      const page = await listReceiverHandovers({ ...fixture.scope, search: parcel.bookingCode });
      expect(page.rows.map(({ id }) => id)).toEqual([parcel.id]);
      expect(await db.select().from(payments).where(eq(payments.parcelId, parcel.id))).toEqual([]);
      await fixture.sign(action);
      await confirmSignedReceiverHandover(action);
      await confirmSignedReceiverHandover(action);
      const posted = await db.select().from(payments).where(eq(payments.parcelId, parcel.id));
      expect(posted).toHaveLength(1);
      expect(posted[0]!.cashierUserId).toBe(action.actorId);
      expect(posted[0]!.receivedAt.getTime()).toBeGreaterThan(yesterday.getTime());
      const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
      expect(saved!.status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
      expect(saved!.pendingReceiverHandover).toBeNull();
    } finally {
      await db
        .update(cashierSessions)
        .set({ status: 'ACTIVE' })
        .where(eq(cashierSessions.cashierId, fixture.actor));
      await db
        .update(branches)
        .set({ requireReceiverCashierSignature: true })
        .where(eq(branches.id, fixture.branchId));
    }
  });

  test('missing OTP records no payment or pending handover and leaves the ticket open', async () => {
    const { parcel, input, ticket } = await fixture.prepare();
    await db
      .update(parcels)
      .set({ pendingReceiverHandover: null })
      .where(eq(parcels.id, parcel.id));
    await db
      .update(branches)
      .set({ requireReceiverOtp: true })
      .where(eq(branches.id, fixture.branchId));
    try {
      await expect(collectReceiverPaymentAndDeliverSvc(input)).rejects.toThrow(
        'OTP verification is required',
      );
      expect(await db.select().from(payments).where(eq(payments.parcelId, parcel.id))).toEqual([]);
      const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
      expect(saved).toMatchObject({
        status: ParcelStatus.AWAITING_PICKUP,
        confirmedAt: null,
        plannedToBePaidPsw: 1000,
        pendingReceiverHandover: null,
      });
      const [queue] = await db.select().from(pickupQueues).where(eq(pickupQueues.id, ticket.id));
      expect(queue!.endedAt).toBeNull();
    } finally {
      await db
        .update(branches)
        .set({ requireReceiverOtp: false })
        .where(eq(branches.id, fixture.branchId));
    }
  });
});
