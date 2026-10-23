import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { db, closeSql } from '@/db/config';
import { auditLogs, companies, companyModules, parcels, payments } from '@/db/schemas';
import { eq } from 'drizzle-orm';
import { taxDataRoutes } from '@/server/features/accounting/tax-data';
import { getTaxDataCounts, getTaxDataRecords } from '@/server/features/accounting/tax-data/service';
import {
  confirmTaxDataSelection,
  loadTaxDataSelection,
} from '@/server/features/accounting/tax-data/selection';
import { signAccessToken } from '@/server/utils/jwt';
import { listTaxDataBranchOptionsRepo } from '@/server/features/accounting/tax-data/repository';
import { resolveTaxDataScope } from '@/server/features/accounting/tax-data/scope';
import { createParcelTaxDataFixture, TAX_DATE } from '../utils/parcel-tax-data-fixture';

const enabled = process.env.PARCEL_TAX_DATA_TEST === '1';
const head = resolveTaxDataScope({ sub: 'head', companyId: 'company', branchType: 0 });
const branch = resolveTaxDataScope({
  sub: 'confirmer',
  companyId: 'company',
  branchId: 'accra',
  branchType: 1,
});
const filters = { date: TAX_DATE, confirmation: 'unconfirmed' as const };

describe.skipIf(!enabled)('parcel tax data PostgreSQL integration', () => {
  let fixture: Awaited<ReturnType<typeof createParcelTaxDataFixture>>;
  beforeAll(async () => {
    fixture = await createParcelTaxDataFixture();
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('counts each parcel once with historical principal taxes, including recipient payments', async () => {
    const counts = await getTaxDataCounts(head, filters);
    expect(counts.groups).toEqual([
      { amountPsw: 10000, parcels: 2 },
      { amountPsw: 15000, parcels: 1 },
    ]);
    expect(counts.totals).toMatchObject({
      parcels: 3,
      paidPrincipalPsw: 35000,
      netPsw: 28400,
      vatPsw: 4600,
      getfundPsw: 700,
      nhilPsw: 700,
      covidPsw: 0,
      taxTotalPsw: 6600,
      otherTaxPsw: 600,
    });
    const records = await getTaxDataRecords(branch, { ...filters, branchId: 'kumasi' });
    expect(records.filters.branchId).toBe('accra');
    expect(records.rows.map((row) => row.parcelId)).toEqual(['one', 'two']);
    expect(records.rows[0]).toMatchObject({
      paidPrincipalPsw: 15000,
      paymentCount: 2,
      otherTaxPsw: 200,
    });
    expect(records.rows[0]?.bookingCode).toBe(records.rows[1]?.bookingCode);
  });
  test('filters exact integer amounts and supports confirmed/all views without fees or deleted records', async () => {
    expect(
      (await getTaxDataRecords(head, { ...filters, amountPsw: 15000 })).rows.map(
        (row) => row.parcelId,
      ),
    ).toEqual(['one']);
    expect(
      (await getTaxDataRecords(head, { ...filters, confirmation: 'confirmed' })).rows.map(
        (row) => row.parcelId,
      ),
    ).toEqual(['confirmed']);
    expect((await getTaxDataRecords(head, { ...filters, confirmation: 'all' })).rows).toHaveLength(
      4,
    );
    expect((await getTaxDataRecords(head, filters, 2, 10)).rows).toEqual([]);
  });
  test('filters both route ends while keeping counts independent of the requested amount and cap', async () => {
    const route = { ...filters, branchId: 'accra', destinationBranchId: 'kumasi' };
    const counts = await getTaxDataCounts(head, { ...route, amountPsw: 10000, maxOccurrences: 1 });
    expect(counts.groups).toEqual([{ amountPsw: 15000, parcels: 1 }]);
    expect((await getTaxDataRecords(head, route)).rows.map((row) => row.parcelId)).toEqual(['one']);
    expect(
      (
        await getTaxDataRecords(branch, {
          ...route,
          branchId: 'kumasi',
          destinationBranchId: 'tema',
        })
      ).rows.map((row) => row.parcelId),
    ).toEqual(['two']);
    expect(
      (await getTaxDataCounts(head, { ...route, destinationBranchId: 'foreign' })).groups,
    ).toEqual([]);
    const options = await listTaxDataBranchOptionsRepo(branch);
    expect(options.fromBranches.map((row) => row.id)).toEqual(['accra']);
    expect(options.toBranches.map((row) => row.id)).toContain('tema');
    expect(options.toBranches.map((row) => row.id)).not.toContain('foreign');
  });
  test('caps total occurrences across pages without changing the full amount counts', async () => {
    const query = { ...filters, confirmation: 'all' as const, amountPsw: 10000, maxOccurrences: 2 };
    expect((await getTaxDataCounts(head, query)).groups).toContainEqual({
      amountPsw: 10000,
      parcels: 3,
    });
    const first = await getTaxDataRecords(head, query, 1, 1);
    const second = await getTaxDataRecords(head, query, 2, 1);
    expect(first.rows).toHaveLength(1);
    expect(second.rows).toHaveLength(1);
    expect(first.rows[0]?.parcelId).not.toBe(second.rows[0]?.parcelId);
    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
    const beyond = await getTaxDataRecords(head, query, 3, 1);
    expect(beyond.rows).toEqual([]);
    expect(beyond.hasMore).toBe(false);
    const small = await getTaxDataRecords(head, { ...query, maxOccurrences: 1 }, 1, 100);
    expect(small.rows).toHaveLength(1);
    expect(small.hasMore).toBe(false);
    const all = await getTaxDataRecords(head, { ...query, maxOccurrences: 500 }, 1, 100);
    expect(all.rows).toHaveLength(3);
  });
  test('revalidates selection snapshots, rejects tampering, and has no partial confirmation', async () => {
    const rows = (await getTaxDataRecords(branch, filters)).rows;
    const one = rows[0]!;
    const selected = [{ parcelId: one.parcelId, version: one.version }];
    await expect(
      loadTaxDataSelection(branch, [{ ...selected[0]!, version: '0'.repeat(64) }]),
    ).rejects.toThrow('changed');
    await expect(
      confirmTaxDataSelection(branch, [
        ...selected,
        { parcelId: 'foreign', version: '0'.repeat(64) },
      ]),
    ).rejects.toThrow('no longer available');
    const [saved] = await db.select().from(parcels).where(eq(parcels.id, 'one'));
    expect(saved?.taxReportConfirmation).toBe(false);
    expect(await db.select().from(auditLogs)).toHaveLength(0);
    await db
      .update(payments)
      .set({ netAmountPsw: 8000, taxTotalPsw: 2000 })
      .where(eq(payments.id, 'pay-one-a'));
    await expect(loadTaxDataSelection(branch, selected)).rejects.toThrow('changed');
    await db
      .update(payments)
      .set({ netAmountPsw: 8100, taxTotalPsw: 1900 })
      .where(eq(payments.id, 'pay-one-a'));
    await expect(loadTaxDataSelection(branch, [selected[0]!, selected[0]!])).rejects.toThrow(
      'distinct',
    );
  });
  test('confirms selected parcel IDs atomically and idempotently with one audit event', async () => {
    const row = (await getTaxDataRecords(branch, { ...filters, amountPsw: 15000 })).rows[0]!;
    const selection = [{ parcelId: row.parcelId, version: row.version }];
    expect(await confirmTaxDataSelection(branch, selection)).toMatchObject({
      confirmed: 1,
      alreadyConfirmed: 0,
    });
    expect(await confirmTaxDataSelection(branch, selection)).toMatchObject({
      confirmed: 0,
      alreadyConfirmed: 1,
    });
    expect(await db.select().from(auditLogs)).toHaveLength(1);
    const two = (await getTaxDataRecords(branch, filters)).rows.find(
      (row) => row.parcelId === 'two',
    );
    expect(two?.confirmed).toBe(false);
    expect((await loadTaxDataSelection(branch, selection))[0]?.confirmed).toBe(true);
  });
  test('enforces API authentication, confirmation permission, and the authoritative accounting module', async () => {
    const app = new Elysia()
      .onError(({ error, set }) => {
        set.status = 'status' in error ? Number(error.status) : 500;
        return { message: error instanceof Error ? error.message : String(error) };
      })
      .use(taxDataRoutes);
    const url = `http://localhost/tax-data/records?date=${TAX_DATE}&confirmation=all&branchId=kumasi`;
    expect((await app.handle(new Request(url))).status).toBe(401);
    const token = await signAccessToken({ sub: 'reader' });
    const headers = { authorization: `Bearer ${token}` };
    const result = await app.handle(new Request(url, { headers }));
    expect(result.status).toBe(200);
    const data = await result.json();
    expect(data.filters.branchId).toBe('accra');
    expect(data.rows.some((row: { parcelId: string }) => row.parcelId === 'other-branch')).toBe(
      false,
    );
    const body = JSON.stringify({
      rows: [{ parcelId: data.rows[0].parcelId, version: data.rows[0].version }],
    });
    const deniedConfirm = await app.handle(
      new Request('http://localhost/tax-data/confirm', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body,
      }),
    );
    expect(deniedConfirm.status).toBe(403);
    const exported = await app.handle(
      new Request('http://localhost/tax-data/export', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body,
      }),
    );
    expect(exported.status).toBe(200);
    expect(exported.headers.get('content-type')).toContain('spreadsheetml');
    expect(new Uint8Array(await exported.arrayBuffer()).slice(0, 2)).toEqual(
      new Uint8Array([80, 75]),
    );
    const deniedToken = await signAccessToken({ sub: 'denied' });
    expect(
      (await app.handle(new Request(url, { headers: { authorization: `Bearer ${deniedToken}` } })))
        .status,
    ).toBe(403);
    await db
      .update(companyModules)
      .set({ isEnabled: false })
      .where(eq(companyModules.companyId, 'company'));
    expect((await app.handle(new Request(url, { headers }))).status).toBe(403);
    await db
      .update(companyModules)
      .set({ isEnabled: true })
      .where(eq(companyModules.companyId, 'company'));
    await db.update(companies).set({ useAccounting: false }).where(eq(companies.id, 'company'));
    // Explicit module state is authoritative when the legacy company flag drifts.
    expect((await app.handle(new Request(url, { headers }))).status).toBe(200);
  });
});
