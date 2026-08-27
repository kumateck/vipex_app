import { mobileApiGet, mobileApiPost, searchParcels } from '@mobile/lib/api';
import type { ParcelSearchRow } from '@mobile/types/parcels';
import type { DiscrepancyType, OpenParcelDiscrepancy } from '../types';

export function searchDiscrepancyParcels(token: string, companyId: string, search: string) {
  return searchParcels(token, { companyId, search, pageSize: 20 });
}

export function listOpenDiscrepancies(token: string) {
  return mobileApiGet<{ data: OpenParcelDiscrepancy[] }>({
    path: '/shipments/parcels/discrepancies/open',
    token,
    query: { page: 1, pageSize: 50 },
  });
}

export function logReceiveDiscrepancy(
  token: string,
  input: {
    companyId: string;
    actorUserId: string;
    branchId: string;
    discrepancyType: DiscrepancyType;
    parcel: ParcelSearchRow | null;
    trackingCode: string;
    bookingCode: string;
    notes: string;
  },
) {
  return mobileApiPost<{ id: string }>({
    path: '/shipments/parcels/discrepancies',
    token,
    body: {
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      branchId: input.branchId,
      discrepancyType: input.discrepancyType,
      parcelId: input.parcel?.id ?? null,
      trackingCode: input.parcel?.trackingCode ?? (input.trackingCode.trim() || null),
      bookingCode: input.parcel?.bookingCode ?? (input.bookingCode.trim() || null),
      notes: input.notes.trim() || null,
    },
  });
}

export function uploadDiscrepancyPhoto(
  token: string,
  input: { id: string; fileName: string; dataUrl: string },
) {
  return mobileApiPost<{ id: string; fileUrl: string }>({
    path: `/shipments/parcels/discrepancies/${input.id}/evidence`,
    token,
    body: { fileName: input.fileName, dataUrl: input.dataUrl },
  });
}
