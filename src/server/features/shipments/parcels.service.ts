import { toPesewas } from '@/server/utils/gh-money';
import { ParcelStatus } from '@/db/schemas';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import { listPaymentsForParcelRepo } from '../payments/repository';
import { getDeliveryByParcelRepo } from '../deliveries/repository';
import { listConsignmentsForParcelRepo } from './consignments.repository';

import {
  createParcelRepo,
  getParcelRepo,
  listParcelsRepo,
  updateParcelRepo,
  type ListParcelsParams,
  type ParcelRow,
} from './parcels.repository';
import { assertParcelFullyPaid } from './parcel-payment-settlement';

export async function listParcelsSvc(p: ListParcelsParams) {
  return listParcelsRepo(p);
}
export async function getParcelSvc(id: string): Promise<ParcelRow> {
  const row = await getParcelRepo(id);
  if (!row) throw NotFound('Parcel not found');
  return row;
}
export async function createParcelSvc(input: {
  companyId: string;
  sourceId: string;
  destinationId: string;
  bookingId: string;
  bookingCode: string;
  trackingCode: string;
  senderId: string;
  receiverId: string;
  status: number;
  parcelDetails: string;
  parcelContent: string;
  parcelValueCedis?: number | string | null;
  chargeCedis?: number | string | null;
  plannedToBePaidCedis?: number | string | null;
  method: number;
  createdBy?: string | null;
  cashierSessionId?: string | null;
}): Promise<{ id: string }> {
  if (
    !input.companyId ||
    !input.sourceId ||
    !input.destinationId ||
    !input.bookingId ||
    !input.bookingCode ||
    !input.trackingCode
  ) {
    throw BadRequest('Missing required fields');
  }
  const parcelValuePsw = input.parcelValueCedis != null ? toPesewas(input.parcelValueCedis) : 0n;
  const plannedToBePaidPsw =
    input.plannedToBePaidCedis != null ? toPesewas(input.plannedToBePaidCedis) : 0n;
  const chargePsw = input.chargeCedis != null ? toPesewas(input.chargeCedis) : plannedToBePaidPsw;
  const created = await createParcelRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    destinationId: input.destinationId,
    bookingId: input.bookingId,
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    senderId: input.senderId,
    receiverId: input.receiverId,
    status: input.status,
    parcelDetails: input.parcelDetails,
    parcelContent: input.parcelContent,
    parcelValuePsw: Number(parcelValuePsw),
    chargePsw: Number(chargePsw),
    plannedToBePaidPsw: Number(plannedToBePaidPsw),
    method: input.method,
    createdBy: input.createdBy ?? null,
    cashierSessionId: input.cashierSessionId ?? null,
  });
  return { id: created.id };
}

export async function updateParcelSvc(
  id: string,
  patch: {
    status?: number;
    parcelDetails?: string;
    parcelContent?: string;
    secondReceiverId?: string | null;
    cardId?: string | null;
    cardNumber?: string | null;
    secondCardId?: string | null;
    secondCardNumber?: string | null;
    confirmedBy?: string | null;
    confirmedAt?: string | null;
    parcelValueCedis?: number | string | null;
    chargeCedis?: number | string | null;
    pickupLocationId?: string | null;
    method?: number;
    taxReportConfirmation?: boolean;
  },
): Promise<{ id: string }> {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE) {
    await assertParcelFullyPaid(id);
  }
  const setPatch: Partial<typeof cur> & { parcelValuePsw?: number } = {};
  if (patch.status !== undefined) setPatch.status = patch.status;
  if (patch.parcelDetails) setPatch.parcelDetails = patch.parcelDetails;
  if (patch.parcelContent) setPatch.parcelContent = patch.parcelContent;
  if (patch.secondReceiverId !== undefined) setPatch.secondReceiverId = patch.secondReceiverId;
  if (patch.cardId !== undefined) setPatch.cardId = patch.cardId;
  if (patch.cardNumber !== undefined) setPatch.cardNumber = patch.cardNumber;
  if (patch.secondCardId !== undefined) setPatch.secondCardId = patch.secondCardId;
  if (patch.secondCardNumber !== undefined) setPatch.secondCardNumber = patch.secondCardNumber;
  if (patch.confirmedBy !== undefined) setPatch.confirmedBy = patch.confirmedBy;
  if (patch.confirmedAt !== undefined) {
    setPatch.confirmedAt = patch.confirmedAt ? new Date(patch.confirmedAt) : null;
  } else if (patch.status === ParcelStatus.DELIVERED_BY_OFFICE && !cur.confirmedAt) {
    setPatch.confirmedAt = new Date();
  }
  if (patch.parcelValueCedis !== undefined)
    setPatch.parcelValuePsw =
      patch.parcelValueCedis != null ? Number(toPesewas(patch.parcelValueCedis)) : 0;
  if (patch.chargeCedis !== undefined)
    setPatch.chargePsw = patch.chargeCedis != null ? Number(toPesewas(patch.chargeCedis)) : 0;
  if (patch.pickupLocationId !== undefined) setPatch.pickupLocationId = patch.pickupLocationId;
  if (patch.method !== undefined) setPatch.method = patch.method;
  if (patch.taxReportConfirmation !== undefined)
    setPatch.taxReportConfirmation = patch.taxReportConfirmation;

  const updated = await updateParcelRepo(id, setPatch);
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id };
}

export async function markParcelReceivedSvc(
  id: string,
  input: { receivedBy: string; receivedAt?: string; status?: number },
) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (cur.receivedAt) throw Conflict('Parcel already marked received');
  const patch: Partial<typeof cur> = {
    receivedBy: input.receivedBy,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
  };
  if (input.status !== undefined) patch.status = input.status;
  const updated = await updateParcelRepo(id, patch);
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id, receivedAt: (patch.receivedAt as Date).toISOString() };
}

export async function setPlannedToBePaidSvc(id: string, plannedCedis: number | string) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  const plannedToBePaidPsw = toPesewas(plannedCedis);
  const updated = await updateParcelRepo(id, { plannedToBePaidPsw: Number(plannedToBePaidPsw) });
  if (!updated) throw NotFound('Parcel not found');
  return { id: updated.id, plannedToBePaidCedis: Number(plannedToBePaidPsw) / 100 };
}

export async function getParcelFullDetailsSvc(id: string) {
  const parcel = await getParcelSvc(id);
  const [payments, delivery, consignments] = await Promise.all([
    listPaymentsForParcelRepo(id),
    getDeliveryByParcelRepo(id),
    listConsignmentsForParcelRepo(id),
  ]);

  return {
    parcel,
    payments,
    delivery,
    consignments,
  };
}
