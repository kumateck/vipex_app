import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest } from '../../utils/http-error';

import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  createBookingWithParcelsAndPaymentsRepo,
  type CreateBookingWithParcelsInput,
  type CreateBookingWithParcelsOutput,
} from './booking-with-parcels.repository';
import { PaymentMethod } from '@/db/schemas';
import { assertActiveSessionSvc } from '../cashiers/service';
import { recordAuditLog } from '../audit/logger';

export type CreateBookingWithParcelsBody = {
  senderId: string;
  companyId: string;
  sourceId: string;
  statusId: string;
  createdBy: string;
  cashierSessionId?: string | null;
  bookingCode?: string | null;
  parcels: Array<{
    destinationId: string;
    receiverId: string;
    statusId: string;
    parcelDetails: string;
    parcelContent: string;
    parcelValueCedis?: number | string | null;
    plannedToBePaidCedis?: number | string | null;
    method: PaymentMethod;
    trackingCode?: string | null;
    senderPaymentCedis?: number | string | null;
    senderPaymentMethod?: PaymentMethod;
    cashierUserId: string;
    branchId: string;
  }>;
};

export async function createBookingWithParcelsSvc(
  body: CreateBookingWithParcelsBody,
): Promise<CreateBookingWithParcelsOutput> {
  if (!body.senderId || !body.companyId || !body.sourceId || !body.statusId || !body.createdBy) {
    throw BadRequest('Missing required booking fields');
  }
  if (!Array.isArray(body.parcels) || body.parcels.length === 0) {
    throw BadRequest('At least one parcel is required');
  }

  const primaryParcel = body.parcels[0];
  if (!primaryParcel?.cashierUserId || !primaryParcel?.branchId) {
    throw BadRequest('Cashier user and branch are required for parcel booking');
  }

  const activeSession = await assertActiveSessionSvc({
    cashierId: primaryParcel.cashierUserId,
    branchId: primaryParcel.branchId,
  });

  const hasMixedCashierOrBranch = body.parcels.some(
    (parcel) =>
      parcel.cashierUserId !== primaryParcel.cashierUserId || parcel.branchId !== primaryParcel.branchId,
  );
  if (hasMixedCashierOrBranch) {
    throw BadRequest('All parcels in one booking must belong to the same cashier and branch');
  }

  const input: CreateBookingWithParcelsInput = {
    senderId: body.senderId,
    companyId: body.companyId,
    sourceId: body.sourceId,
    statusId: body.statusId,
    createdBy: body.createdBy,
    cashierSessionId: body.cashierSessionId ?? activeSession.id,
    // bookingCode: body.bookingCode ?? null,
    parcels: body.parcels.map((p) => ({
      destinationId: p.destinationId,
      receiverId: p.receiverId,
      statusId: p.statusId,
      parcelDetails: p.parcelDetails,
      parcelContent: p.parcelContent,
      parcelValuePsw: p.parcelValueCedis != null ? Number(toPesewas(p.parcelValueCedis)) : 0,
      plannedToBePaidPsw:
        p.plannedToBePaidCedis != null ? Number(toPesewas(p.plannedToBePaidCedis)) : 0,
      method: p.method,
      trackingCode: p.trackingCode ?? null,
      senderPaymentPsw: p.senderPaymentCedis != null ? Number(toPesewas(p.senderPaymentCedis)) : 0,
      senderPaymentMethod: p.senderPaymentMethod ?? undefined,
      cashierUserId: p.cashierUserId,
      branchId: p.branchId,
    })),
  };

  const created = await createBookingWithParcelsAndPaymentsRepo(input, (psw) => {
    const t = computeGhanaTaxesFromPesewas(BigInt(psw));
    return {
      principal: Number(t.principal),
      net: Number(t.net),
      vat: Number(t.vat),
      getfund: Number(t.getfund),
      nhil: Number(t.nhil),
      covid: Number(t.covid),
      totalTax: Number(t.totalTax),
    };
  });

  await recordAuditLog({
    companyId: body.companyId,
    actorUserId: body.createdBy,
    entityType: 'booking',
    entityId: created.bookingId,
    action: 'BOOKING_WITH_PARCELS_CREATED',
    message: 'Booking with parcels created',
    metadata: {
      senderId: body.senderId,
      sourceId: body.sourceId,
      parcelsCount: body.parcels.length,
      paymentCount: created.payments.length,
    },
  });

  return created;
}
