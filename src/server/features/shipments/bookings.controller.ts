import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { createBookingSvc, getBookingSvc, listBookingsSvc } from './bookings.service';

export async function listBookingsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    sourceId?: string | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listBookingsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    sourceId: q.filters?.sourceId ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export const getBookingByIdCtrl = getBookingSvc;
export const createBookingCtrl = createBookingSvc;
