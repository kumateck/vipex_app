import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto, PaginatedResponseDto } from '@/server/types/pagination.types';
import {
  approveBankSettlementSvc,
  approveReconciliationSessionSvc,
  createBankSettlementSvc,
  createReconciliationSessionSvc,
  finalizeReconciliationSessionSvc,
  listBankSettlementsSvc,
  listReconciliationBranchOptionsSvc,
  listReconciliationSessionsSvc,
  rejectBankSettlementSvc,
} from './service';

function toSessionDto(row: {
  id: string;
  branchId: string;
  branchName: string | null;
  cashierUserId: string | null;
  cashierName: string | null;
  confirmationDate: Date;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  notes: string | null;
  status: number;
  confirmedAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    confirmationDate: row.confirmationDate.toISOString(),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    postedAt: row.postedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBankSettlementDto(row: {
  id: string;
  settlementNo: string;
  settlementDate: Date;
  branchId: string;
  branchName: string | null;
  bankReference: string | null;
  expectedAmountPsw: number;
  bankedAmountPsw: number;
  variancePsw: number;
  notes: string | null;
  status: number;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    settlementDate: row.settlementDate.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listReconciliationSessionsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    branchId?: string;
    pendingOnly?: boolean;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toSessionDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listReconciliationSessionsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    branchId: q.filters?.branchId ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map(toSessionDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createReconciliationSessionCtrl(input: {
  companyId: string;
  createdBy: string;
  branchId: string;
  confirmationDate: string;
  expectedCashCedis: number | string;
  countedCashCedis: number | string;
  notes?: string | null;
  cashierUserId?: string | null;
}) {
  return createReconciliationSessionSvc(input);
}

export async function approveReconciliationSessionCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approveReconciliationSessionSvc(input);
}

export async function finalizeReconciliationSessionCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return finalizeReconciliationSessionSvc(input);
}

export async function listBankSettlementsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    search?: string;
    status?: number;
    branchId?: string;
    pendingOnly?: boolean;
  }>,
): Promise<PaginatedResponseDto<ReturnType<typeof toBankSettlementDto>>> {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listBankSettlementsSvc({
    companyId: q.filters!.companyId,
    limit: pagination.pageSize,
    offset: pagination.offset,
    search: q.filters?.search ?? null,
    status: q.filters?.status ?? null,
    branchId: q.filters?.branchId ?? null,
    pendingOnly: q.filters?.pendingOnly ?? null,
  });

  return {
    data: data.map(toBankSettlementDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createBankSettlementCtrl(input: {
  companyId: string;
  submittedByUserId: string;
  branchId: string;
  settlementDate: string;
  settlementNo?: string | null;
  bankReference?: string | null;
  expectedAmountPsw: number;
  bankedAmountPsw: number;
  notes?: string | null;
}) {
  return createBankSettlementSvc(input);
}

export async function approveBankSettlementCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  return approveBankSettlementSvc(input);
}

export async function rejectBankSettlementCtrl(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  return rejectBankSettlementSvc(input);
}

export async function listReconciliationBranchOptionsCtrl(companyId: string) {
  return listReconciliationBranchOptionsSvc(companyId);
}
