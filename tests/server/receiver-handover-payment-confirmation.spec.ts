import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { auditLogs, cashierSessions, parcels, payments, pickupQueues } from '@/db/schemas';
import { ParcelStatus, PaymentComponent } from '@/db/schemas/enums';
import { confirmSignedReceiverHandover } from '@/server/features/payments/services/receiver-handover.service';
import {
  prepareReceiverPaymentPlan,
  settlePendingReceiverPayments,
} from '@/server/features/payments/services/receiver-handover';
import { settleReceiverPayments } from '@/server/features/payments/services/settle-receiver-payments';
import { createReceiverHandoverFixture } from '../utils/receiver-handover-fixture';
import { reverseParcelDeliverySvc } from '@/server/features/shipments/parcel-delivery-reversal.service';

describe('Receiver payment is posted at Confirm Received', () => {
  let fixture: Awaited<ReturnType<typeof createReceiverHandoverFixture>>;
  beforeAll(async () => {
    fixture = await createReceiverHandoverFixture();
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });
  const read = async (id: string) =>
    (await db.select().from(parcels).where(eq(parcels.id, id)))[0]!;
  const paymentRows = (id: string) => db.select().from(payments).where(eq(payments.parcelId, id));

  test.each([-1, NaN, Infinity])(
    'rejects invalid proposed amounts (%s) without posting money',
    async (amountCedis) => {
      const { parcel, input } = await fixture.prepare();
      await expect(
        db.transaction((tx) => prepareReceiverPaymentPlan({ ...input, amountCedis }, tx)),
      ).rejects.toThrow('finite and non-negative');
      expect(await paymentRows(parcel.id)).toHaveLength(0);
    },
  );

  test('posts against the confirming cashier, with the payment and handover linked in audit', async () => {
    const { parcel, action } = await fixture.prepare();
    expect(await paymentRows(parcel.id)).toHaveLength(0);
    await fixture.sign(action);
    expect(await paymentRows(parcel.id)).toHaveLength(0);
    expect((await read(parcel.id)).plannedToBePaidPsw).toBe(1000);
    await confirmSignedReceiverHandover(action);
    const [payment] = await paymentRows(parcel.id);
    const saved = await read(parcel.id);
    expect(payment).toMatchObject({ cashierUserId: fixture.newPicker, grossAmountPsw: 1000 });
    expect(saved).toMatchObject({
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      plannedToBePaidPsw: 0,
    });
    expect(saved.deliveryConfirmationSnapshot?.paymentIds).toEqual([payment!.id]);
    expect(payment!.receivedAt.getTime()).toBeLessThanOrEqual(saved.confirmedAt!.getTime());
    const [audit] = await db.select().from(auditLogs).where(eq(auditLogs.entityId, payment!.id));
    expect(audit).toMatchObject({
      actorUserId: action.actorId,
      action: 'PAYMENT_CREATED',
      metadata: { handoverId: action.handoverId },
    });
    await confirmSignedReceiverHandover(action);
    expect(await paymentRows(parcel.id)).toHaveLength(1);
  });

  test('a failure after payment posting rolls back money, balance and pending state together', async () => {
    const { parcel, action } = await fixture.prepare();
    await fixture.sign(action);
    const before = await read(parcel.id);
    await expect(
      db.transaction(async (tx) => {
        await tx.select().from(parcels).where(eq(parcels.id, parcel.id)).for('update');
        await settlePendingReceiverPayments(
          parcel.id,
          before.pendingReceiverHandover!,
          action.actorId,
          tx,
        );
        const rows = await tx.select().from(payments).where(eq(payments.parcelId, parcel.id));
        expect(rows).toHaveLength(1);
        throw new Error('Simulated failure after payment, before final delivery');
      }),
    ).rejects.toThrow('Simulated failure');
    expect(await paymentRows(parcel.id)).toHaveLength(0);
    expect(await read(parcel.id)).toMatchObject({
      plannedToBePaidPsw: 1000,
      pendingReceiverHandover: before.pendingReceiverHandover,
    });
    await confirmSignedReceiverHandover(action);
    expect(await paymentRows(parcel.id)).toHaveLength(1);
  });

  test('changed balances block confirmation without posting payment; a valid retry posts once', async () => {
    const { parcel, action } = await fixture.prepare();
    await fixture.sign(action);
    await db.update(parcels).set({ chargePsw: 2000 }).where(eq(parcels.id, parcel.id));
    await expect(confirmSignedReceiverHandover(action)).rejects.toThrow('balance changed');
    expect(await paymentRows(parcel.id)).toHaveLength(0);
    expect((await read(parcel.id)).pendingReceiverHandover?.capture).toBeDefined();
    await db.update(parcels).set({ chargePsw: 1000 }).where(eq(parcels.id, parcel.id));
    await confirmSignedReceiverHandover(action);
    expect(await paymentRows(parcel.id)).toHaveLength(1);
  });

  test('ended pickup tickets block payment and leave the signed request pending', async () => {
    const { parcel, action, ticket } = await fixture.prepare();
    await fixture.sign(action);
    await db
      .update(pickupQueues)
      .set({ endedAt: new Date() })
      .where(eq(pickupQueues.id, ticket.id));
    await expect(confirmSignedReceiverHandover(action)).rejects.toThrow('pickup ticket changed');
    expect(await paymentRows(parcel.id)).toHaveLength(0);
    expect((await read(parcel.id)).confirmedAt).toBeNull();
  });

  test('a closed confirmation session cannot create a payment', async () => {
    const { parcel, action } = await fixture.prepare();
    await fixture.sign(action);
    await db
      .update(cashierSessions)
      .set({ status: 'CLOSED' })
      .where(eq(cashierSessions.cashierId, action.actorId));
    try {
      await expect(confirmSignedReceiverHandover(action)).rejects.toThrow();
      expect(await paymentRows(parcel.id)).toHaveLength(0);
      expect((await read(parcel.id)).pendingReceiverHandover).not.toBeNull();
    } finally {
      await db
        .update(cashierSessions)
        .set({ status: 'ACTIVE' })
        .where(eq(cashierSessions.cashierId, action.actorId));
    }
  });

  test.each([false, true])(
    'defers storage and principal together (storage only: %s)',
    async (storageOnly) => {
      const { parcel, action } = await fixture.prepare({ withStorage: true, storageOnly });
      expect(await paymentRows(parcel.id)).toHaveLength(0);
      await fixture.sign(action);
      await confirmSignedReceiverHandover(action);
      const rows = await paymentRows(parcel.id);
      expect(rows).toHaveLength(storageOnly ? 1 : 2);
      expect(rows.find((row) => row.component === PaymentComponent.OTHER)?.grossAmountPsw).toBe(
        1000,
      );
      expect(
        (await read(parcel.id)).deliveryConfirmationSnapshot?.receiverCashierReceiptTax,
      ).toBeDefined();
    },
  );

  test('legacy paid pending handovers confirm without a duplicate collection', async () => {
    const { parcel, action, input } = await fixture.prepare();
    await fixture.sign(action);
    const pending = (await read(parcel.id)).pendingReceiverHandover!;
    delete pending.paymentPlan;
    await db.transaction(async (tx) => {
      await tx
        .update(parcels)
        .set({ pendingReceiverHandover: null })
        .where(eq(parcels.id, parcel.id));
      const { payment } = await settleReceiverPayments(input, tx);
      pending.snapshot.paymentIds = [payment!.id];
      await tx
        .update(parcels)
        .set({ pendingReceiverHandover: pending })
        .where(eq(parcels.id, parcel.id));
    });
    const [original] = await paymentRows(parcel.id);
    await confirmSignedReceiverHandover(action);
    expect(await paymentRows(parcel.id)).toEqual([original!]);
    expect((await read(parcel.id)).status).toBe(ParcelStatus.DELIVERED_BY_OFFICE);
  });

  test('reversing confirmation voids only its receiver collection and preserves sender payment', async () => {
    const { parcel, action } = await fixture.prepare({ senderPaid: true });
    const [sender] = await paymentRows(parcel.id);
    await fixture.sign(action);
    await confirmSignedReceiverHandover(action);
    const delivered = await read(parcel.id);
    expect(delivered.deliveryConfirmationSnapshot?.paymentIds).not.toContain(sender!.id);
    await reverseParcelDeliverySvc({
      ...fixture.scope,
      parcelId: parcel.id,
      actorUserId: action.actorId,
      reason: 'Testing mistaken handover reversal',
    });
    const rows = await paymentRows(parcel.id);
    expect(rows.find(({ id }) => id === sender!.id)?.voidedAt).toBeNull();
    expect(rows.find(({ id }) => id !== sender!.id)?.voidedAt).toBeInstanceOf(Date);
    expect(await read(parcel.id)).toMatchObject({
      status: ParcelStatus.AWAITING_PICKUP,
      plannedToBePaidPsw: 1000,
    });
  });
});
