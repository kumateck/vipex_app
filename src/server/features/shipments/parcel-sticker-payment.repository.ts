import { effectiveChargeAmountSql } from '../customers/credit-settlement';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, payments } from '@/db/schemas';
import {
  PaymentComponent,
  PaymentMethod,
  Payer,
  CustomerCreditSourceType,
} from '@/db/schemas/enums';

/** One statement gives the parcel, active payments and posted credit a consistent snapshot. */
export function buildStickerPaymentQuery(
  companyId: string,
  trackingCode: string,
  bookingCode: string,
) {
  // Drizzle strips Column table names in a single-table SELECT projection, including
  // nested SQL. Preserve these outer references as identifiers so payment parcel_id
  // is compared with parcels.id rather than the payment's own id.
  const parcelColumn = (key: 'id' | 'companyId' | 'senderId') =>
    sql`${parcels}.${sql.identifier(parcels[key].name)}`;
  const paid = (payer: Payer) =>
    sql<number>`coalesce((select sum(${payments.grossAmountPsw}) from ${payments}
    where ${payments.parcelId} = ${parcelColumn('id')} and ${payments.companyId} = ${parcelColumn('companyId')}
    and ${payments.component} = ${PaymentComponent.PRINCIPAL} and ${payments.payer} = ${payer}
    and ${payments.method} <> ${PaymentMethod.CREDIT} and ${payments.voidedAt} is null), 0)`.mapWith(
      Number,
    );
  return db
    .select({
      companyId: parcels.companyId,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      status: parcels.status,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      senderPaidPsw: paid(Payer.SENDER),
      receiverPaidPsw: paid(Payer.RECIPIENT),
      creditPsw:
        sql<number>`coalesce((select sum(${effectiveChargeAmountSql()}) from customer_credit_transactions cct
      where cct."reference_id" = ${parcelColumn('id')}
        and cct."company_id" = ${parcelColumn('companyId')}
        and cct."customer_id" = ${parcelColumn('senderId')}
        and cct.source_type = ${CustomerCreditSourceType.PARCEL} and cct.transaction_type = 0), 0)`.mapWith(
          Number,
        ),
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, companyId),
        eq(parcels.trackingCode, trackingCode),
        eq(parcels.bookingCode, bookingCode),
        eq(parcels.isDeleted, false),
      ),
    )
    .limit(1);
}

export async function getStickerPaymentRecord(
  companyId: string,
  trackingCode: string,
  bookingCode: string,
) {
  const [record] = await buildStickerPaymentQuery(companyId, trackingCode, bookingCode);
  return record ?? null;
}
