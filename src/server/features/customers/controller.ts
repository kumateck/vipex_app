import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import {
  addCustomerCardSvc,
  createCustomerSvc,
  deleteCustomerSvc,
  findCustomersByTelephoneSvc,
  getCustomerPaymentsMonthlySvc,
  getCustomerTransactionsMonthlySvc,
  listCustomerCreditOpenItemsSvc,
  getCustomerCreditSummarySvc,
  listCustomerPaymentsSvc,
  getCustomerStatementSvc,
  getCustomerSvc,
  listCardOptionsSvc,
  listCustomerCardsSvc,
  listCustomerCreditTransactionsSvc,
  listCustomerTransactionsSvc,
  listCustomersSvc,
  postCustomerCreditPaymentSvc,
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

export const getCustomerByIdCtrl = (id: string, companyId: string) => getCustomerSvc(id, companyId);
export const createCustomerCtrl = createCustomerSvc;
export const updateCustomerCtrl = (
  id: string,
  companyId: string,
  patch: {
    fullname?: string;
    telephone?: string | null;
    telephone2?: string | null;
    address?: string | null;
    email?: string | null;
    customerType?: number;
    creditEligible?: boolean;
    creditLimitPsw?: number;
    paymentTermsDays?: number;
    isNiaVerified?: boolean;
    loggedToGovernment?: boolean;
    sourceContext?: 'crm' | 'default';
  },
  actorUserId?: string | null,
) => updateCustomerSvc(id, companyId, patch, actorUserId);
export const deleteCustomerCtrl = (id: string, companyId: string, actorUserId?: string | null) =>
  deleteCustomerSvc(id, companyId, actorUserId);
export const findCustomersByTelephoneCtrl = findCustomersByTelephoneSvc;
export const listCustomerCardsCtrl = listCustomerCardsSvc;
export const listCardOptionsCtrl = listCardOptionsSvc;
export const addCustomerCardCtrl = addCustomerCardSvc;
export const listCustomerCreditTransactionsCtrl = listCustomerCreditTransactionsSvc;
export const getCustomerCreditSummaryCtrl = getCustomerCreditSummarySvc;
export const postCustomerCreditPaymentCtrl = postCustomerCreditPaymentSvc;
export const getCustomerStatementCtrl = getCustomerStatementSvc;
export const listCustomerCreditOpenItemsCtrl = listCustomerCreditOpenItemsSvc;
export const getCustomerPaymentsMonthlyCtrl = getCustomerPaymentsMonthlySvc;
export const getCustomerTransactionsMonthlyCtrl = getCustomerTransactionsMonthlySvc;

export async function listCustomerTransactionsCtrl(input: {
  customerId: string;
  companyId: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const pagination = normalizePagination(
    { page: input.page, pageSize: input.pageSize },
    { pageSize: 30, maxPageSize: 100 },
  );
  const { data, totalRecords } = await listCustomerTransactionsSvc({
    customerId: input.customerId,
    companyId: input.companyId,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function listCustomerPaymentsCtrl(input: {
  customerId: string;
  companyId: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const pagination = normalizePagination(
    { page: input.page, pageSize: input.pageSize },
    { pageSize: 30, maxPageSize: 100 },
  );
  const { data, totalRecords } = await listCustomerPaymentsSvc({
    customerId: input.customerId,
    companyId: input.companyId,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  return {
    data: data.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}
