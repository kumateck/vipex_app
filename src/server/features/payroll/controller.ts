import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import {
  approvePayrollCycleSvc,
  approvePayrollManualAdjustmentSvc,
  approvePayrollOvertimeEntrySvc,
  createPayrollManualAdjustmentSvc,
  createDeductionTypeSvc,
  createEarningTypeSvc,
  createPayrollOvertimeEntrySvc,
  getEmployeeCompensationSvc,
  listCompensationSvc,
  listDeductionTypesSvc,
  listEarningTypesSvc,
  listPayrollManualAdjustmentsSvc,
  createPayrollGroupSvc,
  createPayrollCycleSvc,
  getPayrollBankExportSvc,
  getPayslipDetailSvc,
  journalizePayrollCycleSvc,
  listPayrollGroupsSvc,
  listPayrollCyclesSvc,
  listPayrollOvertimeEntriesSvc,
  listPayslipsSvc,
  reopenPayrollCycleSvc,
  rejectPayrollManualAdjustmentSvc,
  rejectPayrollOvertimeEntrySvc,
  reversePayrollCycleSvc,
  runPayrollCycleSvc,
  setEmployeeCompensationSvc,
  updateDeductionTypeSvc,
  updateEarningTypeSvc,
  updatePayrollGroupSvc,
} from './service';

export async function listPayrollGroupsCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listPayrollGroupsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    includeInactive: q.filters?.includeInactive ?? null,
    search: pagination.search ?? null,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createPayrollGroupCtrl(input: Parameters<typeof createPayrollGroupSvc>[0]) {
  return createPayrollGroupSvc(input);
}

export async function listEarningTypesCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listEarningTypesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    includeInactive: q.filters?.includeInactive ?? null,
    search: pagination.search ?? null,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createEarningTypeCtrl(input: Parameters<typeof createEarningTypeSvc>[0]) {
  return createEarningTypeSvc(input);
}

export async function updateEarningTypeCtrl(
  id: string,
  companyId: string,
  patch: Parameters<typeof updateEarningTypeSvc>[2],
) {
  return updateEarningTypeSvc(id, companyId, patch);
}

export async function listDeductionTypesCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listDeductionTypesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    includeInactive: q.filters?.includeInactive ?? null,
    search: pagination.search ?? null,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createDeductionTypeCtrl(input: Parameters<typeof createDeductionTypeSvc>[0]) {
  return createDeductionTypeSvc(input);
}

export async function updateDeductionTypeCtrl(
  id: string,
  companyId: string,
  patch: Parameters<typeof updateDeductionTypeSvc>[2],
) {
  return updateDeductionTypeSvc(id, companyId, patch);
}

export async function listCompensationCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    employeeId?: string | null;
    payrollGroupId?: string | null;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listCompensationSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    employeeId: q.filters?.employeeId ?? null,
    payrollGroupId: q.filters?.payrollGroupId ?? null,
    search: pagination.search ?? null,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getEmployeeCompensationCtrl(employeeId: string, companyId: string) {
  return getEmployeeCompensationSvc(employeeId, companyId);
}

export async function setEmployeeCompensationCtrl(
  input: Parameters<typeof setEmployeeCompensationSvc>[0],
) {
  return setEmployeeCompensationSvc(input);
}

export async function updatePayrollGroupCtrl(
  id: string,
  companyId: string,
  patch: Parameters<typeof updatePayrollGroupSvc>[2],
) {
  return updatePayrollGroupSvc(id, companyId, patch);
}

export async function listPayrollCyclesCtrl(
  q: PaginationRequestDto<{ companyId: string; branchId?: string | null; status?: number | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listPayrollCyclesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    branchId: q.filters?.branchId ?? null,
    status: q.filters?.status ?? null,
    sort: pagination.sort ?? null,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function createPayrollCycleCtrl(input: Parameters<typeof createPayrollCycleSvc>[0]) {
  return createPayrollCycleSvc(input);
}

export async function listPayrollOvertimeEntriesCtrl(payrollCycleId: string, companyId: string) {
  return listPayrollOvertimeEntriesSvc({ payrollCycleId, companyId });
}

export async function createPayrollOvertimeEntryCtrl(
  input: Parameters<typeof createPayrollOvertimeEntrySvc>[0],
) {
  return createPayrollOvertimeEntrySvc(input);
}

export async function listPayrollManualAdjustmentsCtrl(payrollCycleId: string, companyId: string) {
  return listPayrollManualAdjustmentsSvc({ payrollCycleId, companyId });
}

export async function createPayrollManualAdjustmentCtrl(
  input: Parameters<typeof createPayrollManualAdjustmentSvc>[0],
) {
  return createPayrollManualAdjustmentSvc(input);
}

export async function approvePayrollOvertimeEntryCtrl(
  payrollCycleId: string,
  entryId: string,
  approvedBy: string,
) {
  return approvePayrollOvertimeEntrySvc(payrollCycleId, entryId, approvedBy);
}

export async function rejectPayrollOvertimeEntryCtrl(
  payrollCycleId: string,
  entryId: string,
  approvedBy: string,
  reason?: string | null,
) {
  return rejectPayrollOvertimeEntrySvc(payrollCycleId, entryId, approvedBy, reason);
}

export async function approvePayrollManualAdjustmentCtrl(
  payrollCycleId: string,
  entryId: string,
  approvedBy: string,
) {
  return approvePayrollManualAdjustmentSvc(payrollCycleId, entryId, approvedBy);
}

export async function rejectPayrollManualAdjustmentCtrl(
  payrollCycleId: string,
  entryId: string,
  approvedBy: string,
  reason?: string | null,
) {
  return rejectPayrollManualAdjustmentSvc(payrollCycleId, entryId, approvedBy, reason);
}

export async function runPayrollCycleCtrl(id: string, initiatedBy: string) {
  return runPayrollCycleSvc(id, initiatedBy);
}

export async function approvePayrollCycleCtrl(
  id: string,
  approvedBy: string,
  comments?: string | null,
) {
  return approvePayrollCycleSvc(id, approvedBy, comments);
}

export async function journalizePayrollCycleCtrl(id: string, postedBy: string) {
  return journalizePayrollCycleSvc(id, postedBy);
}

export async function reopenPayrollCycleCtrl(id: string, reopenedBy: string) {
  return reopenPayrollCycleSvc(id, reopenedBy);
}

export async function reversePayrollCycleCtrl(id: string, reversedBy: string) {
  return reversePayrollCycleSvc(id, reversedBy);
}

export async function getPayrollBankExportCtrl(payrollCycleId: string) {
  return getPayrollBankExportSvc(payrollCycleId);
}

export async function listPayslipsCtrl(
  payrollCycleId: string,
  q: PaginationRequestDto<{ employeeId?: string | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listPayslipsSvc({
    payrollCycleId,
    employeeId: q.filters?.employeeId ?? null,
    limit: pagination.pageSize,
    offset: pagination.offset,
  });

  return {
    data,
    meta: buildPaginationMeta({
      totalRecords,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  };
}

export async function getPayslipDetailCtrl(payslipId: string) {
  return getPayslipDetailSvc(payslipId);
}
