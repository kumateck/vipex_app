import { buildPaginationMeta, normalizePagination } from '@/server/utils/pagination';
import type { PaginationRequestDto } from '@/server/types/pagination.types';
import {
  checkInAttendanceSvc,
  checkOutAttendanceSvc,
  createDepartmentSvc,
  createEmployeeSvc,
  createEmployeeUserAccountSvc,
  createJobTitleSvc,
  createLeaveRequestSvc,
  createLeaveSwapSvc,
  createLeaveTypeSvc,
  getEmployeeSvc,
  listDepartmentOptionsSvc,
  listDepartmentsSvc,
  listAttendanceSvc,
  listEmployeesSvc,
  listEmployeeOptionsSvc,
  listJobTitleOptionsSvc,
  listJobTitlesSvc,
  listLeaveRequestsSvc,
  listLeaveCalendarSvc,
  listLeaveSwapsSvc,
  listLeaveTypeOptionsSvc,
  listLeaveTypesSvc,
  approveLeaveRequestSvc,
  approveLeaveRequestByManagerSvc,
  rejectLeaveRequestSvc,
  rejectLeaveRequestByManagerSvc,
  rejectLeaveSwapSvc,
  confirmLeaveSwapSvc,
  approveLeaveSwapSvc,
  updateDepartmentSvc,
  updateEmployeeSvc,
  updateJobTitleSvc,
  updateLeaveRequestSvc,
} from './service';

export async function listDepartmentsCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listDepartmentsSvc({
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

export async function listDepartmentOptionsCtrl(companyId: string, search?: string | null) {
  return listDepartmentOptionsSvc(companyId, search);
}

export async function createDepartmentCtrl(input: Parameters<typeof createDepartmentSvc>[0]) {
  return createDepartmentSvc(input);
}

export async function updateDepartmentCtrl(
  id: string,
  companyId: string,
  patch: Parameters<typeof updateDepartmentSvc>[2],
) {
  return updateDepartmentSvc(id, companyId, patch);
}

export async function listJobTitlesCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listJobTitlesSvc({
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

export async function listJobTitleOptionsCtrl(companyId: string, search?: string | null) {
  return listJobTitleOptionsSvc(companyId, search);
}

export async function createJobTitleCtrl(input: Parameters<typeof createJobTitleSvc>[0]) {
  return createJobTitleSvc(input);
}

export async function listLeaveTypesCtrl(
  q: PaginationRequestDto<{ companyId: string; includeInactive?: boolean | null }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listLeaveTypesSvc({
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

export async function listLeaveTypeOptionsCtrl(companyId: string) {
  return listLeaveTypeOptionsSvc(companyId);
}

export async function createLeaveTypeCtrl(input: Parameters<typeof createLeaveTypeSvc>[0]) {
  return createLeaveTypeSvc(input);
}

export async function approveLeaveRequestByManagerCtrl(id: string, approvedBy: string) {
  return approveLeaveRequestByManagerSvc(id, approvedBy);
}

export async function updateJobTitleCtrl(
  id: string,
  companyId: string,
  patch: Parameters<typeof updateJobTitleSvc>[2],
) {
  return updateJobTitleSvc(id, companyId, patch);
}

export async function listEmployeesCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    branchId?: string | null;
    departmentId?: string | null;
    jobTitleId?: string | null;
    officerEmployeeId?: string | null;
    status?: number | null;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listEmployeesSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    branchId: q.filters?.branchId ?? null,
    departmentId: q.filters?.departmentId ?? null,
    jobTitleId: q.filters?.jobTitleId ?? null,
    officerEmployeeId: q.filters?.officerEmployeeId ?? null,
    status: q.filters?.status ?? null,
    search: pagination.search ?? null,
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

export async function listEmployeeOptionsCtrl(input: {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  officerEmployeeId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  return listEmployeeOptionsSvc(input);
}

export async function getEmployeeCtrl(id: string) {
  return getEmployeeSvc(id);
}

export async function createEmployeeCtrl(input: Parameters<typeof createEmployeeSvc>[0]) {
  return createEmployeeSvc(input);
}

export async function updateEmployeeCtrl(
  id: string,
  patch: Parameters<typeof updateEmployeeSvc>[1],
  actorUserId?: string | null,
) {
  return updateEmployeeSvc(id, patch, actorUserId);
}

export async function checkInAttendanceCtrl(input: Parameters<typeof checkInAttendanceSvc>[0]) {
  return checkInAttendanceSvc(input);
}

export async function checkOutAttendanceCtrl(input: Parameters<typeof checkOutAttendanceSvc>[0]) {
  return checkOutAttendanceSvc(input);
}

export async function listAttendanceCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    employeeId?: string | null;
    branchId?: string | null;
    from: Date;
    to: Date;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listAttendanceSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    employeeId: q.filters?.employeeId ?? null,
    branchId: q.filters?.branchId ?? null,
    from: q.filters!.from,
    to: q.filters!.to,
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

export async function listLeaveRequestsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    employeeId?: string | null;
    leaveTypeId?: string | null;
    status?: number | null;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listLeaveRequestsSvc({
    limit: pagination.pageSize,
    offset: pagination.offset,
    companyId: q.filters!.companyId,
    employeeId: q.filters?.employeeId ?? null,
    leaveTypeId: q.filters?.leaveTypeId ?? null,
    status: q.filters?.status ?? null,
    dateFrom: q.dateFrom ? new Date(q.dateFrom) : null,
    dateTo: q.dateTo ? new Date(q.dateTo) : null,
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

export async function listLeaveCalendarCtrl(input: {
  companyId: string;
  from: Date;
  to: Date;
  employeeId?: string | null;
  status?: number | null;
  branchId?: string | null;
  departmentId?: string | null;
}) {
  return listLeaveCalendarSvc(input);
}

export async function createLeaveRequestCtrl(input: Parameters<typeof createLeaveRequestSvc>[0]) {
  return createLeaveRequestSvc(input);
}

export async function updateLeaveRequestCtrl(
  id: string,
  companyId: string,
  input: Parameters<typeof updateLeaveRequestSvc>[2],
) {
  return updateLeaveRequestSvc(id, companyId, input);
}

export async function createLeaveSwapCtrl(input: Parameters<typeof createLeaveSwapSvc>[0]) {
  return createLeaveSwapSvc(input);
}

export async function listLeaveSwapsCtrl(
  q: PaginationRequestDto<{
    companyId: string;
    employeeId?: string | null;
    status?: number | null;
  }>,
) {
  const pagination = normalizePagination(q, { pageSize: 20 });
  const { data, totalRecords } = await listLeaveSwapsSvc({
    companyId: q.filters!.companyId,
    employeeId: q.filters?.employeeId ?? null,
    status: q.filters?.status ?? null,
    from: q.dateFrom ? new Date(q.dateFrom) : null,
    to: q.dateTo ? new Date(q.dateTo) : null,
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

export async function confirmLeaveSwapCtrl(id: string, actorUserId: string) {
  return confirmLeaveSwapSvc(id, actorUserId);
}

export async function approveLeaveSwapCtrl(id: string, actorUserId: string) {
  return approveLeaveSwapSvc(id, actorUserId);
}

export async function rejectLeaveSwapCtrl(id: string, actorUserId: string, reason?: string | null) {
  return rejectLeaveSwapSvc(id, actorUserId, reason);
}

export async function approveLeaveRequestCtrl(id: string, approvedBy: string) {
  return approveLeaveRequestSvc(id, approvedBy);
}

export async function rejectLeaveRequestByManagerCtrl(
  id: string,
  approvedBy: string,
  reason?: string | null,
) {
  return rejectLeaveRequestByManagerSvc(id, approvedBy, reason);
}

export async function rejectLeaveRequestCtrl(
  id: string,
  approvedBy: string,
  reason?: string | null,
) {
  return rejectLeaveRequestSvc(id, approvedBy, reason);
}

export async function createEmployeeUserAccountCtrl(
  input: Parameters<typeof createEmployeeUserAccountSvc>[0],
) {
  return createEmployeeUserAccountSvc(input);
}
