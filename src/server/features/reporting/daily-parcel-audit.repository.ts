import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  ParcelStatus,
  PaymentComponent,
  Payer,
} from '@/db/schemas/enums';

export type DailyParcelAuditSourceRow = {
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string | Date;
  sourceBranchId: string;
  sourceBranchName: string;
  receiverName: string;
  receiverTelephone: string | null;
  parcelDetails: string;
  parcelContent: string;
  chargePsw: string | number;
  plannedToBePaidPsw: string | number;
  senderPaidPsw: string | number;
  receiverPaidPsw: string | number;
  receiverCreditedPsw: string | number;
  isDelivered: boolean;
  deliveredAt: string | Date | null;
  deliveryOfficer: string | null;
  senderCashier: string | null;
  receiverCashier: string | null;
};

export async function listDailyParcelAuditRowsRepo(input: {
  companyId: string;
  branchId: string | null;
  dayStart: Date;
  nextDayStart: Date;
}) {
  const rows = await db.execute(sql<DailyParcelAuditSourceRow>`
    WITH target_parcels AS (
      SELECT * FROM parcels pr
      WHERE pr.company_id = ${input.companyId} AND pr.is_deleted = false
        AND pr.created_at >= ${input.dayStart} AND pr.created_at < ${input.nextDayStart}
        ${input.branchId ? sql`AND pr.source_id = ${input.branchId}` : sql``}
    ), principal_payments AS (
      SELECT p.parcel_id,
        COALESCE(SUM(p.gross_amount_psw) FILTER (WHERE p.payer = ${Payer.SENDER}), 0)::bigint AS sender_paid_psw,
        COALESCE(SUM(p.gross_amount_psw) FILTER (WHERE p.payer = ${Payer.RECIPIENT}), 0)::bigint AS receiver_paid_psw
      FROM payments p
      JOIN target_parcels target ON target.id = p.parcel_id
      WHERE p.company_id = ${input.companyId}
        AND p.component = ${PaymentComponent.PRINCIPAL}
        AND p.voided_at IS NULL
      GROUP BY p.parcel_id
    ), delivery_credit AS (
      SELECT c.reference_id AS parcel_id, COALESCE(SUM(c.signed_amount_psw), 0)::bigint AS credited_psw
      FROM customer_credit_transactions c
      JOIN target_parcels target ON target.id = c.reference_id
      WHERE c.company_id = ${input.companyId}
        AND c.source_type = ${CustomerCreditSourceType.DELIVERY}
        AND c.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND c.signed_amount_psw > 0
        AND LOWER(COALESCE(c.notes, '')) LIKE '%principal%'
      GROUP BY c.reference_id
    )
    SELECT pr.id AS "parcelId", pr.booking_code AS "bookingCode",
      pr.tracking_code AS "trackingCode", pr.created_at AS "createdAt",
      pr.source_id AS "sourceBranchId", sb.name AS "sourceBranchName",
      COALESCE(NULLIF(BTRIM(pr.receiver_name_snapshot), ''), receiver.fullname, '') AS "receiverName",
      receiver.telephone AS "receiverTelephone",
      pr.parcel_details AS "parcelDetails", pr.parcel_content AS "parcelContent",
      pr.charge_psw AS "chargePsw",
      pr.planned_tobepaid_psw AS "plannedToBePaidPsw",
      COALESCE(pp.sender_paid_psw, 0)::bigint AS "senderPaidPsw",
      COALESCE(pp.receiver_paid_psw, 0)::bigint AS "receiverPaidPsw",
      COALESCE(dc.credited_psw, 0)::bigint AS "receiverCreditedPsw",
      (pr.status IN (${ParcelStatus.DELIVERED_BY_OFFICE}, ${ParcelStatus.DELIVERED_AT_HOME})) AS "isDelivered",
      CASE WHEN pr.status IN (${ParcelStatus.DELIVERED_BY_OFFICE}, ${ParcelStatus.DELIVERED_AT_HOME})
        THEN COALESCE(delivered.delivered_at, pr.confirmed_at)
        ELSE NULL END AS "deliveredAt",
      officer.fullname AS "deliveryOfficer", sender_cashier.fullname AS "senderCashier",
      cashier.fullname AS "receiverCashier"
    FROM target_parcels pr
    JOIN branches sb ON sb.id = pr.source_id AND sb.company_id = pr.company_id
    LEFT JOIN customers receiver ON receiver.id = pr.receiver_id AND receiver.company_id = pr.company_id
    LEFT JOIN principal_payments pp ON pp.parcel_id = pr.id
    LEFT JOIN delivery_credit dc ON dc.parcel_id = pr.id
    LEFT JOIN LATERAL (
      SELECT d.delivered_at, COALESCE(d.delivery_user_id, d.front_desk_user_id) AS officer_user_id
      FROM deliveries d WHERE d.parcel_id = pr.id AND d.is_deleted = false
        AND d.delivered_at IS NOT NULL
      ORDER BY d.delivered_at DESC, d.id DESC LIMIT 1
    ) delivered ON true
    LEFT JOIN users officer ON officer.id = COALESCE(delivered.officer_user_id, pr.confirmed_by)
    LEFT JOIN LATERAL (
      SELECT p.cashier_user_id FROM payments p
      WHERE p.parcel_id = pr.id AND p.company_id = pr.company_id
        AND p.component = ${PaymentComponent.PRINCIPAL} AND p.payer = ${Payer.SENDER}
        AND p.voided_at IS NULL
      ORDER BY p.received_at DESC, p.id DESC LIMIT 1
    ) sender_payment ON true
    LEFT JOIN users sender_cashier ON sender_cashier.id = sender_payment.cashier_user_id
    LEFT JOIN LATERAL (
      SELECT p.cashier_user_id FROM payments p
      WHERE p.parcel_id = pr.id AND p.company_id = pr.company_id
        AND p.component = ${PaymentComponent.PRINCIPAL} AND p.payer = ${Payer.RECIPIENT}
        AND p.voided_at IS NULL
      ORDER BY p.received_at DESC, p.id DESC LIMIT 1
    ) receiver_payment ON true
    LEFT JOIN users cashier ON cashier.id = receiver_payment.cashier_user_id
    ORDER BY pr.created_at ASC, pr.id ASC
  `);
  return rows as unknown as DailyParcelAuditSourceRow[];
}
