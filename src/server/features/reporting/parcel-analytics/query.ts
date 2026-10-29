import { sql } from 'drizzle-orm';
import { CustomerCreditSourceType, CustomerCreditTransactionType } from '@/db/schemas/enums';
import type { AnalyticsScope } from './types';
import { analyticsDateBounds } from './scope';

export function parcelAnalyticsWhere(scope: AnalyticsScope, previous = false) {
  const dates = analyticsDateBounds(scope);
  const branchColumn = scope.basis === 'source' ? sql`pr.source_id` : sql`pr.destination_id`;
  return sql`pr.company_id = ${scope.companyId} AND pr.is_deleted = false
    AND pr.created_at >= ${(previous ? dates.previousFrom : dates.from).toISOString()}
    AND pr.created_at < ${(previous ? dates.from : dates.until).toISOString()}
    ${scope.branchId ? sql`AND ${branchColumn} = ${scope.branchId}` : sql``}
    ${scope.sourceId ? sql`AND pr.source_id = ${scope.sourceId}` : sql``}
    ${scope.destinationId ? sql`AND pr.destination_id = ${scope.destinationId}` : sql``}
    ${scope.status !== undefined ? sql`AND pr.status = ${scope.status}` : sql``}`;
}

// Aggregate recognized delivery principal once over the scoped cohort.
// Limit details before joining credits so a drill-down processes at most 51 parcels.
export function parcelAnalyticsCohort(scope: AnalyticsScope, page?: number) {
  return sql`WITH target_parcels AS (
    SELECT pr.* FROM parcels pr WHERE ${parcelAnalyticsWhere(scope)}
    ${page === undefined ? sql`` : sql`ORDER BY pr.created_at DESC, pr.id DESC LIMIT 51 OFFSET ${(page - 1) * 50}`}
  ), delivery_credit AS (
    SELECT c.reference_id, SUM(c.signed_amount_psw)::bigint AS principal_psw
    FROM customer_credit_transactions c
    JOIN target_parcels target ON target.id = c.reference_id AND target.company_id = c.company_id
    WHERE c.company_id = ${scope.companyId}
      AND c.source_type = ${CustomerCreditSourceType.DELIVERY}
      AND c.transaction_type = ${CustomerCreditTransactionType.CHARGE}
      AND c.signed_amount_psw > 0 AND LOWER(COALESCE(c.notes, '')) LIKE '%principal%'
    GROUP BY c.reference_id
  )`;
}

// planned_tobepaid_psw already decreases with recipient principal cash collection.
export const receiverOutstandingSql = sql`GREATEST(pr.planned_tobepaid_psw - COALESCE(dc.principal_psw, 0), 0)`;
