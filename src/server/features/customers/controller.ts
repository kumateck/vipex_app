import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  createCustomerSvc,
  deleteCustomerSvc,
  getCustomerSvc,
  listCustomersSvc,
  updateCustomerSvc,
} from './service';

export type ListCustomersQuery = PaginationRequestDto<{
  companyId: string;
  includeDeleted?: boolean | null;
}>;

export async function listCustomersCtrl(
  q: ListCustomersQuery,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listCustomersSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? '',
    search: pagination.search ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export const getCustomerByIdCtrl = getCustomerSvc;
export const createCustomerCtrl = createCustomerSvc;
export const updateCustomerCtrl = updateCustomerSvc;
export const deleteCustomerCtrl = deleteCustomerSvc;
