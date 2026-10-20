import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { db, closeSql } from '@/db/config';
import { auditLogs, cashierSessions, payments } from '@/db/schemas';
import { eq } from 'drizzle-orm';
import {
  CashierType,
  ParcelStatus,
  PaymentMethod,
  PaymentResponsibility,
} from '@/db/schemas/enums';
import { collectSenderPaymentAndProcessSvc } from '@/server/features/payments/service';
import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';
import { completeSelfServiceDraftSvc } from '@/server/features/self-service/drafts.service';
import { resolveToBePaidCompletionSessionSvc } from '@/server/features/cashiers/delegates.service';
import { getSessionToBePaidCreatedPswRepo } from '@/server/features/cashiers/session-summary.repository';
import {
  getDailyCashierSalesReportSvc,
  listDailyCashierSalesCashiersSvc,
} from '@/server/features/reporting/service';
import {
  createCashierSessionAttributionFixture,
  REPORT_DATE,
} from '../utils/cashier-session-attribution-fixture';

const enabled = process.env.CASHIER_ATTRIBUTION_TEST === '1';
describe.skipIf(!enabled)('cashier confirmation ownership across entry channels', () => {
  let fixture: Awaited<ReturnType<typeof createCashierSessionAttributionFixture>>;
  beforeAll(async () => {
    fixture = await createCashierSessionAttributionFixture();
  });
  beforeEach(async () => {
    await fixture.clear();
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });
  const report = (cashierUserId?: string | null, date = REPORT_DATE) =>
    getDailyCashierSalesReportSvc({
      companyId: 'company',
      branchId: 'source',
      viewerUserId: 'cashier-a',
      canSelectCashier: true,
      date,
      cashierUserId,
      cashierType: CashierType.SENDING,
    });
  const confirm = (parcelId: string, cashierUserId = 'cashier-b', amountCedis = 0) =>
    collectSenderPaymentAndProcessSvc({
      parcelId,
      cashierUserId,
      companyId: 'company',
      branchId: 'source',
      method: PaymentMethod.CASH,
      amountCedis,
    });
  async function expectOwner(parcelId: string, owner = 'cashier-b') {
    const saved = await fixture.readParcel(parcelId);
    expect(saved.processedBy).toBe(owner);
    expect(saved.cashierSessionId).toBe(owner === 'cashier-a' ? 'session-a' : 'session-b');
    const own = await report(owner);
    expect(own.toBePaidRows.map((row) => row.parcelId)).toContain(parcelId);
    expect((await report(owner === 'cashier-a' ? 'cashier-b' : 'cashier-a')).toBePaidRows).toEqual(
      [],
    );
    return saved;
  }

  test('agent entry belongs to the confirming cashier, not another cashier at the same location', async () => {
    const parcel = await fixture.parcel();
    expect((await report()).toBePaidRows).toEqual([]);
    await confirm(parcel.id);
    const saved = await expectOwner(parcel.id);
    expect(saved.createdBy).toBe('agent');
    const own = await report('cashier-b');
    expect(own.totals.toBePaidPsw).toBe(5000);
    expect(own.transactions).toEqual([]);
    expect(own.sessions.map((row) => row.id)).toEqual(['session-b']);
    expect(await db.select().from(payments)).toEqual([]);
  });

  test('confirmation replaces a provisional entry session even when a different cashier entered it', async () => {
    const parcel = await fixture.parcel({ createdBy: 'cashier-a', cashierSessionId: 'session-a' });
    expect((await report('cashier-a')).toBePaidRows).toEqual([]);
    await confirm(parcel.id);
    expect((await expectOwner(parcel.id)).createdBy).toBe('cashier-a');
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'PARCEL_SENDER_PROCESSED'));
    expect(logs).toHaveLength(1);
    expect(logs[0]?.actorUserId).toBe('cashier-b');
    expect(logs[0]?.metadata).toMatchObject({
      cashierSessionId: 'session-b',
      previousSessionId: 'session-a',
    });
  });

  test('self-service charge entry stays pending until a cashier confirms it', async () => {
    const draft = await fixture.draft();
    const booking = await completeSelfServiceDraftSvc(
      draft.id,
      {
        destinationId: 'destination',
        parcelDetails: 'One box',
        chargeCedis: 50,
        paymentResponsibility: 'RECEIVER',
        senderSettlementMode: 'PAY_NOW',
        chargeAgentUserId: 'agent',
      },
      {
        sub: 'agent',
        email: 'agent@example.test',
        companyId: 'company',
        branchId: 'source',
        locationId: 'location',
      },
    );
    const id = booking.parcels[0]!.id;
    expect((await fixture.readParcel(id)).cashierSessionId).toBeNull();
    expect((await report()).toBePaidRows).toEqual([]);
    await confirm(id);
    const saved = await expectOwner(id);
    expect(saved.createdBy).toBe('agent');
    expect(saved.chargeAgentUserId).toBe('agent');
  });

  test('mobile delegate completion belongs to its authorized cashier session', async () => {
    const owner = await resolveToBePaidCompletionSessionSvc({
      userId: 'agent',
      companyId: 'company',
      branchId: 'source',
    });
    const body: CreateBookingWithParcelsBody = {
      senderId: 'sender',
      companyId: 'company',
      sourceId: 'source',
      sourceLocationId: 'location',
      createdBy: 'agent',
      status: ParcelStatus.CREATED,
      requireActiveCashierSession: true,
      cashierSessionId: owner.sessionId,
      parcels: [
        {
          destinationId: 'destination',
          receiverId: 'receiver',
          status: ParcelStatus.CREATED,
          parcelDetails: 'One box',
          parcelContent: 'Clothes',
          chargeCedis: 50,
          plannedToBePaidCedis: 50,
          method: PaymentMethod.CASH,
          paymentResponsibility: PaymentResponsibility.RECIPIENT,
          senderPaymentCedis: 0,
          cashierUserId: owner.cashierId,
          branchId: 'source',
          chargeAgentUserId: 'agent',
        },
      ],
    };
    await expect(
      createBookingWithParcelsSvc({ ...body, cashierSessionId: 'session-a' }),
    ).rejects.toMatchObject({ status: 400 });
    const booking = await createBookingWithParcelsSvc(body);
    expect((await expectOwner(booking.parcels[0]!.id)).createdBy).toBe('agent');
  });

  test('paid and split confirmations retain the confirming cashier and real payment totals', async () => {
    const paid = await fixture.parcel({ plannedToBePaidPsw: 0 });
    await confirm(paid.id, 'cashier-b', 50);
    const partial = await fixture.parcel({ plannedToBePaidPsw: 3000 });
    await confirm(partial.id, 'cashier-b', 20);
    const own = await report('cashier-b');
    expect(own.toBePaidRows.map((row) => row.parcelId)).toEqual([partial.id]);
    expect(own.totals.toBePaidPsw).toBe(3000);
    expect(own.totals.grossPsw).toBe(7000);
    expect(own.transactions).toHaveLength(2);
    expect((await fixture.readParcel(paid.id)).processedBy).toBe('cashier-b');
    expect((await report('cashier-a')).transactions).toEqual([]);
  });

  test('repeating confirmation cannot transfer ownership or duplicate rows/audits', async () => {
    const parcel = await fixture.parcel();
    await confirm(parcel.id);
    expect((await confirm(parcel.id, 'cashier-a')).statusChanged).toBe(false);
    await expectOwner(parcel.id);
    expect((await report('cashier-b')).toBePaidRows).toHaveLength(1);
    expect(
      await db.select().from(auditLogs).where(eq(auditLogs.action, 'PARCEL_SENDER_PROCESSED')),
    ).toHaveLength(1);
  });

  test('concurrent confirmations have one owner', async () => {
    for (let iteration = 0; iteration < 10; iteration += 1) {
      await fixture.clear();
      const parcel = await fixture.parcel();
      const outcomes = await Promise.all([
        confirm(parcel.id, 'cashier-a'),
        confirm(parcel.id, 'cashier-b'),
      ]);
      expect(outcomes.filter((row) => row.statusChanged)).toHaveLength(1);
      await expectOwner(parcel.id, (await fixture.readParcel(parcel.id)).processedBy!);
    }
  });

  test('session open date controls the report even when parcel entry was on an earlier day', async () => {
    const parcel = await fixture.parcel({ createdAt: new Date('2026-10-19T20:00:00Z') });
    await confirm(parcel.id);
    expect((await report('cashier-b')).toBePaidRows.map((row) => row.parcelId)).toEqual([
      parcel.id,
    ]);
    expect((await report('cashier-b', '2026-10-19')).toBePaidRows).toEqual([]);
  });

  test('report location follows the owning cashier and does not depend on the creator location', async () => {
    const parcel = await fixture.parcel({ sourceLocationId: null });
    await confirm(parcel.id);
    const own = await getDailyCashierSalesReportSvc({
      companyId: 'company',
      branchId: 'source',
      locationId: 'location',
      viewerUserId: 'cashier-b',
      canSelectCashier: false,
      cashierUserId: 'cashier-a',
      date: REPORT_DATE,
    });
    expect(own.toBePaidRows.map((row) => row.parcelId)).toEqual([parcel.id]);
  });

  test('active summary does not guess another cashier from branch/time or include unconfirmed parcels', async () => {
    await fixture.parcel({
      status: ParcelStatus.PROCESSED,
      createdBy: 'cashier-a',
      processedBy: 'cashier-a',
    });
    await fixture.parcel({ createdBy: 'cashier-a', cashierSessionId: 'session-a' });
    await fixture.parcel({
      status: ParcelStatus.PROCESSED,
      processedBy: 'cashier-b',
      cashierSessionId: 'session-a',
    });
    const parcel = await fixture.parcel();
    await confirm(parcel.id);
    expect(
      await getSessionToBePaidCreatedPswRepo({ sessionId: 'session-a', cashierId: 'cashier-a' }),
    ).toBe(0);
    expect((await report('cashier-a')).toBePaidRows).toEqual([]);
    expect(
      await getSessionToBePaidCreatedPswRepo({ sessionId: 'session-b', cashierId: 'cashier-b' }),
    ).toBe(5000);
    expect(
      await getSessionToBePaidCreatedPswRepo({ sessionId: 'session-b', cashierId: 'cashier-a' }),
    ).toBe(0);
  });

  test('cashier options include a cashier whose only records were entered by agents', async () => {
    const parcel = await fixture.parcel();
    await confirm(parcel.id);
    const options = await listDailyCashierSalesCashiersSvc({
      companyId: 'company',
      branchId: 'source',
      canSelectCashier: true,
      date: REPORT_DATE,
      cashierType: CashierType.SENDING,
    });
    expect(options).toEqual([{ id: 'cashier-b', name: 'cashier-b' }]);
  });

  test('closed sessions cannot confirm and source/company/deletion scope is checked before a zero-payment confirmation', async () => {
    for (const patch of [
      { sourceId: 'destination' },
      { companyId: 'other' },
      { isDeleted: true },
    ]) {
      const parcel = await fixture.parcel(patch);
      await expect(confirm(parcel.id)).rejects.toMatchObject({ status: 404 });
    }
    await db
      .update(cashierSessions)
      .set({ status: 'COMPLETED' })
      .where(eq(cashierSessions.id, 'session-b'));
    const parcel = await fixture.parcel();
    await expect(confirm(parcel.id)).rejects.toMatchObject({ status: 403 });
    await db
      .update(cashierSessions)
      .set({ status: 'ACTIVE' })
      .where(eq(cashierSessions.id, 'session-b'));
  });
});
