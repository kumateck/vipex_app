import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { ParcelStatus } from '@/db/schemas/enums';
import type { AnalyticsGroup, AnalyticsScope } from './types';
import { parcelAnalyticsWhere, parcelAnalyticsCohort, receiverOutstandingSql } from './query';

export async function getParcelAnalyticsGroups(scope: AnalyticsScope, now: Date) {
  const branchColumn = scope.basis === 'source' ? sql`pr.source_id` : sql`pr.destination_id`;
  const waiting = sql`pr.status IN (${ParcelStatus.ARRIVED_AT_DESTINATION},
    ${ParcelStatus.CUSTOMER_CONTACTED}, ${ParcelStatus.AWAITING_PICKUP}) AND pr.received_at IS NOT NULL`;
  const age = sql`GREATEST(EXTRACT(EPOCH FROM (${now.toISOString()}::timestamp - pr.received_at)) / 86400, 0)`;
  const rows = await db.execute(sql`
    ${parcelAnalyticsCohort(scope)}
    SELECT ${branchColumn} AS "branchId", to_char(pr.created_at, 'YYYY-MM-DD') AS day,
      pr.status, COUNT(*)::int AS parcels, SUM(pr.charge_psw)::bigint AS "chargePsw",
      SUM(${receiverOutstandingSql})::bigint AS "receiverOutstandingPsw",
      SUM(GREATEST(EXTRACT(EPOCH FROM (${now.toISOString()}::timestamp - pr.created_at)) / 86400, 0)) AS "ageDaysSum",
      COALESCE(SUM(EXTRACT(EPOCH FROM (pr.received_at - pr.created_at)) / 3600)
        FILTER (WHERE pr.received_at >= pr.created_at), 0) AS "receiptHoursSum",
      COUNT(*) FILTER (WHERE pr.received_at >= pr.created_at)::int AS "receiptSamples",
      COUNT(*) FILTER (WHERE ${waiting} AND ${age} >= 7)::int AS "uncollected7Days",
      COUNT(*) FILTER (WHERE ${waiting} AND ${age} < 4)::int AS "age0To3",
      COUNT(*) FILTER (WHERE ${waiting} AND ${age} >= 4 AND ${age} < 8)::int AS "age4To7",
      COUNT(*) FILTER (WHERE ${waiting} AND ${age} >= 8 AND ${age} < 15)::int AS "age8To14",
      COUNT(*) FILTER (WHERE ${waiting} AND ${age} >= 15)::int AS "age15Plus"
    FROM target_parcels pr LEFT JOIN delivery_credit dc ON dc.reference_id = pr.id
    GROUP BY ${branchColumn}, to_char(pr.created_at, 'YYYY-MM-DD'), pr.status
  `);
  return rows as unknown as AnalyticsGroup[];
}

export async function countPreviousParcelAnalytics(scope: AnalyticsScope) {
  const rows = await db.execute(sql`SELECT COUNT(*)::int AS count FROM parcels pr
    WHERE ${parcelAnalyticsWhere(scope, true)}`);
  return Number(rows[0]?.count ?? 0);
}

export async function listParcelAnalyticsBranches(scope: AnalyticsScope) {
  const rows = await db.execute(sql`SELECT id, name FROM branches
    WHERE company_id = ${scope.companyId}
    ${scope.lockedBranchId ? sql`AND id = ${scope.lockedBranchId}` : sql``}
    ORDER BY name, id`);
  return rows as unknown as Array<{ id: string; name: string }>;
}
