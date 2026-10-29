import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import type { ParcelAnalyticsDetails } from '@/shared/reporting';
import { BadRequest } from '@/server/utils/http-error';
import type { AnalyticsScope } from './types';
import { parcelAnalyticsCohort, receiverOutstandingSql } from './query';

export async function getParcelAnalyticsDetails(
  scope: AnalyticsScope,
  page = 1,
): Promise<ParcelAnalyticsDetails> {
  if (!Number.isInteger(page) || page < 1 || page > 10000)
    throw BadRequest('Invalid analytics page');
  const rows = await db.execute(sql`
    ${parcelAnalyticsCohort(scope, page)}
    SELECT pr.id, pr.booking_code AS "bookingCode", pr.tracking_code AS "trackingCode",
      pr.status, sb.name AS "sourceBranchName", dest.name AS "destinationBranchName",
      pr.created_at AS "createdAt", pr.charge_psw AS "chargePsw",
      ${receiverOutstandingSql}::bigint AS "receiverOutstandingPsw"
    FROM target_parcels pr
    LEFT JOIN delivery_credit dc ON dc.reference_id = pr.id
    JOIN branches sb ON sb.id = pr.source_id AND sb.company_id = pr.company_id
    JOIN branches dest ON dest.id = pr.destination_id AND dest.company_id = pr.company_id
    ORDER BY pr.created_at DESC, pr.id DESC
  `);
  return {
    page,
    hasMore: rows.length > 50,
    rows: rows.slice(0, 50).map((row) => ({
      id: String(row.id),
      bookingCode: String(row.bookingCode),
      trackingCode: String(row.trackingCode),
      status: Number(row.status),
      sourceBranchName: String(row.sourceBranchName),
      destinationBranchName: String(row.destinationBranchName),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
      chargePsw: Number(row.chargePsw),
      receiverOutstandingPsw: Number(row.receiverOutstandingPsw),
    })),
  };
}
