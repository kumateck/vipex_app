import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { createCardSvc, deleteCardSvc, getCardSvc, listCardsSvc, updateCardSvc } from './service';

function toCardDto(l: {
  id: string;
  companyId: string;
  name: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}) {
  return {
    id: l.id,
    companyId: l.companyId,
    name: l.name,
    isDeleted: !!l.isDeleted,
    createdBy: l.createdBy,
    createdAt:
      l.createdAt && typeof l.createdAt !== 'string'
        ? l.createdAt.toISOString()
        : (l.createdAt ?? null),
    updatedAt:
      l.updatedAt && typeof l.updatedAt !== 'string'
        ? l.updatedAt.toISOString()
        : (l.updatedAt ?? null),
  };
}

export async function listCardsCtrl(
  q: PaginationRequestDto<{
    companyId?: string | null;
    includeDeleted?: boolean | null;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toCardDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });

  const { data, totalRecords } = await listCardsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters?.companyId ?? null,
    includeDeleted: q.filters?.includeDeleted ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data: data.map(toCardDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getCardByIdCtrl(id: string) {
  const l = await getCardSvc(id);
  return toCardDto(l);
}

export async function createCardCtrl(input: {
  companyId: string;
  name: string;
  createdBy: string;
}) {
  return createCardSvc(input);
}

export async function updateCardCtrl(id: string, patch: { name?: string }) {
  return updateCardSvc(id, patch);
}

export async function deleteCardCtrl(id: string) {
  return deleteCardSvc(id);
}
