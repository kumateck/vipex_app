import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  approveParcelReconciliationCaseSvc,
  createParcelSvc,
  executeParcelReconciliationCaseSvc,
  getParcelFullDetailsSvc,
  getParcelSvc,
  listParcelReconciliationCasesSvc,
  listOpenParcelDiscrepanciesSvc,
  listParcelsSvc,
  logParcelDiscrepancySvc,
  markParcelReceivedSvc,
  requestParcelReconciliationCaseSvc,
  resolveParcelDiscrepancySvc,
  setPlannedToBePaidSvc,
  softDeleteParcelSvc,
  updateParcelSvc,
} from './parcels.service';

export async function listParcelsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    sourceId?: string | null;
    destinationId?: string | null;
    locationId?: string | null;
    status?: number | null;
    statuses?: number[] | null;
    senderPaid?: boolean | null;
    hasPickupQueue?: boolean | null;
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
    locationId: q.filters?.locationId ?? null,
    status: q.filters?.status ?? null,
    statuses: q.filters?.statuses ?? null,
    senderPaid: q.filters?.senderPaid ?? null,
    hasPickupQueue: q.filters?.hasPickupQueue ?? null,
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
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
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
      deletedAt: result.parcel.deletedAt ? result.parcel.deletedAt.toISOString() : null,
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
export const softDeleteParcelCtrl = softDeleteParcelSvc;

export async function listOpenParcelDiscrepanciesCtrl(input: {
  companyId: string;
  branchId?: string | null;
  page: number;
  pageSize: number;
  search?: string | null;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 20)));
  const { data, totalRecords } = await listOpenParcelDiscrepanciesSvc({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    search: input.search?.trim() || null,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return {
    data,
    meta: buildPaginationMeta({ totalRecords, page, pageSize }),
  };
}

export const resolveParcelDiscrepancyCtrl = resolveParcelDiscrepancySvc;

export async function requestParcelReconciliationCaseCtrl(input: {
  companyId: string;
  actorUserId: string;
  parcelId: string;
  linkedParcelId?: string | null;
  caseType: number;
  notes: string;
  evidenceUrl?: string | null;
  actionType?: number | null;
}) {
  return requestParcelReconciliationCaseSvc(input);
}

export async function approveParcelReconciliationCaseCtrl(input: {
  caseId: string;
  companyId: string;
  actorUserId: string;
  actionType: number;
  resolutionNote?: string | null;
}) {
  return approveParcelReconciliationCaseSvc(input);
}

export async function executeParcelReconciliationCaseCtrl(input: {
  caseId: string;
  companyId: string;
  actorUserId: string;
  executionNote?: string | null;
}) {
  return executeParcelReconciliationCaseSvc(input);
}

export async function listParcelReconciliationCasesCtrl(input: {
  companyId: string;
  statuses?: number[] | null;
  branchId?: string | null;
  page: number;
  pageSize: number;
  search?: string | null;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 20)));
  const { data, totalRecords } = await listParcelReconciliationCasesSvc({
    companyId: input.companyId,
    statuses: input.statuses ?? null,
    branchId: input.branchId ?? null,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    search: input.search?.trim() || null,
  });

  return {
    data: data.map((row) => ({
      ...row,
      requestedAt: row.requestedAt.toISOString(),
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
      executedAt: row.executedAt ? row.executedAt.toISOString() : null,
    })),
    meta: buildPaginationMeta({ totalRecords, page, pageSize }),
  };
}
