import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { closeSql, db, sql } from '@/db/config';
import { customers, payments, customerCreditTransactions, taxJournalItems } from '@/db/schemas';
import {
  CashierType,
  CustomerType,
  ParcelStatus,
  PaymentComponent,
  PaymentMethod,
  Payer,
} from '@/db/schemas/enums';
import {
  collectSenderPaymentAndProcessSvc,
  createPaymentSvc,
} from '@/server/features/payments/service';
import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from '@/server/features/shipments/booking-with-parcels.service';
import { getStickerPaymentRecord } from '@/server/features/shipments/parcel-sticker-payment.repository';
import { verifyStickerPaymentRecord } from '@/server/features/shipments/parcel-sticker-payment.rules';
import { createCashierSessionAttributionFixture } from '../utils/cashier-session-attribution-fixture';

describe.skipIf(process.env.CREDIT_COLLECTION_TEST !== '1')(
  'credit parcel collection prevention',
  () => {
    let fixture: Awaited<ReturnType<typeof createCashierSessionAttributionFixture>>;
    beforeAll(async () => {
      fixture = await createCashierSessionAttributionFixture();
      await db
        .update(customers)
        .set({ customerType: CustomerType.BUSINESS, creditEligible: true })
        .where(eq(customers.id, 'sender'));
    });
    beforeEach(async () => {
      await fixture.clear();
      await sql`truncate customer_credit_transactions, customer_credit_allocations, tax_journal_items`;
    });
    afterAll(async () => {
      await fixture?.cleanup();
      await closeSql();
    });

    const confirm = (parcelId: string, amountCedis: number | null) =>
      collectSenderPaymentAndProcessSvc({
        companyId: 'company',
        branchId: 'source',
        parcelId,
        method: PaymentMethod.CASH,
        cashierUserId: 'cashier-b',
        amountCedis,
      });
    const assertNoFinancialWrites = async () => {
      expect(await db.select().from(payments)).toEqual([]);
      expect(await db.select().from(taxJournalItems)).toEqual([]);
    };
    const booking = (): CreateBookingWithParcelsBody => ({
      senderId: 'sender',
      companyId: 'company',
      sourceId: 'source',
      sourceLocationId: 'location',
      status: ParcelStatus.CREATED,
      createdBy: 'cashier-b',
      requireActiveCashierSession: true,
      parcels: [
        {
          destinationId: 'destination',
          receiverId: 'receiver',
          status: ParcelStatus.CREATED,
          parcelDetails: 'Box',
          parcelContent: 'Clothes',
          chargeCedis: 50,
          plannedToBePaidCedis: 0,
          senderPaymentCedis: 0,
          method: PaymentMethod.CREDIT,
          cashierUserId: 'cashier-b',
          branchId: 'source',
          chargeAgentUserId: 'agent',
        },
      ],
    });

    test.each([0, -1, 0.001])(
      'new booking rejects invalid charge %s without financial writes',
      async (chargeCedis) => {
        const body = booking();
        body.parcels[0]!.chargeCedis = chargeCedis;
        await expect(createBookingWithParcelsSvc(body)).rejects.toMatchObject({ status: 400 });
        await assertNoFinancialWrites();
        expect(await db.select().from(customerCreditTransactions)).toEqual([]);
      },
    );

    test('cashier creation posts credit and processes with no cash or tax row', async () => {
      const result = await createBookingWithParcelsSvc(booking());
      const saved = await fixture.readParcel(result.parcels[0]!.id);
      expect(saved.status).toBe(ParcelStatus.PROCESSED);
      expect(saved.method).toBe(PaymentMethod.CREDIT);
      expect(saved.processedBy).toBe('cashier-b');
      expect(saved.cashierSessionId).toBe('session-b');
      await assertNoFinancialWrites();
      const charges = await db.select().from(customerCreditTransactions);
      expect(charges).toHaveLength(1);
      expect(charges[0]!.signedAmountPsw).toBe(5000);
      const record = await getStickerPaymentRecord(
        'company',
        saved.trackingCode,
        saved.bookingCode,
      );
      expect(verifyStickerPaymentRecord(record!).status).toBe('CREDIT');
    });

    test('the production print-triggered collection is rejected and rolls back processing', async () => {
      const parcel = await fixture.parcel({ method: PaymentMethod.CREDIT, plannedToBePaidPsw: 0 });
      await expect(confirm(parcel.id, 50)).rejects.toMatchObject({ status: 409 });
      expect((await fixture.readParcel(parcel.id)).status).toBe(ParcelStatus.CREATED);
      await assertNoFinancialWrites();
    });

    test('generic payment endpoint also cannot add cash principal to credit', async () => {
      const parcel = await fixture.parcel({ method: PaymentMethod.CREDIT, plannedToBePaidPsw: 0 });
      await expect(
        createPaymentSvc({
          companyId: 'company',
          branchId: 'source',
          parcelId: parcel.id,
          component: PaymentComponent.PRINCIPAL,
          payer: Payer.SENDER,
          cashierType: CashierType.SENDING,
          method: PaymentMethod.CASH,
          cashierUserId: 'cashier-b',
          amountCedis: 50,
        }),
      ).rejects.toMatchObject({ status: 409 });
      await assertNoFinancialWrites();
    });

    test('legacy credit confirmation and retries create no payment or tax', async () => {
      const parcel = await fixture.parcel({ method: PaymentMethod.CREDIT, plannedToBePaidPsw: 0 });
      expect((await confirm(parcel.id, null)).payment).toBeNull();
      expect((await confirm(parcel.id, 0)).statusChanged).toBe(false);
      expect((await fixture.readParcel(parcel.id)).status).toBe(ParcelStatus.PROCESSED);
      await assertNoFinancialWrites();
    });

    test.each(['senderPaymentCedis', 'plannedToBePaidCedis'] as const)(
      'credit booking rejects simultaneous %s',
      async (field) => {
        const body = booking();
        body.parcels[0]![field] = 50;
        await expect(createBookingWithParcelsSvc(body)).rejects.toMatchObject({ status: 400 });
        await assertNoFinancialWrites();
        expect(await db.select().from(customerCreditTransactions)).toEqual([]);
      },
    );
  },
);
