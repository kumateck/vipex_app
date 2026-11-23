import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, sql } from '@/db/config';
import {
  dailyCashConfirmations,
  roles,
  parcels,
  payments,
  reconciliationBankSettlements,
  taxJournalItems,
} from '@/db/schemas';
import { recoverUnpaidReceiverHandover } from '@/server/features/maintenance/booking-operations';
import type { TaggedTransaction } from '@/server/features/maintenance/credit-repair';
import { executeMaintenanceRunSvc } from '@/server/features/maintenance/service';
import { confirmSignedReceiverHandover } from '@/server/features/payments/services/receiver-handover.service';
import { getCurrentActiveSessionSummarySvc } from '@/server/features/cashiers/service';
import { createUnpaidReceiverHandoverFixture } from '../utils/unpaid-receiver-handover-fixture';

describe('Recover a legacy receiver handover when no cash was received', () => {
  let fixture: Awaited<ReturnType<typeof createUnpaidReceiverHandoverFixture>>;
  beforeAll(async () => {
    fixture = await createUnpaidReceiverHandoverFixture();
  });
  afterAll(async () => {
    if (fixture) await fixture.cleanup();
  });
  const read = async (id: string) =>
    (await db.select().from(parcels).where(eq(parcels.id, id)))[0]!;
  const rows = (id: string) => db.select().from(payments).where(eq(payments.parcelId, id));
  const expectedCash = async (cashierId: string) =>
    (await getCurrentActiveSessionSummarySvc({
      cashierId,
      branchId: fixture.branchId,
      mode: 'receiver',
    }))!.amountPaidPsw;
  const preview = (code: string) =>
    executeMaintenanceRunSvc(fixture.admin, {
      operationId: 'recover-unpaid-receiver-handover',
      params: { bookingCode: code },
      mode: 'preview',
    });
  const apply = (code: string, previewRunId: string, confirmed = true) =>
    executeMaintenanceRunSvc(fixture.admin, {
      operationId: 'recover-unpaid-receiver-handover',
      params: { bookingCode: code },
      mode: 'execute',
      previewRunId,
      confirmNoCashReceived: confirmed,
      confirmRepair: true,
    });

  test.each([
    {},
    { senderPaid: true },
    { withStorage: true },
    { storageOnly: true, withStorage: true },
  ])(
    'recovers original principal/storage and records collection only for the final cashier (%j)',
    async (options) => {
      const { parcel, pending, action, tax } = await fixture.prepare(options);
      const beforePayments = await rows(parcel.id);
      const senderPayments = beforePayments.filter((payment) => payment.payer === 0);
      const originalBefore = await expectedCash(fixture.actor);
      const finalBefore = await expectedCash(action.actorId);
      const amountPsw = beforePayments
        .filter((payment) => pending.snapshot.paymentIds.includes(payment.id))
        .reduce((sum, payment) => sum + payment.grossAmountPsw, 0);
      const inspected = await preview(parcel.bookingCode);
      expect(inspected.result!.readyToApply).toBe(true);
      expect(await rows(parcel.id)).toEqual(beforePayments);
      await expect(apply(parcel.bookingCode, inspected.id, false)).rejects.toThrow('confirmation');
      await apply(parcel.bookingCode, inspected.id);
      expect(await expectedCash(fixture.actor)).toBe(originalBefore - amountPsw);
      expect(await expectedCash(action.actorId)).toBe(finalBefore);
      const recovered = await read(parcel.id);
      expect(recovered.pendingReceiverHandover!.capture).toEqual(pending.capture);
      expect(recovered.plannedToBePaidPsw).toBe(options.storageOnly ? 0 : 1000);
      expect(recovered.confirmedAt).toBeNull();
      expect(recovered.pendingReceiverHandover!.snapshot.paymentIds).toEqual([]);
      const correctedPayments = await rows(parcel.id);
      expect(correctedPayments.filter((payment) => payment.payer === 0)).toEqual(senderPayments);
      for (const payment of correctedPayments) {
        if (pending.snapshot.paymentIds.includes(payment.id)) {
          expect(payment.voidedAt).not.toBeNull();
          expect(payment.voidedBy).toBe(fixture.actor);
          expect(payment.voidReason).toContain('no cash was physically received');
        } else expect(payment.voidedAt).toBeNull();
      }
      const [excluded] = await db
        .select()
        .from(taxJournalItems)
        .where(eq(taxJournalItems.id, tax.id));
      expect(excluded!.filingStatus).toBe(3);
      await expect(apply(parcel.bookingCode, inspected.id)).rejects.toThrow('fresh preview');
      await confirmSignedReceiverHandover(action);
      await confirmSignedReceiverHandover(action);
      const collected = (await rows(parcel.id)).filter(
        (payment) => !payment.voidedAt && payment.payer === 1,
      );
      expect(collected).toHaveLength(options.withStorage && !options.storageOnly ? 2 : 1);
      expect(collected.every((payment) => payment.cashierUserId === action.actorId)).toBe(true);
      expect(await expectedCash(fixture.actor)).toBe(originalBefore - amountPsw);
      expect(await expectedCash(action.actorId)).toBe(finalBefore + amountPsw);
      expect((await read(parcel.id)).status).toBe(6);
      expect((await rows(parcel.id)).filter((payment) => payment.payer === 0)).toEqual(
        senderPayments,
      );
    },
  );

  test('recovery rejects a handover referencing a sender payment and leaves every payment unchanged', async () => {
    const { parcel, pending } = await fixture.prepare({ senderPaid: true });
    const beforePayments = await rows(parcel.id);
    const sender = beforePayments.find((payment) => payment.payer === 0)!;
    await db
      .update(parcels)
      .set({
        pendingReceiverHandover: {
          ...pending,
          snapshot: { ...pending.snapshot, paymentIds: [sender.id] },
        },
      })
      .where(eq(parcels.id, parcel.id));
    const inspected = await preview(parcel.bookingCode);
    expect(inspected.result!.readyToApply).toBe(false);
    await expect(apply(parcel.bookingCode, inspected.id)).rejects.toThrow('fresh preview');
    expect(await rows(parcel.id)).toEqual(beforePayments);
  });

  test('a changed payment invalidates the reviewed preview without voiding it', async () => {
    const { parcel, posted } = await fixture.prepare();
    const inspected = await preview(parcel.bookingCode);
    await db
      .update(payments)
      .set({ grossAmountPsw: 2000 })
      .where(eq(payments.id, posted.payment!.id));
    await expect(apply(parcel.bookingCode, inspected.id)).rejects.toThrow('changed since preview');
    expect((await rows(parcel.id)).every((payment) => payment.voidedAt === null)).toBe(true);
    expect((await read(parcel.id)).pendingReceiverHandover!.paymentPlan).toBeUndefined();
  });

  test('a failure after recovery rolls back payment voiding, tax exclusions and the deferred plan', async () => {
    const { parcel, tax } = await fixture.prepare();
    const before = await read(parcel.id);
    await expect(
      sql.begin('isolation level serializable', async (transaction) => {
        await recoverUnpaidReceiverHandover(transaction as TaggedTransaction, {
          companyId: fixture.companyId,
          actorId: fixture.actor,
          code: parcel.bookingCode,
          apply: true,
        });
        throw new Error('Simulated recovery failure');
      }),
    ).rejects.toThrow('Simulated recovery failure');
    expect((await read(parcel.id)).pendingReceiverHandover).toEqual(before.pendingReceiverHandover);
    expect((await rows(parcel.id)).every((payment) => payment.voidedAt === null)).toBe(true);
    const [retained] = await db
      .select()
      .from(taxJournalItems)
      .where(eq(taxJournalItems.id, tax.id));
    expect(retained!.filingStatus).toBe(0);
  });

  test.each(['electronic', 'filed tax', 'changed charge', 'cash confirmation', 'bank settlement'])(
    'blocks unsupported or reconciled records: %s',
    async (kind) => {
      const { parcel, posted, tax } = await fixture.prepare();
      if (kind === 'electronic')
        await db.update(payments).set({ method: 1 }).where(eq(payments.id, posted.payment!.id));
      if (kind === 'filed tax')
        await db
          .update(taxJournalItems)
          .set({ filingStatus: 2 })
          .where(eq(taxJournalItems.id, tax.id));
      if (kind === 'changed charge')
        await db.update(parcels).set({ chargePsw: 2000 }).where(eq(parcels.id, parcel.id));
      const receivedAt = (await rows(parcel.id))[0]!.receivedAt;
      if (kind === 'cash confirmation')
        await db.insert(dailyCashConfirmations).values({
          companyId: fixture.companyId,
          branchId: fixture.branchId,
          confirmationDate: receivedAt,
          createdBy: fixture.actor,
        });
      if (kind === 'bank settlement')
        await db.insert(reconciliationBankSettlements).values({
          companyId: fixture.companyId,
          branchId: fixture.branchId,
          settlementDate: receivedAt,
          settlementNo: parcel.bookingCode,
          submittedByUserId: fixture.actor,
        });
      try {
        const inspected = await preview(parcel.bookingCode);
        expect(inspected.result!.readyToApply).toBe(false);
        await expect(apply(parcel.bookingCode, inspected.id)).rejects.toThrow('fresh preview');
        expect((await rows(parcel.id)).every((payment) => payment.voidedAt === null)).toBe(true);
      } finally {
        await db
          .delete(dailyCashConfirmations)
          .where(eq(dailyCashConfirmations.companyId, fixture.companyId));
        await db
          .delete(reconciliationBankSettlements)
          .where(eq(reconciliationBankSettlements.companyId, fixture.companyId));
      }
    },
  );

  test('a cashier without the System Admin role cannot execute financial recovery', async () => {
    await db.update(roles).set({ name: 'Cashier' }).where(eq(roles.id, fixture.roleId));
    try {
      await expect(
        executeMaintenanceRunSvc(fixture.admin, {
          operationId: 'recover-unpaid-receiver-handover',
          params: { bookingCode: 'NONEXISTENT' },
          mode: 'preview',
        }),
      ).rejects.toThrow('System Admin');
    } finally {
      await db.update(roles).set({ name: 'System Admin' }).where(eq(roles.id, fixture.roleId));
    }
  });
});
