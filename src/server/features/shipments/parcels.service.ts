import { toPesewas } from '@/server/utils/gh-money';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';

import {
  createParcelRepo,
  getParcelRepo,
  listParcelsRepo,
  updateParcelRepo,
  type ListParcelsParams,
  type ParcelRow,
} from './parcels.repository';

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
  statusId: string;
  parcelDetails: string;
  parcelContent: string;
  parcelValueCedis?: number | string | null;
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
  const created = await createParcelRepo({
    companyId: input.companyId,
    sourceId: input.sourceId,
    destinationId: input.destinationId,
    bookingId: input.bookingId,
    bookingCode: input.bookingCode,
    trackingCode: input.trackingCode,
    senderId: input.senderId,
    receiverId: input.receiverId,
    statusId: input.statusId,
    parcelDetails: input.parcelDetails,
    parcelContent: input.parcelContent,
    parcelValuePsw: Number(parcelValuePsw),
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
    statusId?: string;
    parcelDetails?: string;
    parcelContent?: string;
    parcelValueCedis?: number | string | null;
    pickupLocationId?: string | null;
    method?: number;
    taxReportConfirmation?: boolean;
  },
): Promise<{ id: string }> {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  const setPatch: Partial<typeof cur> & { parcelValuePsw?: number } = {};
  if (patch.statusId) setPatch.statusId = patch.statusId;
  if (patch.parcelDetails) setPatch.parcelDetails = patch.parcelDetails;
  if (patch.parcelContent) setPatch.parcelContent = patch.parcelContent;
  if (patch.parcelValueCedis !== undefined)
    setPatch.parcelValuePsw =
      patch.parcelValueCedis != null ? Number(toPesewas(patch.parcelValueCedis)) : 0;
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
  input: { receivedBy: string; receivedAt?: string; statusId?: string },
) {
  const cur = await getParcelRepo(id);
  if (!cur) throw NotFound('Parcel not found');
  if (cur.receivedAt) throw Conflict('Parcel already marked received');
  const patch: Partial<typeof cur> = {
    receivedBy: input.receivedBy,
    receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
  };
  if (input.statusId) patch.statusId = input.statusId;
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
