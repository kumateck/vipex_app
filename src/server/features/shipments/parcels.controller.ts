import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  createParcelSvc,
  getParcelFullDetailsSvc,
  getParcelSvc,
  listParcelsSvc,
  logParcelDiscrepancySvc,
  markParcelReceivedSvc,
  setPlannedToBePaidSvc,
  updateParcelSvc,
} from './parcels.service';

export async function listParcelsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    sourceId?: string | null;
    destinationId?: string | null;
    status?: number | null;
    statuses?: number[] | null;
    senderPaid?: boolean | null;
    received?: boolean | null;
    includeDeleted?: boolean | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listParcelsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    sourceId: q.filters?.sourceId ?? null,
    destinationId: q.filters?.destinationId ?? null,
    status: q.filters?.status ?? null,
    statuses: q.filters?.statuses ?? null,
    senderPaid: q.filters?.senderPaid ?? null,
    search: pagination.search ?? null,
    received: q.filters?.received ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      receivedAt: p.receivedAt ? p.receivedAt.toISOString() : null,
      confirmedAt: p.confirmedAt ? p.confirmedAt.toISOString() : null,
      bookingCreatedAt: p.bookingCreatedAt ? p.bookingCreatedAt.toISOString() : null,
      pickupQueuedAt: p.pickupQueuedAt ? p.pickupQueuedAt.toISOString() : null,
      pickupQueueEndedAt: p.pickupQueueEndedAt ? p.pickupQueueEndedAt.toISOString() : null,
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export const getParcelByIdCtrl = getParcelSvc;
export async function getParcelDetailsCtrl(id: string) {
  const result = await getParcelFullDetailsSvc(id);
  return {
    parcel: {
      ...result.parcel,
      createdAt: result.parcel.createdAt.toISOString(),
      updatedAt: result.parcel.updatedAt.toISOString(),
      receivedAt: result.parcel.receivedAt ? result.parcel.receivedAt.toISOString() : null,
      confirmedAt: result.parcel.confirmedAt ? result.parcel.confirmedAt.toISOString() : null,
    },
    payments: result.payments.map((payment) => ({
      ...payment,
      receivedAt: payment.receivedAt.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      voidedAt: payment.voidedAt ? payment.voidedAt.toISOString() : null,
    })),
    delivery: result.delivery
      ? {
          ...result.delivery,
          signatureImage: result.delivery.signatureImage ?? null,
          receiverCalledConfirmedAt: result.delivery.receiverCalledConfirmedAt
            ? result.delivery.receiverCalledConfirmedAt.toISOString()
            : null,
          deliveredAt: result.delivery.deliveredAt
            ? result.delivery.deliveredAt.toISOString()
            : null,
          confirmedAt: result.delivery.confirmedAt
            ? result.delivery.confirmedAt.toISOString()
            : null,
          createdAt: result.delivery.createdAt.toISOString(),
          updatedAt: result.delivery.updatedAt.toISOString(),
        }
      : null,
    consignments: result.consignments.map((consignment) => ({
      ...consignment,
      consignmentDate: consignment.consignmentDate.toISOString(),
      addedAt: consignment.addedAt.toISOString(),
      removedAt: consignment.removedAt ? consignment.removedAt.toISOString() : null,
    })),
    pickupQueue: result.pickupQueue
      ? {
          ...result.pickupQueue,
          queueDate: result.pickupQueue.queueDate.toISOString(),
          queuedAt: result.pickupQueue.queuedAt.toISOString(),
          endedAt: result.pickupQueue.endedAt ? result.pickupQueue.endedAt.toISOString() : null,
          createdAt: result.pickupQueue.createdAt.toISOString(),
          updatedAt: result.pickupQueue.updatedAt.toISOString(),
        }
      : null,
    internalHolder: result.internalHolder
      ? {
          ...result.internalHolder,
          updatedAt: result.internalHolder.updatedAt.toISOString(),
        }
      : null,
  };
}
export const createParcelCtrl = createParcelSvc;
export const updateParcelCtrl = updateParcelSvc;
export const markParcelReceivedCtrl = markParcelReceivedSvc;
export const setPlannedToBePaidCtrl = setPlannedToBePaidSvc;
export const logParcelDiscrepancyCtrl = logParcelDiscrepancySvc;
