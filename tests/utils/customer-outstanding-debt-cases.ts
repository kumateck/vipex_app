import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { customerCreditAllocations, customerCreditTransactions } from '@/db/schemas';
import { postCustomerCreditPaymentSvc } from '@/server/features/customers/credit-settlement';

type CreditRequest = (
  path: string,
  method: string,
  body?: unknown,
  user?: string,
) => Promise<Response>;

const path = 'customers/customer/credit/outstanding-statement';
const scope = { companyId: 'company', customerId: 'customer' };

export function registerOutstandingDebtCases(request: CreditRequest) {
  test('statement lists every open parcel by its original creation time with a customer balance', async () => {
    await sql`update parcels set created_at = '2022-01-02 07:08:00' where id = 'parcel-b'`;
    await sql`update parcels set created_at = '2025-03-04 09:10:00' where id = 'parcel-a'`;
    await db.insert(customerCreditTransactions).values({
      id: 'delivery-charge',
      ...scope,
      signedAmountPsw: 1000,
      sourceType: 1,
      transactionType: 0,
      referenceId: 'parcel-a',
      createdBy: 'accounts',
    });

    const response = await request(path, 'GET');
    expect(response.status).toBe(200);
    const statement = await response.json();
    expect(statement).toMatchObject({
      parcels: [
        {
          parcelId: 'parcel-b',
          bookingCode: 'BOOK-parcel-b',
          trackingCode: 'TRACK-parcel-b',
          parcelDetails: 'Box',
          parcelContent: 'Clothes',
          createdAt: '2022-01-02T07:08:00.000Z',
          outstandingAmountPsw: 2500,
        },
        { parcelId: 'parcel-a', outstandingAmountPsw: 6000 },
      ],
      summary: {
        parcelCount: 2,
        oldestParcelCreatedAt: '2022-01-02T07:08:00.000Z',
        parcelOutstandingPsw: 8500,
        otherCreditActivityPsw: 0,
        accountBalancePsw: 8500,
      },
    });
    expect(Number.isFinite(Date.parse(statement.generatedAt))).toBeTrue();

    const settlement = await request('customers/customer/credit/parcels', 'GET');
    expect((await settlement.json())[0]).not.toHaveProperty('parcelContent');
  });

  test('partial allocations and unallocated payments reduce the statement balance once', async () => {
    await db.insert(customerCreditTransactions).values({
      id: 'previous-payment',
      ...scope,
      signedAmountPsw: -1500,
      sourceType: 2,
      transactionType: 1,
      createdBy: 'accounts',
    });
    await db.insert(customerCreditAllocations).values({
      ...scope,
      chargeTransactionId: 'charge-parcel-a',
      paymentTransactionId: 'previous-payment',
      amountPsw: 1000,
      createdBy: 'accounts',
    });

    expect(await (await request(path, 'GET')).json()).toMatchObject({
      summary: {
        parcelOutstandingPsw: 6500,
        otherCreditActivityPsw: -500,
        accountBalancePsw: 6000,
      },
    });
  });

  test('settled parcels leave the statement and zero debt has no oldest parcel', async () => {
    await postCustomerCreditPaymentSvc({
      ...scope,
      parcelIds: ['parcel-a', 'parcel-b'],
      amountCedis: 75,
      createdBy: 'accounts',
    });
    expect(await (await request(path, 'GET')).json()).toMatchObject({
      parcels: [],
      summary: {
        parcelCount: 0,
        oldestParcelCreatedAt: null,
        parcelOutstandingPsw: 0,
        accountBalancePsw: 0,
      },
    });
  });

  test('statement rejects customers outside the company and users without customer read access', async () => {
    expect((await request('customers/foreign/credit/outstanding-statement', 'GET')).status).toBe(
      404,
    );
    expect((await request(path, 'GET', undefined, 'viewer')).status).toBe(403);
  });
}
