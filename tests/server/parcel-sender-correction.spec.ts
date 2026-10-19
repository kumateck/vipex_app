import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { db, sql } from '@/db/config';
import {
  auditLogs,
  branches,
  customers,
  customerCreditTransactions,
  parcels,
  payments,
} from '@/db/schemas';
import { ParcelStatus, CustomerCreditSourceType } from '@/db/schemas/enums';
import {
  correctParcelSenderSvc,
  findParcelSenderCandidatesSvc,
} from '@/server/features/shipments/parcel-sender-correction.service';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

describe('source parcel sender correction', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  const destinationId = createId();
  let correctCustomer: typeof customers.$inferSelect;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    await db.insert(branches).values({
      id: destinationId,
      companyId: fixture.companyId,
      name: 'Destination',
      createdBy: fixture.actor,
    });
    [correctCustomer] = (await db
      .insert(customers)
      .values({
        companyId: fixture.companyId,
        fullname: 'Correct Sender',
        telephone: '0551112222',
        telephone2: '0553334444',
        createdBy: fixture.actor,
      })
      .returning()) as [typeof customers.$inferSelect];
  });
  afterAll(async () => {
    if (!fixture) return;
    await db
      .delete(customerCreditTransactions)
      .where(eq(customerCreditTransactions.companyId, fixture.companyId));
    await db.delete(payments).where(eq(payments.companyId, fixture.companyId));
    await fixture.cleanup();
  });
  const newParcel = async () => {
    const row = await fixture.parcel();
    await db
      .update(parcels)
      .set({ status: ParcelStatus.PROCESSED, destinationId })
      .where(eq(parcels.id, row.id));
    return row;
  };
  const context = (parcelId: string) => ({
    parcelId,
    companyId: fixture.companyId,
    branchId: fixture.branchId,
    actorUserId: fixture.actor,
  });
  const correct = async (row: { id: string; senderId: string }, overrides = {}) =>
    correctParcelSenderSvc({
      ...context(row.id),
      expectedSenderId: row.senderId,
      customerId: correctCustomer.id,
      telephone: '0551112222',
      reason: 'Incorrect sender number entered at booking',
      ...overrides,
    });
  test('links the existing customer and preserves profiles, other parcels, status and posted amounts', async () => {
    const parcel = await newParcel();
    const other = await newParcel();
    const previousCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.companyId, fixture.companyId));
    const [payment] = await db
      .insert(payments)
      .values({
        companyId: fixture.companyId,
        branchId: fixture.branchId,
        parcelId: parcel.id,
        cashierUserId: fixture.actor,
        grossAmountPsw: 2000,
        netAmountPsw: 2000,
        vatPsw: 0,
        getfundPsw: 0,
        nhilPsw: 0,
        covidPsw: 0,
        taxTotalPsw: 0,
      })
      .returning();
    expect(await correct(parcel)).toMatchObject({ changed: true });
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, parcel.id));
    expect(saved).toMatchObject({
      senderId: correctCustomer.id,
      senderNameSnapshot: 'Correct Sender',
      status: ParcelStatus.PROCESSED,
      chargePsw: parcel.chargePsw,
      trackingCode: parcel.trackingCode,
      bookingCode: parcel.bookingCode,
    });
    expect((await db.select().from(parcels).where(eq(parcels.id, other.id)))[0]?.senderId).toBe(
      other.senderId,
    );
    expect(
      await db.select().from(customers).where(eq(customers.companyId, fixture.companyId)),
    ).toEqual(previousCustomers);
    expect((await db.select().from(payments).where(eq(payments.id, payment!.id)))[0]).toEqual(
      payment!,
    );
    const audits = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, parcel.id), eq(auditLogs.action, 'PARCEL_SENDER_CHANGED')));
    expect(audits).toHaveLength(1);
    expect(audits[0]?.metadata).toMatchObject({
      previousSenderId: parcel.senderId,
      senderId: correctCustomer.id,
      reason: 'Incorrect sender number entered at booking',
    });
  });
  test('looks up exact primary or secondary phones without directory fields', async () => {
    const parcel = await newParcel();
    for (const telephone of ['0551112222', '0553334444']) {
      const rows = await findParcelSenderCandidatesSvc({ ...context(parcel.id), telephone });
      expect(rows.find((row) => row.id === correctCustomer.id)).toEqual({
        id: correctCustomer.id,
        fullname: 'Correct Sender',
        telephone: '0551112222',
        telephone2: '0553334444',
      });
    }
  });
  test('rejects destination, unrelated branch and foreign company', async () => {
    const parcel = await newParcel();
    for (const overrides of [
      { branchId: destinationId },
      { branchId: 'other' },
      { companyId: 'other' },
    ]) {
      await expect(correct(parcel, overrides)).rejects.toMatchObject({ status: 404 });
      await expect(
        findParcelSenderCandidatesSvc({
          ...context(parcel.id),
          ...overrides,
          telephone: '0551112222',
        }),
      ).rejects.toMatchObject({ status: 404 });
    }
  });
  test('rejects stale sender, changed number and inactive customer', async () => {
    const parcel = await newParcel();
    await expect(correct(parcel, { expectedSenderId: 'stale' })).rejects.toMatchObject({
      status: 409,
    });
    await expect(correct(parcel, { telephone: '0555555555' })).rejects.toMatchObject({
      status: 400,
    });
    await db.update(customers).set({ isDeleted: true }).where(eq(customers.id, correctCustomer.id));
    try {
      await expect(correct(parcel)).rejects.toMatchObject({ status: 400 });
    } finally {
      await db
        .update(customers)
        .set({ isDeleted: false })
        .where(eq(customers.id, correctCustomer.id));
    }
  });
  test('does not move sender credit history to a different customer', async () => {
    const parcel = await newParcel();
    await db.insert(customerCreditTransactions).values({
      companyId: fixture.companyId,
      customerId: parcel.senderId,
      sourceType: CustomerCreditSourceType.PARCEL,
      referenceId: parcel.id,
      signedAmountPsw: 1000,
      createdBy: fixture.actor,
    });
    await expect(correct(parcel)).rejects.toThrow('sender credit history');
    expect((await db.select().from(parcels).where(eq(parcels.id, parcel.id)))[0]?.senderId).toBe(
      parcel.senderId,
    );
  });
  test('rolls back sender association if the audit write fails', async () => {
    const parcel = await newParcel();
    await sql.unsafe(
      "ALTER TABLE audit_logs ADD CONSTRAINT reject_sender_correction CHECK (action <> 'PARCEL_SENDER_CHANGED') NOT VALID",
    );
    try {
      await expect(correct(parcel)).rejects.toThrow();
      expect((await db.select().from(parcels).where(eq(parcels.id, parcel.id)))[0]?.senderId).toBe(
        parcel.senderId,
      );
    } finally {
      await sql.unsafe('ALTER TABLE audit_logs DROP CONSTRAINT reject_sender_correction');
    }
  });
});
