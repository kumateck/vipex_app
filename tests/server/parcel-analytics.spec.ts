import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { parcelAnalyticsRoutes } from '@/server/features/reporting/parcel-analytics';
import { signAccessToken } from '@/server/utils/jwt';
import { db, closeSql } from '@/db/config';
import {
  branches,
  parcels,
  customerCreditTransactions,
  users,
  rolePermissions,
} from '@/db/schemas';
import {
  ParcelStatus,
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  BranchType,
} from '@/db/schemas/enums';
import { createIsolatedSchemaFixture } from '../utils/isolated-schema-fixture';
import {
  getParcelAnalyticsGroups,
  countPreviousParcelAnalytics,
  listParcelAnalyticsBranches,
} from '@/server/features/reporting/parcel-analytics/repository';
import { getParcelAnalyticsDetails } from '@/server/features/reporting/parcel-analytics/details';
import { buildParcelAnalyticsReport } from '@/server/features/reporting/parcel-analytics/aggregation';
import { resolveParcelAnalyticsScope } from '@/server/features/reporting/parcel-analytics/scope';
import type { AnalyticsScope } from '@/server/features/reporting/parcel-analytics/types';

const enabled = process.env.PARCEL_ANALYTICS_TEST === '1';
const scope: AnalyticsScope = {
  companyId: 'company',
  basis: 'source',
  from: '2026-10-22',
  to: '2026-10-22',
};
const now = new Date('2026-10-22T16:00:00Z');

describe.skipIf(!enabled)('parcel analytics PostgreSQL integration', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedSchemaFixture>>;
  beforeAll(async () => {
    fixture = await createIsolatedSchemaFixture('vipex_parcel_analytics_test');
    await db.insert(branches).values([
      { id: 'accra', companyId: 'company', name: 'Accra', createdBy: 'test' },
      { id: 'kumasi', companyId: 'company', name: 'Kumasi', createdBy: 'test' },
      { id: 'foreign', companyId: 'foreign-company', name: 'Foreign branch', createdBy: 'test' },
    ]);
    await db.insert(users).values(
      ['staff', 'denied'].map((id) => ({
        id,
        fullname: id,
        email: `${id}@example.test`,
        telephone: '0240000000',
        companyId: 'company',
        branchId: 'accra',
        roleId: id,
        createdBy: 'test',
      })),
    );
    await db.insert(rolePermissions).values({
      roleId: 'staff',
      companyId: 'company',
      permission: 'CanViewReportParcelsStatusSummary',
    });
    const base = {
      companyId: 'company',
      sourceId: 'accra',
      destinationId: 'kumasi',
      bookingId: 'booking',
      senderId: 'sender',
      receiverId: 'receiver',
      parcelDetails: 'Box',
      parcelContent: 'Clothes',
      chargePsw: 1000,
      plannedToBePaidPsw: 500,
      createdAt: new Date('2026-10-22T00:00:00Z'),
      status: ParcelStatus.CREATED,
    };
    const rows = [
      {
        ...base,
        id: 'waiting',
        status: ParcelStatus.AWAITING_PICKUP,
        createdAt: new Date('2026-10-22T01:00:00Z'),
        receivedAt: new Date('2026-10-22T04:00:00Z'),
      },
      {
        ...base,
        id: 'delivered',
        status: ParcelStatus.DELIVERED_BY_OFFICE,
        sourceId: 'kumasi',
        destinationId: 'accra',
      },
      { ...base, id: 'deleted', isDeleted: true },
      { ...base, id: 'foreign', companyId: 'foreign-company', sourceId: 'foreign' },
      { ...base, id: 'previous', createdAt: new Date('2026-10-21T23:59:59Z') },
      { ...base, id: 'next-day', createdAt: new Date('2026-10-23T00:00:00Z') },
      { ...base, id: 'same-branch', destinationId: 'accra' },
    ];
    await db
      .insert(parcels)
      .values(rows.map((row) => ({ ...row, bookingCode: row.id, trackingCode: row.id })));
    await db.insert(customerCreditTransactions).values([
      {
        companyId: 'company',
        customerId: 'receiver',
        referenceId: 'waiting',
        sourceType: CustomerCreditSourceType.DELIVERY,
        transactionType: CustomerCreditTransactionType.CHARGE,
        signedAmountPsw: 200,
        notes: 'Delivery principal',
        createdBy: 'test',
      },
      {
        companyId: 'company',
        customerId: 'receiver',
        referenceId: 'waiting',
        sourceType: CustomerCreditSourceType.DELIVERY,
        transactionType: CustomerCreditTransactionType.CHARGE,
        signedAmountPsw: 9999,
        notes: 'Storage fee',
        createdBy: 'test',
      },
    ]);
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('aggregates only the authenticated company and includes full booking day', async () => {
    const [groups, options, previous] = await Promise.all([
      getParcelAnalyticsGroups(scope, now),
      listParcelAnalyticsBranches(scope),
      countPreviousParcelAnalytics(scope),
    ]);
    const report = buildParcelAnalyticsReport(groups, scope, options, previous, now);
    expect(report.totals).toMatchObject({
      parcels: 3,
      delivered: 1,
      chargePsw: 3000,
      receiverOutstandingPsw: 1300,
    });
    expect(report.previousParcels).toBe(1);
    expect(report.volumeGrowthPct).toBe(200);
    expect(report.totals.averageBookingToReceiptHours).toBe(3);
    expect(report.aging[0]?.parcels).toBe(1);
    expect(report.branchOptions.map((row) => row.id)).toEqual(['accra', 'kumasi']);
    expect(report.branches.reduce((sum, row) => sum + row.parcels, 0)).toBe(3);
  });
  test('enforces branch overrides on incoming and outgoing drill-downs', async () => {
    for (const basis of ['source', 'destination'] as const) {
      const locked = resolveParcelAnalyticsScope(
        { companyId: 'company', branchId: 'accra', branchType: BranchType.AGENCY },
        { ...scope, branchId: 'kumasi', basis },
      );
      const details = await getParcelAnalyticsDetails(locked);
      expect(details.rows.map((row) => row.id).sort()).toEqual(
        basis === 'source' ? ['same-branch', 'waiting'] : ['delivered', 'same-branch'],
      );
      expect(await listParcelAnalyticsBranches(locked)).toEqual([{ id: 'accra', name: 'Accra' }]);
    }
  });
  test('uses the same status and route filters for summaries and drill-down', async () => {
    const filtered = {
      ...scope,
      sourceId: 'accra',
      destinationId: 'kumasi',
      status: ParcelStatus.AWAITING_PICKUP,
    };
    const groups = await getParcelAnalyticsGroups(filtered, now);
    const details = await getParcelAnalyticsDetails(filtered);
    expect(groups.reduce((sum, row) => sum + Number(row.parcels), 0)).toBe(1);
    expect(details.rows.map((row) => row.id)).toEqual(['waiting']);
    expect(details.rows[0]?.receiverOutstandingPsw).toBe(300);
    expect(details.hasMore).toBe(false);
  });
  test('rejects fractional pages and returns an empty later page', async () => {
    await expect(getParcelAnalyticsDetails(scope, 1.5)).rejects.toThrow('Invalid analytics page');
    expect((await getParcelAnalyticsDetails(scope, 2)).rows).toEqual([]);
  });
  test('paginates 52 parcels without duplicates or omitted rows', async () => {
    await db.insert(parcels).values(
      Array.from({ length: 52 }, (_, index) => ({
        id: `paged-${index}`,
        companyId: 'company',
        sourceId: 'accra',
        destinationId: 'kumasi',
        bookingId: 'booking',
        bookingCode: `PAGE-${index}`,
        trackingCode: `PAGE-${index}`,
        senderId: 'sender',
        receiverId: 'receiver',
        parcelDetails: 'Box',
        parcelContent: 'Books',
        createdAt: new Date('2026-10-10T10:00:00Z'),
      })),
    );
    const selected = { ...scope, from: '2026-10-10', to: '2026-10-10' };
    const first = await getParcelAnalyticsDetails(selected, 1);
    const second = await getParcelAnalyticsDetails(selected, 2);
    expect(first.rows).toHaveLength(50);
    expect(first.hasMore).toBe(true);
    expect(second.rows).toHaveLength(2);
    expect(second.hasMore).toBe(false);
    expect(new Set([...first.rows, ...second.rows].map((row) => row.id)).size).toBe(52);
  });

  test('API rejects missing auth/permission and overrides branch tampering on both endpoints', async () => {
    const app = new Elysia()
      .onError(({ error, set }) => {
        set.status = 'status' in error ? Number(error.status) : 500;
        return { message: error instanceof Error ? error.message : String(error) };
      })
      .use(parcelAnalyticsRoutes);
    const endpoint = 'http://localhost/parcel-analytics';
    const query = '?from=2026-10-22&to=2026-10-22&basis=source&branchId=kumasi';
    expect((await app.handle(new Request(endpoint + query))).status).toBe(401);
    const deniedToken = await signAccessToken({ sub: 'denied' });
    expect(
      (
        await app.handle(
          new Request(endpoint + query, { headers: { authorization: `Bearer ${deniedToken}` } }),
        )
      ).status,
    ).toBe(403);
    const staffToken = await signAccessToken({ sub: 'staff' });
    const headers = { authorization: `Bearer ${staffToken}` };
    const summaryResponse = await app.handle(new Request(endpoint + query, { headers }));
    expect(summaryResponse.status).toBe(200);
    const report = await summaryResponse.json();
    expect(report.filters.branchId).toBe('accra');
    expect(report.totals.parcels).toBe(2);
    const detailsResponse = await app.handle(
      new Request(endpoint + '/details' + query, { headers }),
    );
    expect(detailsResponse.status).toBe(200);
    expect((await detailsResponse.json()).rows.map((row: { id: string }) => row.id).sort()).toEqual(
      ['same-branch', 'waiting'],
    );
  });
});
