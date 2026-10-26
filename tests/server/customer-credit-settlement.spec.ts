import { registerCreditApiCases } from '../utils/customer-credit-api-cases';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db, sql, closeSql } from '@/db/config';
import {
  auditLogs,
  customerCreditAllocations,
  customerCreditTransactions,
  customers,
  parcels,
} from '@/db/schemas';
import {
  listCreditParcelsSvc,
  postCustomerCreditPaymentSvc,
  updateCreditParcelChargeSvc,
} from '@/server/features/customers/credit-settlement';
import {
  listCustomerOpenCreditChargesRepo,
  listCustomersRepo,
} from '@/server/features/customers/repository';
import { listCustomerWalletAccountsRepo } from '@/server/features/customer-wallet-credit/repository';
import { buildStickerPaymentQuery } from '@/server/features/shipments/parcel-sticker-payment.repository';
import { customersRoutes } from '@/server/features/customers/routes';
import { customerWalletCreditRoutes } from '@/server/features/customer-wallet-credit/routes';
import { parcelCreditChargeRoutes } from '@/server/features/shipments/parcel-credit-charge.routes';
import { errorHandler } from '@/server/middlewares/error-handler';
import { signAccessToken } from '@/server/utils/jwt';
import { createCustomerCreditFixture } from '../utils/customer-credit-fixture';

const enabled = process.env.CUSTOMER_CREDIT_TEST === '1';
describe.skipIf(!enabled)('exact parcel debt settlement on isolated PostgreSQL', () => {
  let fixture: Awaited<ReturnType<typeof createCustomerCreditFixture>>;
  const scope = { companyId: 'company', customerId: 'customer' };
  const pay = (parcelIds = ['parcel-a'], amountCedis: number | string = 50) =>
    postCustomerCreditPaymentSvc({ ...scope, createdBy: 'accounts', parcelIds, amountCedis });
  const update = (chargeCedis: string | number = 60, expectedChargePsw = 5000) =>
    updateCreditParcelChargeSvc({
      companyId: 'company',
      parcelId: 'parcel-a',
      actorUserId: 'accounts',
      chargeCedis,
      expectedChargePsw,
      reason: 'Correct agreed charge',
    });
  const app = new Elysia()
    .use(errorHandler)
    .group('/v1/customers', (routes) => routes.use(customersRoutes))
    .group('/v1/customer-wallet-credit', (routes) => routes.use(customerWalletCreditRoutes))
    .group('/v1/parcels', (routes) => routes.use(parcelCreditChargeRoutes));
  const request = async (path: string, method: string, body?: unknown, user = 'accounts') => {
    const token = await signAccessToken({
      sub: user,
      email: `${user}@example.test`,
      companyId: 'company',
      roleId: user,
    });
    return app.handle(
      new Request(`http://localhost/v1/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  };
  beforeAll(async () => {
    fixture = await createCustomerCreditFixture();
  });
  beforeEach(async () => {
    await fixture.reset();
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('lists booking codes and pays only selected parcels in full', async () => {
    expect((await listCreditParcelsSvc(scope)).map((row) => row.bookingCode)).toContain(
      'BOOK-parcel-a',
    );
    const payment = await pay();
    expect(payment).toMatchObject({
      allocatedAmountPsw: 5000,
      unallocatedAmountPsw: 0,
      allocations: [{ chargeTransactionId: 'charge-parcel-a', amountPsw: 5000 }],
    });
    expect((await listCreditParcelsSvc(scope)).map((row) => row.parcelId)).toEqual(['parcel-b']);
    expect(
      await sql`select sum(signed_amount_psw)::int as balance from customer_credit_transactions where customer_id = 'customer'`,
    ).toMatchObject([{ balance: 2500 }]);
  });
  test('settles a sum of parcels', async () => {
    expect((await pay(['parcel-a', 'parcel-b'], '75.00')).allocations).toHaveLength(2);
    expect(await listCreditParcelsSvc(scope)).toEqual([]);
  });
  test('rejects underpayment, excess and fractional pesewas with no writes', async () => {
    for (const value of [0, -1, 49.99, 50.01, '50.001', 'NaN', 'Infinity'])
      await expect(pay(['parcel-a'], value)).rejects.toBeDefined();
    expect(await db.select().from(customerCreditAllocations)).toHaveLength(0);
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(3);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
  });
  test('requires distinct owned payable parcels', async () => {
    for (const ids of [[], ['parcel-a', 'parcel-a'], ['parcel-other'], ['missing']])
      await expect(pay(ids)).rejects.toBeDefined();
    await expect(
      postCustomerCreditPaymentSvc({
        companyId: 'other',
        customerId: 'customer',
        createdBy: 'accounts',
        parcelIds: ['parcel-a'],
        amountCedis: 50,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(listCreditParcelsSvc({ ...scope, customerId: 'foreign' })).rejects.toMatchObject({
      status: 404,
    });
  });
  test('retries cannot pay a settled parcel twice', async () => {
    await pay();
    await expect(pay()).rejects.toMatchObject({ status: 409 });
    expect(await db.select().from(customerCreditAllocations)).toHaveLength(1);
  });
  test('simultaneous requests allocate once', async () => {
    const results = await Promise.allSettled([pay(), pay()]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.select().from(customerCreditAllocations)).toHaveLength(1);
  });
  test('does not collect again while an older payment has unallocated credit', async () => {
    await db.insert(customerCreditTransactions).values({
      id: 'unallocated-payment',
      ...scope,
      signedAmountPsw: -1000,
      sourceType: 2,
      transactionType: 1,
      createdBy: 'accounts',
    });
    await expect(pay()).rejects.toMatchObject({ status: 409 });
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(4);
    expect(await db.select().from(customerCreditAllocations)).toHaveLength(0);
  });
  test('fully clears the remaining debt of a legacy partially allocated parcel', async () => {
    await db.insert(customerCreditTransactions).values({
      id: 'old-payment',
      ...scope,
      signedAmountPsw: -1000,
      sourceType: 2,
      transactionType: 1,
      createdBy: 'accounts',
    });
    await db.insert(customerCreditAllocations).values({
      ...scope,
      chargeTransactionId: 'charge-parcel-a',
      paymentTransactionId: 'old-payment',
      amountPsw: 1000,
      createdBy: 'accounts',
    });
    await expect(pay(['parcel-a'], 30)).rejects.toMatchObject({ status: 400 });
    await pay(['parcel-a'], 40);
    expect((await listCreditParcelsSvc(scope)).map((row) => row.parcelId)).toEqual(['parcel-b']);
  });
  test('one parcel selection includes all of that customer’s parcel and delivery debts', async () => {
    await db.insert(customerCreditTransactions).values({
      id: 'delivery-charge',
      ...scope,
      signedAmountPsw: 1000,
      sourceType: 1,
      transactionType: 0,
      referenceId: 'parcel-a',
      createdBy: 'accounts',
    });
    await expect(pay()).rejects.toMatchObject({ status: 400 });
    expect((await pay(['parcel-a'], 60)).allocations).toHaveLength(2);
  });
  test('charge updates append adjustments and keep all outstanding views consistent', async () => {
    await update();
    const [original] = await db
      .select()
      .from(customerCreditTransactions)
      .where(eq(customerCreditTransactions.id, 'charge-parcel-a'));
    expect(original!.signedAmountPsw).toBe(5000);
    expect(
      (await listCreditParcelsSvc(scope)).find((row) => row.parcelId === 'parcel-a')!
        .outstandingAmountPsw,
    ).toBe(6000);
    expect(
      (await listCustomerOpenCreditChargesRepo(scope)).find(
        (row) => row.referenceId === 'parcel-a',
      )!.outstandingAmountPsw,
    ).toBe(6000);
    const wallet = await listCustomerWalletAccountsRepo({
      companyId: 'company',
      limit: 30,
      offset: 0,
    });
    expect(wallet.data[0]).toMatchObject({ balancePsw: 8500, outstandingPsw: 8500 });
    const [sticker] = await buildStickerPaymentQuery('company', 'TRACK-parcel-a', 'BOOK-parcel-a');
    expect(sticker).toMatchObject({ chargePsw: 6000, creditPsw: 6000 });
    await expect(pay()).rejects.toMatchObject({ status: 400 });
    await pay(['parcel-a'], 60);
  });
  test('supports repeated increases and reductions without changing original ledger rows', async () => {
    await update();
    await update(30, 6000);
    expect(
      (await listCreditParcelsSvc(scope)).find((row) => row.parcelId === 'parcel-a')!
        .outstandingAmountPsw,
    ).toBe(3000);
    await pay(['parcel-a'], 30);
  });
  test('blocks settled, stale, zero, noncredit and over-limit charge changes', async () => {
    for (const amount of [0, -1, '0.001', '60.001', 100001])
      await expect(update(amount)).rejects.toMatchObject({ status: 400 });
    await expect(update(60, 4900)).rejects.toMatchObject({ status: 409 });
    await db.update(customers).set({ creditLimitPsw: 8000 }).where(eq(customers.id, 'customer'));
    await expect(update()).rejects.toMatchObject({ status: 409 });
    await pay();
    await expect(update()).rejects.toMatchObject({ status: 409 });
    await fixture.reset();
    await db.update(parcels).set({ method: 0 }).where(eq(parcels.id, 'parcel-a'));
    await expect(update()).rejects.toMatchObject({ status: 409 });
  });
  test('payment racing a charge edit produces a consistent final balance', async () => {
    await Promise.allSettled([pay(), update()]);
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, 'parcel-a'));
    const allocations = await db.select().from(customerCreditAllocations);
    if (allocations.length) expect(parcel!.chargePsw).toBe(5000);
    else
      expect(
        (await listCreditParcelsSvc(scope)).find((row) => row.parcelId === 'parcel-a')!
          .outstandingAmountPsw,
      ).toBe(6000);
  });
  test('failed audit insert rolls back the entire settlement', async () => {
    await sql.unsafe(
      `CREATE FUNCTION reject_credit_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test audit unavailable'; END $$`,
    );
    await sql.unsafe(
      'CREATE TRIGGER reject_credit_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_credit_audit()',
    );
    try {
      await expect(pay()).rejects.toBeDefined();
    } finally {
      await sql.unsafe('DROP TRIGGER reject_credit_audit ON audit_logs');
      await sql.unsafe('DROP FUNCTION reject_credit_audit()');
    }
    expect(await db.select().from(customerCreditTransactions)).toHaveLength(3);
    expect(await db.select().from(customerCreditAllocations)).toHaveLength(0);
  });
  test('customer tabs filter the whole dataset before pagination', async () => {
    expect(
      (
        await listCustomersRepo({ companyId: 'company', customerType: 0, limit: 30, offset: 0 })
      ).data.map((row) => row.id),
    ).toEqual(['individual']);
    expect(
      (
        await listCustomersRepo({ companyId: 'company', customerType: 1, limit: 30, offset: 0 })
      ).data.map((row) => row.id),
    ).toEqual(['customer']);
  });
  registerCreditApiCases(app, request);
});
