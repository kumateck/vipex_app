import { sql } from 'drizzle-orm';
import { PaymentComponent } from '@/db/schemas/enums';
import type { TaxDataFilters } from '@/shared/tax-data';
import type { TaxDataScope } from './scope';

export function taxDataCohort(scope: TaxDataScope, filters?: TaxDataFilters, ids?: string[]) {
  const day = filters ? new Date(`${filters.date}T00:00:00Z`) : null;
  const branchId = filters?.branchId ?? scope.branchId;
  return sql`WITH target AS (
    SELECT pr.* FROM parcels pr WHERE pr.company_id = ${scope.companyId} AND pr.is_deleted = false
    ${branchId ? sql`AND pr.source_id = ${branchId}` : sql``}
    ${filters?.destinationBranchId ? sql`AND pr.destination_id = ${filters.destinationBranchId}` : sql``}
    ${day ? sql`AND pr.created_at >= ${day.toISOString()} AND pr.created_at < ${new Date(day.getTime() + 86400000).toISOString()}` : sql``}
    ${
      ids
        ? sql`AND pr.id IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )})`
        : sql``
    }
    ${filters?.confirmation === 'confirmed' ? sql`AND pr.tax_report_confirmation = true` : sql``}
    ${filters?.confirmation === 'unconfirmed' ? sql`AND pr.tax_report_confirmation = false` : sql``}
  ), paid AS (
    SELECT pay.parcel_id, COUNT(*)::int AS payment_count,
      string_agg(pay.id, ',' ORDER BY pay.id) AS payment_ids,
      SUM(pay.gross_amount_psw)::bigint AS gross, SUM(pay.net_amount_psw)::bigint AS net,
      SUM(pay.vat_psw)::bigint AS vat, SUM(pay.getfund_psw)::bigint AS getfund,
      SUM(pay.nhil_psw)::bigint AS nhil, SUM(pay.covid_psw)::bigint AS covid,
      SUM(pay.tax_total_psw)::bigint AS total_tax
    FROM payments pay JOIN target pr ON pr.id = pay.parcel_id AND pr.company_id = pay.company_id
    WHERE pay.company_id = ${scope.companyId} AND pay.component = ${PaymentComponent.PRINCIPAL}
      AND pay.voided_at IS NULL
    GROUP BY pay.parcel_id HAVING SUM(pay.gross_amount_psw) > 0
  )`;
}
