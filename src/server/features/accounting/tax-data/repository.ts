import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import type { TaxDataBranchOptions, TaxDataFilters, TaxDataRow } from '@/shared/tax-data';
import type { DbExecutor } from '@/server/features/payments/types';
import type { TaxDataScope } from './scope';
import { taxDataCohort } from './query';
import { normalizeTaxDataRow } from './rows';

export async function listTaxDataRowsRepo(
  scope: TaxDataScope,
  options: {
    filters?: TaxDataFilters;
    ids?: string[];
    page?: number;
    limit?: number;
  },
  executor: DbExecutor = db,
): Promise<TaxDataRow[]> {
  const limit = options.limit ?? 50;
  const offset = ((options.page ?? 1) - 1) * limit;
  const remaining = Math.max(0, (options.filters?.maxOccurrences ?? 500) - offset);
  const rows = await executor.execute(sql`
    ${taxDataCohort(scope, options.filters, options.ids)}
    SELECT pr.id AS "parcelId", pr.booking_code AS "bookingCode", pr.tracking_code AS "trackingCode",
      to_char(pr.created_at, 'YYYY-MM-DD') AS "bookedOn", sb.name AS "sourceBranchName",
      dest.name AS "destinationBranchName", pr.parcel_details AS "parcelDetails",
      pr.parcel_content AS "parcelContent", pr.parcel_value_psw AS "parcelValuePsw",
      COALESCE(NULLIF(btrim(pr.sender_name_snapshot), ''), sender.fullname, '') AS "senderName",
      COALESCE(sender.telephone, '') AS "senderTelephone",
      COALESCE(NULLIF(btrim(pr.receiver_name_snapshot), ''), receiver.fullname, '') AS "receiverName",
      COALESCE(receiver.telephone, '') AS "receiverTelephone", pr.tax_report_confirmation AS confirmed,
      paid.payment_count AS "paymentCount", paid.payment_ids AS "paymentIds",
      paid.gross AS "paidPrincipalPsw", paid.net AS "netPsw", paid.vat AS "vatPsw",
      paid.getfund AS "getfundPsw", paid.nhil AS "nhilPsw", paid.covid AS "covidPsw",
      paid.total_tax AS "taxTotalPsw"
    FROM target pr JOIN paid ON paid.parcel_id = pr.id
    JOIN branches sb ON sb.id = pr.source_id AND sb.company_id = pr.company_id
    JOIN branches dest ON dest.id = pr.destination_id AND dest.company_id = pr.company_id
    LEFT JOIN customers sender ON sender.id = pr.sender_id AND sender.company_id = pr.company_id
    LEFT JOIN customers receiver ON receiver.id = pr.receiver_id AND receiver.company_id = pr.company_id
    ${options.filters?.amountPsw === undefined ? sql`` : sql`WHERE paid.gross = ${options.filters.amountPsw}`}
    ORDER BY pr.created_at, pr.id
    ${options.ids ? sql`` : sql`LIMIT ${Math.min(limit + 1, remaining)} OFFSET ${offset}`}
  `);
  return rows.map((row) => normalizeTaxDataRow(row));
}

export async function listTaxDataCountsRepo(scope: TaxDataScope, filters: TaxDataFilters) {
  return db.execute(sql`${taxDataCohort(scope, filters)}
    SELECT paid.gross AS "amountPsw", COUNT(*)::int AS parcels,
      SUM(paid.gross)::bigint AS "paidPrincipalPsw", SUM(paid.net)::bigint AS "netPsw",
      SUM(paid.vat)::bigint AS "vatPsw", SUM(paid.getfund)::bigint AS "getfundPsw",
      SUM(paid.nhil)::bigint AS "nhilPsw", SUM(paid.covid)::bigint AS "covidPsw",
      SUM(paid.total_tax)::bigint AS "taxTotalPsw"
    FROM paid GROUP BY paid.gross ORDER BY paid.gross`);
}

export async function listTaxDataBranchOptionsRepo(
  scope: TaxDataScope,
): Promise<TaxDataBranchOptions> {
  const rows =
    await db.execute(sql`SELECT id, name FROM branches WHERE company_id = ${scope.companyId}
    ORDER BY name, id`);
  const toBranches = rows as unknown as Array<{ id: string; name: string }>;
  return {
    fromBranches: toBranches.filter((branch) => !scope.branchId || branch.id === scope.branchId),
    toBranches,
  };
}
