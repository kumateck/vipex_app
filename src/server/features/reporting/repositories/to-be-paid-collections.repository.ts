import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  ParcelStatus,
  PaymentComponent,
} from '@/db/schemas/enums';
import type {
  ToBePaidOutstandingReportRow,
  ToBePaidCollectionsReconciliationReportRow,
} from '../types';

export async function listToBePaidOutstandingReportRowsRepo(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const fromParam = input.from ? input.from.toISOString() : null;
  const toParam = input.to ? input.to.toISOString() : null;

  const rows = await db.execute(sql<{
    parcel_id: string;
    booking_code: string;
    tracking_code: string;
    created_at: string | Date;
    status: number;
    source_branch_id: string;
    source_branch_name: string | null;
    destination_branch_id: string;
    destination_branch_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    planned_tobepaid_psw: string | number;
    paid_principal_psw: string | number;
    outstanding_psw: string | number;
  }>`
    WITH principal_payments AS (
      SELECT
        p.parcel_id,
        COALESCE(SUM(p.gross_amount_psw), 0)::bigint AS paid_principal_psw
      FROM payments p
      WHERE p.company_id = ${input.companyId}
        AND p.component = ${PaymentComponent.PRINCIPAL}
        AND p.voided_at IS NULL
      GROUP BY p.parcel_id
    )
    SELECT
      pr.id AS parcel_id,
      pr.booking_code,
      pr.tracking_code,
      pr.created_at,
      pr.status,
      pr.source_id AS source_branch_id,
      sb.name AS source_branch_name,
      pr.destination_id AS destination_branch_id,
      dbb.name AS destination_branch_name,
      pr.sender_name_snapshot AS sender_name,
      pr.receiver_name_snapshot AS receiver_name,
      pr.planned_tobepaid_psw,
      COALESCE(pp.paid_principal_psw, 0)::bigint AS paid_principal_psw,
      GREATEST(pr.planned_tobepaid_psw - COALESCE(pp.paid_principal_psw, 0), 0)::bigint AS outstanding_psw
    FROM parcels pr
    LEFT JOIN principal_payments pp ON pp.parcel_id = pr.id
    LEFT JOIN branches sb ON sb.id = pr.source_id
    LEFT JOIN branches dbb ON dbb.id = pr.destination_id
    WHERE pr.company_id = ${input.companyId}
      AND pr.is_deleted = false
      AND pr.planned_tobepaid_psw > 0
      AND pr.status NOT IN (${ParcelStatus.DELIVERED_BY_OFFICE}, ${ParcelStatus.DELIVERED_AT_HOME}, ${ParcelStatus.RETURNED_TO_SENDER}, ${ParcelStatus.RETURN_TO_SOURCE}, ${ParcelStatus.CANCELLED})
      AND GREATEST(pr.planned_tobepaid_psw - COALESCE(pp.paid_principal_psw, 0), 0) > 0
      ${input.sourceBranchId ? sql`AND pr.source_id = ${input.sourceBranchId}` : sql``}
      ${input.destinationBranchId ? sql`AND pr.destination_id = ${input.destinationBranchId}` : sql``}
      ${fromParam ? sql`AND pr.created_at >= ${fromParam}` : sql``}
      ${toParam ? sql`AND pr.created_at <= ${toParam}` : sql``}
    ORDER BY outstanding_psw DESC, pr.created_at DESC
  `);

  return rows.map((row) => ({
    parcelId: row.parcel_id,
    bookingCode: row.booking_code,
    trackingCode: row.tracking_code,
    createdAt:
      typeof row.created_at === 'string' || row.created_at instanceof Date
        ? new Date(row.created_at)
        : new Date(String(row.created_at)),
    status: Number(row.status),
    sourceBranchId: row.source_branch_id,
    sourceBranchName: row.source_branch_name,
    destinationBranchId: row.destination_branch_id,
    destinationBranchName: row.destination_branch_name,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    plannedToBePaidPsw: Number(row.planned_tobepaid_psw),
    paidPrincipalPsw: Number(row.paid_principal_psw),
    outstandingPsw: Number(row.outstanding_psw),
  })) as ToBePaidOutstandingReportRow[];
}

export async function listToBePaidCollectionsReconciliationReportRowsRepo(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const fromParam = input.from ? input.from.toISOString() : null;
  const toParam = input.to ? input.to.toISOString() : null;

  const rows = await db.execute(sql<{
    parcel_id: string;
    booking_code: string;
    tracking_code: string;
    created_at: string | Date;
    status: number;
    source_branch_id: string;
    source_branch_name: string | null;
    destination_branch_id: string;
    destination_branch_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    planned_tobepaid_psw: string | number;
    collected_principal_psw: string | number;
    credited_principal_psw: string | number;
    recognized_principal_psw: string | number;
    outstanding_psw: string | number;
    variance_psw: string | number;
  }>`
    WITH principal_payments AS (
      SELECT
        p.parcel_id,
        COALESCE(SUM(p.gross_amount_psw), 0)::bigint AS collected_principal_psw
      FROM payments p
      WHERE p.company_id = ${input.companyId}
        AND p.component = ${PaymentComponent.PRINCIPAL}
        AND p.voided_at IS NULL
      GROUP BY p.parcel_id
    ),
    delivery_credit_principal AS (
      SELECT
        cct.reference_id AS parcel_id,
        COALESCE(SUM(cct.signed_amount_psw), 0)::bigint AS credited_principal_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.source_type = ${CustomerCreditSourceType.DELIVERY}
        AND cct.signed_amount_psw > 0
        AND cct.reference_id IS NOT NULL
        AND LOWER(COALESCE(cct.notes, '')) LIKE '%principal%'
      GROUP BY cct.reference_id
    )
    SELECT
      pr.id AS parcel_id,
      pr.booking_code,
      pr.tracking_code,
      pr.created_at,
      pr.status,
      pr.source_id AS source_branch_id,
      sb.name AS source_branch_name,
      pr.destination_id AS destination_branch_id,
      dbb.name AS destination_branch_name,
      pr.sender_name_snapshot AS sender_name,
      pr.receiver_name_snapshot AS receiver_name,
      pr.planned_tobepaid_psw,
      COALESCE(pp.collected_principal_psw, 0)::bigint AS collected_principal_psw,
      COALESCE(dcp.credited_principal_psw, 0)::bigint AS credited_principal_psw,
      (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0))::bigint AS recognized_principal_psw,
      GREATEST(
        pr.planned_tobepaid_psw - (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0)),
        0
      )::bigint AS outstanding_psw,
      (
        (COALESCE(pp.collected_principal_psw, 0) + COALESCE(dcp.credited_principal_psw, 0)) - pr.planned_tobepaid_psw
      )::bigint AS variance_psw
    FROM parcels pr
    LEFT JOIN principal_payments pp ON pp.parcel_id = pr.id
    LEFT JOIN delivery_credit_principal dcp ON dcp.parcel_id = pr.id
    LEFT JOIN branches sb ON sb.id = pr.source_id
    LEFT JOIN branches dbb ON dbb.id = pr.destination_id
    WHERE pr.company_id = ${input.companyId}
      AND pr.is_deleted = false
      AND pr.planned_tobepaid_psw > 0
      ${input.sourceBranchId ? sql`AND pr.source_id = ${input.sourceBranchId}` : sql``}
      ${input.destinationBranchId ? sql`AND pr.destination_id = ${input.destinationBranchId}` : sql``}
      ${fromParam ? sql`AND pr.created_at >= ${fromParam}` : sql``}
      ${toParam ? sql`AND pr.created_at <= ${toParam}` : sql``}
    ORDER BY pr.created_at DESC, pr.booking_code DESC
  `);

  return rows.map((row) => ({
    parcelId: row.parcel_id,
    bookingCode: row.booking_code,
    trackingCode: row.tracking_code,
    createdAt:
      typeof row.created_at === 'string' || row.created_at instanceof Date
        ? new Date(row.created_at)
        : new Date(String(row.created_at)),
    status: Number(row.status),
    sourceBranchId: row.source_branch_id,
    sourceBranchName: row.source_branch_name,
    destinationBranchId: row.destination_branch_id,
    destinationBranchName: row.destination_branch_name,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    plannedToBePaidPsw: Number(row.planned_tobepaid_psw),
    collectedPrincipalPsw: Number(row.collected_principal_psw),
    creditedPrincipalPsw: Number(row.credited_principal_psw),
    recognizedPrincipalPsw: Number(row.recognized_principal_psw),
    outstandingPsw: Number(row.outstanding_psw),
    variancePsw: Number(row.variance_psw),
  })) as ToBePaidCollectionsReconciliationReportRow[];
}
