import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  createParcelSvc,
  getParcelSvc,
  listParcelsSvc,
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
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export const getParcelByIdCtrl = getParcelSvc;
export const createParcelCtrl = createParcelSvc;
export const updateParcelCtrl = updateParcelSvc;
export const markParcelReceivedCtrl = markParcelReceivedSvc;
export const setPlannedToBePaidCtrl = setPlannedToBePaidSvc;
