import {
  exemptionBooking as booking,
  createExemptParcel as create,
  expectExemptionGuard as failsQuery,
} from '../utils/customer-charge-exemption-cases';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { closeSql, db, sql } from '@/db/config';
import {
  bookings,
  parcels,
  payments,
  deliveries,
  customers,
  employees,
  customerCreditTransactions,
  selfServiceBookingDrafts,
} from '@/db/schemas';
import { createBookingWithParcelsSvc } from '@/server/features/shipments/booking-with-parcels.service';
import {
  getParcelStorageSettlementSvc,
  listParcelsSvc,
} from '@/server/features/shipments/parcels.service';
import { assertParcelFullyPaid } from '@/server/features/shipments/parcel-payment-settlement';
import { createPaymentSvc } from '@/server/features/payments/service';
import { createCustomerSvc } from '@/server/features/customers/service';
import { listReceivingStaffOptions } from '@/server/features/shipments/charge-exemption';
import { completeSelfServiceDraftSvc } from '@/server/features/self-service/drafts.service';
import { createChargeExemptionFixture } from '../utils/customer-charge-exemption-fixture';

describe.skipIf(!process.env.CHARGE_EXEMPTION_TEST)('customer charge exemption lifecycle', () => {
  let fixture: Awaited<ReturnType<typeof createChargeExemptionFixture>>;
  beforeAll(async () => {
    fixture = await createChargeExemptionFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  for (const side of ['sender', 'receiver'] as const)
    for (const type of [2, 3, 4, 5]) {
      test(`${side} type ${type} books with zero charge and no payment step`, async () => {
        const input = booking(type, side);
        input.requireActiveCashierSession = true; // No money changes hands; no cashier session needed.
        const result = await createBookingWithParcelsSvc(input);
        const [parcel] = await db
          .select()
          .from(parcels)
          .where(eq(parcels.id, result.parcels[0]!.id));
        expect(parcel).toMatchObject({
          chargeExemptCustomerType: type,
          chargePsw: 0,
          plannedToBePaidPsw: 0,
          status: 1,
          relatedStaffId: type === 5 ? 'ama' : null,
          relatedStaffNameSnapshot: type === 5 ? 'Ama Mensah' : null,
        });
        expect(result.payments).toHaveLength(0);
        expect((await assertParcelFullyPaid(parcel!.id)).outstandingPsw).toBe(0);
      });
    }

  test('ordinary prices remain required and exempt prices, balances, payments and credit are rejected', async () => {
    for (const patch of [
      { chargeCedis: 1 },
      { plannedToBePaidCedis: 1 },
      { senderPaymentCedis: 1 },
      { method: 4 },
    ]) {
      const input = booking(2);
      Object.assign(input.parcels[0]!, patch);
      await expect(createBookingWithParcelsSvc(input)).rejects.toThrow();
    }
    const ordinary = booking(0);
    ordinary.parcels[0]!.chargeCedis = 0;
    await expect(createBookingWithParcelsSvc(ordinary)).rejects.toThrow('at least');
    const other = booking(2);
    other.parcels[0]!.receiverId = 'other-company';
    await expect(createBookingWithParcelsSvc(other)).rejects.toThrow('not found');
    expect((await createBookingWithParcelsSvc(booking(0))).parcels).toHaveLength(1);
  });

  test('only Staff requires an active destination employee, including employees without accounts', async () => {
    expect(await listReceivingStaffOptions('company', 'destination')).toEqual([
      { id: 'ama', fullname: 'Ama Mensah', employeeNumber: 'ama' },
    ]);
    for (const relatedStaffId of [
      undefined,
      'missing',
      'inactive',
      'wrong-branch',
      'wrong-company',
    ]) {
      const input = booking(5);
      input.parcels[0]!.relatedStaffId = relatedStaffId;
      const before = (await db.select().from(bookings)).length;
      await expect(createBookingWithParcelsSvc(input)).rejects.toThrow();
      expect((await db.select().from(bookings)).length).toBe(before);
    }
    const family = booking(2);
    family.parcels[0]!.relatedStaffId = 'ama';
    await expect(createBookingWithParcelsSvc(family)).rejects.toThrow('only allowed');
  });

  test('storage never accrues, even after years and after the customer type changes', async () => {
    const id = await create(3);
    await db
      .update(parcels)
      .set({ status: 5, receivedAt: new Date('2020-01-01') })
      .where(eq(parcels.id, id));
    await db.update(customers).set({ customerType: 0 }).where(eq(customers.id, 'customer-3'));
    expect(await getParcelStorageSettlementSvc(id)).toMatchObject({
      accruedPsw: 0,
      outstandingPsw: 0,
    });
    const all = await listParcelsSvc({ companyId: 'company', parcelId: id, limit: 10, offset: 0 });
    expect(all.data[0]).toMatchObject({
      chargeExemptCustomerType: 3,
      storageChargePsw: 0,
      storageChargeDays: 0,
    });
    expect(
      (
        await listParcelsSvc({
          companyId: 'company',
          parcelId: id,
          storageChargeAccruing: true,
          limit: 10,
          offset: 0,
        })
      ).totalRecords,
    ).toBe(0);
    expect(
      (
        await listParcelsSvc({
          companyId: 'company',
          parcelId: id,
          cashierCollectionRequired: true,
          limit: 10,
          offset: 0,
        })
      ).totalRecords,
    ).toBe(0);
    await db.update(customers).set({ customerType: 3 }).where(eq(customers.id, 'customer-3'));
  });

  test('all payment components and direct database fee and credit mutations are protected', async () => {
    const id = await create();
    for (const component of [0, 1, 2])
      await expect(
        createPaymentSvc({
          companyId: 'company',
          branchId: 'source',
          parcelId: id,
          component,
          payer: 0,
          cashierType: 0,
          method: 0,
          cashierUserId: 'officer',
          amountCedis: 1,
        }),
      ).rejects.toThrow('exempt');
    await failsQuery(() => db.update(parcels).set({ chargePsw: 1 }).where(eq(parcels.id, id)));
    await failsQuery(() =>
      db.update(parcels).set({ plannedToBePaidPsw: 1 }).where(eq(parcels.id, id)),
    );
    await failsQuery(() =>
      db.update(parcels).set({ chargeExemptCustomerType: null }).where(eq(parcels.id, id)),
    );
    await failsQuery(() =>
      db.insert(deliveries).values({ parcelId: id, mode: 1, chargePsw: 1, createdBy: 'officer' }),
    );
    await failsQuery(() =>
      db.insert(customerCreditTransactions).values({
        companyId: 'company',
        customerId: 'customer-0',
        sourceType: 0,
        transactionType: 0,
        referenceId: id,
        signedAmountPsw: 1,
        createdBy: 'officer',
      }),
    );
    await failsQuery(() =>
      db.insert(payments).values({
        companyId: 'company',
        branchId: 'source',
        parcelId: id,
        component: 2,
        payer: 0,
        cashierType: 0,
        method: 0,
        cashierUserId: 'officer',
        grossAmountPsw: 1,
        netAmountPsw: 1,
        vatPsw: 0,
        getfundPsw: 0,
        nhilPsw: 0,
        covidPsw: 0,
        taxTotalPsw: 0,
      }),
    );
    expect(await db.select().from(payments)).toHaveLength(0);
  });

  test('receiving staff name remains recorded after employee rename', async () => {
    const id = await create(5);
    await db.update(employees).set({ displayName: 'Ama Updated' }).where(eq(employees.id, 'ama'));
    const rows = await listParcelsSvc({
      companyId: 'company',
      search: 'Ama Mensah',
      limit: 100,
      offset: 0,
    });
    expect(rows.data.find((row) => row.id === id)?.relatedStaffNameSnapshot).toBe('Ama Mensah');
    await db.update(employees).set({ displayName: 'Ama Mensah' }).where(eq(employees.id, 'ama'));
  });

  test('exempt customer types can only be created in Customer Management', async () => {
    for (const customerType of [2, 3, 4, 5]) {
      await expect(
        createCustomerSvc({
          companyId: 'company',
          fullname: 'Exempt',
          customerType,
          createdBy: 'officer',
        }),
      ).rejects.toThrow('Customer Management');
      const created = await createCustomerSvc({
        companyId: 'company',
        fullname: `CRM ${customerType}`,
        customerType,
        sourceContext: 'crm',
        createdBy: 'officer',
      });
      const [customer] = await db.select().from(customers).where(eq(customers.id, created.id));
      expect(customer?.customerType).toBe(customerType);
    }
  });

  test('self-service Staff completion records the named receiver with no charge', async () => {
    const [draft] = await db
      .insert(selfServiceBookingDrafts)
      .values({
        companyId: 'company',
        branchId: 'source',
        senderFullname: 'Sender',
        senderPhone: '0240000000',
        senderCustomerId: 'customer-0',
        receiverFullname: 'Office',
        receiverPhone: '0240000005',
        receiverCustomerId: 'customer-5',
        parcelContent: 'Clothes',
        expiresAt: new Date(Date.now() + 60000),
      })
      .returning();
    const created = await completeSelfServiceDraftSvc(
      draft!.id,
      {
        destinationId: 'destination',
        parcelDetails: 'One box',
        chargeCedis: 0,
        paymentResponsibility: 'SENDER',
        senderSettlementMode: 'PAY_NOW',
        relatedStaffId: 'ama',
      },
      { sub: 'officer', email: 'officer@test.local', companyId: 'company', branchId: 'source' },
    );
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, created.parcels[0]!.id));
    expect(parcel).toMatchObject({
      chargeExemptCustomerType: 5,
      relatedStaffId: 'ama',
      chargePsw: 0,
    });
  });

  test('migration can be rerun without changing recorded parcel exemptions', async () => {
    const id = await create();
    await sql.begin(async (tx) => {
      await tx.unsafe(await Bun.file('drizzle/0092_customer_charge_exemptions.sql').text());
    });
    expect(
      (await db.select().from(parcels).where(eq(parcels.id, id)))[0]?.chargeExemptCustomerType,
    ).toBe(2);
  });
});
