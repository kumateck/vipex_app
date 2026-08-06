import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginatedResponseDto, PaginationRequestDto } from '@/server/types/pagination.types';
import { BadRequest } from '@/server/utils/http-error';
import {
  getCustomerSvc,
  postCustomerCreditPaymentSvc,
  updateCustomerSvc,
} from '../customers/service';
import { listCustomerWalletAccountsRepo, type CustomerWalletAccountRow } from './repository';

export type ListCustomerWalletAccountsQuery = PaginationRequestDto<{
  search?: string;
  creditEligible?: boolean;
  overdueOnly?: boolean;
  approvalOnly?: boolean;
}>;

function toDto(row: CustomerWalletAccountRow) {
  return {
    id: row.customerId,
    customerId: row.customerId,
    fullname: row.fullname,
    telephone: row.telephone,
    email: row.email,
    customerType: row.customerType,
    creditEligible: row.creditEligible,
    creditLimitPsw: row.creditLimitPsw,
    paymentTermsDays: row.paymentTermsDays,
    balancePsw: row.balancePsw,
    outstandingPsw: row.outstandingPsw,
    openItemsCount: row.openItemsCount,
    oldestOpenChargeAt: row.oldestOpenChargeAt?.toISOString() ?? null,
    overdueDays: row.overdueDays,
    approvalStatus: row.approvalStatus,
  };
}

export async function listCustomerWalletAccountsSvc(
  companyId: string,
  query: ListCustomerWalletAccountsQuery,
): Promise<PaginatedResponseDto<ReturnType<typeof toDto>>> {
  const pagination = normalizePagination(query, { pageSize: 20, maxPageSize: 100 });
  const { data, totalRecords } = await listCustomerWalletAccountsRepo({
    companyId,
    search: query.search?.trim() || null,
    creditEligible: query.filters?.creditEligible ?? null,
    overdueOnly: query.filters?.overdueOnly ?? false,
    approvalOnly: query.filters?.approvalOnly ?? false,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });

  return {
    data: data.map(toDto),
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function postCustomerWalletPaymentSvc(input: {
  companyId: string;
  customerId: string;
  actorUserId: string;
  amountCedis: number | string;
  notes?: string | null;
  referenceId?: string | null;
}) {
  return postCustomerCreditPaymentSvc({
    companyId: input.companyId,
    customerId: input.customerId,
    createdBy: input.actorUserId,
    amountCedis: input.amountCedis,
    notes: input.notes,
    referenceId: input.referenceId,
  });
}

export async function blockCustomerWalletAccountSvc(input: {
  companyId: string;
  customerId: string;
  actorUserId: string;
}) {
  const customer = await getCustomerSvc(input.customerId, input.companyId);
  if (!customer.creditEligible) {
    return { id: customer.id, alreadyBlocked: true };
  }

  await updateCustomerSvc(
    customer.id,
    input.companyId,
    {
      creditEligible: false,
      sourceContext: 'crm',
    },
    input.actorUserId,
  );

  return { id: customer.id, alreadyBlocked: false };
}

export async function unblockCustomerWalletAccountSvc(input: {
  companyId: string;
  customerId: string;
  actorUserId: string;
}) {
  const customer = await getCustomerSvc(input.customerId, input.companyId);
  if (customer.creditEligible) {
    return { id: customer.id, alreadyEnabled: true };
  }

  if (customer.creditLimitPsw <= 0) {
    throw BadRequest('Set a credit limit before enabling customer credit');
  }

  await updateCustomerSvc(
    customer.id,
    input.companyId,
    {
      creditEligible: true,
      sourceContext: 'crm',
    },
    input.actorUserId,
  );

  return { id: customer.id, alreadyEnabled: false };
}
