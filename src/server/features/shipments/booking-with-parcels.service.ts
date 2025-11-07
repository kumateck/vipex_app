import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest } from '../../utils/http-error';

import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  createBookingWithParcelsAndPaymentsRepo,
  type CreateBookingWithParcelsInput,
  type CreateBookingWithParcelsOutput,
} from './booking-with-parcels.repository';
import { PaymentMethod } from '@/db/schemas';

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

  const input: CreateBookingWithParcelsInput = {
    senderId: body.senderId,
    companyId: body.companyId,
    sourceId: body.sourceId,
    statusId: body.statusId,
    createdBy: body.createdBy,
    cashierSessionId: body.cashierSessionId ?? null,
    // bookingCode: body.bookingCode ?? null,
    parcels: body.parcels.map((p) => ({
      destinationId: p.destinationId,
      receiverId: p.receiverId,
      statusId: p.statusId,
      parcelDetails: p.parcelDetails,
      parcelContent: p.parcelContent,
      parcelValuePsw: p.parcelValueCedis != null ? toPesewas(p.parcelValueCedis) : 0n,
      plannedToBePaidPsw: p.plannedToBePaidCedis != null ? toPesewas(p.plannedToBePaidCedis) : 0n,
      method: p.method,
      trackingCode: p.trackingCode ?? null,
      senderPaymentPsw: p.senderPaymentCedis != null ? toPesewas(p.senderPaymentCedis) : 0n,
      senderPaymentMethod: p.senderPaymentMethod ?? undefined,
      cashierUserId: p.cashierUserId,
      branchId: p.branchId,
    })),
  };

  return createBookingWithParcelsAndPaymentsRepo(input, (psw) => {
    const t = computeGhanaTaxesFromPesewas(psw);
    return {
      principal: t.principal,
      net: t.net,
      vat: t.vat,
      getfund: t.getfund,
      nhil: t.nhil,
      covid: t.covid,
      totalTax: t.totalTax,
    };
  });
}
