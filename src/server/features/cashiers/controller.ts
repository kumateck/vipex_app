import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  createSessionTypeSvc,
  getSessionSvc,
  listSessionTypesSvc,
  listSessionsSvc,
  openSessionSvc,
  closeSessionSvc,
  getCurrentActiveSessionSvc,
} from './service';

export async function listSessionTypesCtrl() {
  const rows = await listSessionTypesSvc();
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export const createSessionTypeCtrl = createSessionTypeSvc;

export async function listSessionsCtrl(
  q: PaginationRequestDto<{
    cashierId?: string | null;
    branchId?: string | null;
    activeOnly?: boolean | null;
  }>,
): Promise<PaginatedResponseDto<unknown>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listSessionsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    cashierId: q.filters?.cashierId ?? null,
    branchId: q.filters?.branchId ?? null,
    activeOnly: q.filters?.activeOnly ?? null,
    sort: pagination.sort ?? null,
  });
  return {
    data: data.map((s) => ({
      ...s,
      scheduledStartTime: s.scheduledStartTime.toISOString(),
      actualEndTime: s.actualEndTime ? s.actualEndTime.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export const getSessionByIdCtrl = getSessionSvc;
export const openSessionCtrl = openSessionSvc;
export const closeSessionCtrl = closeSessionSvc;

export async function getCurrentActiveSessionCtrl(input: {
  cashierId: string;
  branchId?: string | null;
}) {
  const session = await getCurrentActiveSessionSvc(input);
  if (!session) return null;
  return {
    ...session,
    scheduledStartTime: session.scheduledStartTime.toISOString(),
    actualEndTime: session.actualEndTime ? session.actualEndTime.toISOString() : null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
