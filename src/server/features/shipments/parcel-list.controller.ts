import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { listParcelsSvc } from './parcel-services/queries';

export async function listParcelsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    sourceId?: string | null;
    destinationId?: string | null;
    parcelCode?: string | null;
    scopedBranchId?: string | null;
    locationId?: string | null;
    status?: number | null;
    statuses?: number[] | null;
    riderReturnedOnly?: boolean;
    senderPaid?: boolean | null;
    paymentType?: 'paid' | 'to_be_paid' | 'partial' | null;
    hasPickupQueue?: boolean | null;
    agedOnly?: boolean | null;
    storageChargeAccruing?: boolean | null;
    cashierCollectionRequired?: boolean | null;
    received?: boolean | null;
    includeDeleted?: boolean | null;
    assignedToUserId?: string | null;
    callCenterAssignmentOrder?: boolean;
    callCenterUncalledOnly?: boolean;
    shelfPickerAssignmentOrder?: boolean;
    shelfPickerAssigned?: boolean;
    sentDate?: string | null;
    consignmentNumber?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20, maxPageSize: 200 });
  const { data, totalRecords } = await listParcelsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    sourceId: q.filters?.sourceId ?? null,
    destinationId: q.filters?.destinationId ?? null,
    parcelCode: q.filters?.parcelCode ?? null,
    scopedBranchId: q.filters?.scopedBranchId ?? null,
    locationId: q.filters?.locationId ?? null,
    status: q.filters?.status ?? null,
    statuses: q.filters?.statuses ?? null,
    riderReturnedOnly: q.filters?.riderReturnedOnly ?? false,
    senderPaid: q.filters?.senderPaid ?? null,
    paymentType: q.filters?.paymentType ?? null,
    hasPickupQueue: q.filters?.hasPickupQueue ?? null,
    agedOnly: q.filters?.agedOnly ?? null,
    storageChargeAccruing: q.filters?.storageChargeAccruing ?? null,
    cashierCollectionRequired: q.filters?.cashierCollectionRequired ?? null,
    search: pagination.search ?? null,
    received: q.filters?.received ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    assignedToUserId: q.filters?.assignedToUserId ?? null,
    callCenterAssignmentOrder: q.filters?.callCenterAssignmentOrder ?? false,
    callCenterUncalledOnly: q.filters?.callCenterUncalledOnly ?? false,
    shelfPickerAssignmentOrder: q.filters?.shelfPickerAssignmentOrder ?? false,
    shelfPickerAssigned: q.filters?.shelfPickerAssigned,
    sentDate: q.filters?.sentDate ?? null,
    consignmentNumber: q.filters?.consignmentNumber ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      riderReturnedAt: p.riderReturnedAt ? p.riderReturnedAt.toISOString() : null,
      receivedAt: p.receivedAt ? p.receivedAt.toISOString() : null,
      confirmedAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
      callCenterCalledAt: p.callCenterCalledAt ? p.callCenterCalledAt.toISOString() : null,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
      bookingCreatedAt: p.bookingCreatedAt ? p.bookingCreatedAt.toISOString() : null,
      consignmentCreatedAt: p.consignmentCreatedAt ? p.consignmentCreatedAt.toISOString() : null,
      pickupQueuedAt: p.pickupQueuedAt ? p.pickupQueuedAt.toISOString() : null,
      pickupQueueEndedAt: p.pickupQueueEndedAt ? p.pickupQueueEndedAt.toISOString() : null,
      deliveredAt: p.deliveredAt ? p.deliveredAt.toISOString() : null,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}
