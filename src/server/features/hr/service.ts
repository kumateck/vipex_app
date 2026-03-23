import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import {
  ApprovalStatus,
  AttendanceStatus,
  EmploymentStatus,
  LeaveRequestStatus,
  UserStatus,
  UserType,
} from '@/db/schemas/enums';
import { recordAuditLog } from '../audit/logger';
import { getUserByIdRepo } from '../auth/repository';
import { createUserSvc } from '../users/service';
import {
  createDepartmentRepo,
  createAttendanceRepo,
  createEmployeeAssignmentRepo,
  createEmployeeRepo,
  createJobTitleRepo,
  createLeaveRequestRepo,
  createLeaveTypeRepo,
  findDepartmentByNameRepo,
  findAttendanceByEmployeeDateRepo,
  findEmployeeByNumberRepo,
  findLeaveTypeByNameRepo,
  findJobTitleByNameRepo,
  findUserByEmployeeIdRepo,
  getDepartmentRepo,
  getEmployeeRepo,
  getJobTitleRepo,
  getLeaveRequestRepo,
  getLeaveTypeRepo,
  listDepartmentOptionsRepo,
  listDepartmentsRepo,
  listAttendanceRepo,
  listEmployeesRepo,
  listJobTitleOptionsRepo,
  listJobTitlesRepo,
  listLeaveRequestsRepo,
  listLeaveTypeOptionsRepo,
  listLeaveTypesRepo,
  updateAttendanceRepo,
  updateDepartmentRepo,
  updateEmployeeHasUserAccountRepo,
  updateEmployeeRepo,
  updateJobTitleRepo,
  updateLeaveRequestRepo,
  type ListDepartmentParams,
  type ListAttendanceParams,
  type ListEmployeeParams,
  type ListJobTitleParams,
  type ListLeaveRequestParams,
  type ListLeaveTypeParams,
} from './repository';

export async function listDepartmentsSvc(p: ListDepartmentParams) {
  return listDepartmentsRepo(p);
}

export async function listDepartmentOptionsSvc(companyId: string, search?: string | null) {
  return listDepartmentOptionsRepo(companyId, search);
}

export async function createDepartmentSvc(input: {
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const duplicate = await findDepartmentByNameRepo(input.companyId, input.name);
  if (duplicate) throw Conflict('Department name already exists');
  const created = await createDepartmentRepo({
    companyId: input.companyId,
    code: input.code ?? null,
    name: input.name,
    description: input.description ?? null,
    createdBy: input.createdBy,
  });
  return { id: created?.id };
}

export async function updateDepartmentSvc(
  id: string,
  companyId: string,
  patch: { code?: string | null; name?: string; description?: string | null; isActive?: boolean },
) {
  const current = await getDepartmentRepo(id);
  if (!current || current.companyId !== companyId) throw NotFound('Department not found');
  if (patch.name && patch.name !== current.name) {
    const duplicate = await findDepartmentByNameRepo(companyId, patch.name);
    if (duplicate && duplicate.id !== id) throw Conflict('Department name already exists');
  }
  const updated = await updateDepartmentRepo(id, patch);
  return { id: updated?.id };
}

export async function listJobTitlesSvc(p: ListJobTitleParams) {
  return listJobTitlesRepo(p);
}

export async function listJobTitleOptionsSvc(companyId: string, search?: string | null) {
  return listJobTitleOptionsRepo(companyId, search);
}

export async function listLeaveTypesSvc(p: ListLeaveTypeParams) {
  return listLeaveTypesRepo(p);
}

export async function listLeaveTypeOptionsSvc(companyId: string) {
  return listLeaveTypeOptionsRepo(companyId);
}

export async function createLeaveTypeSvc(input: {
  companyId: string;
  code?: string | null;
  name: string;
  isPaid?: boolean;
  createdBy: string;
}) {
  const duplicate = await findLeaveTypeByNameRepo(input.companyId, input.name);
  if (duplicate) throw Conflict('Leave type name already exists');
  const created = await createLeaveTypeRepo({
    companyId: input.companyId,
    code: input.code ?? null,
    name: input.name.trim(),
    isPaid: input.isPaid ?? true,
    createdBy: input.createdBy,
  });
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'leave_type',
    entityId: created?.id ?? null,
    action: 'LEAVE_TYPE_CREATED',
    message: 'Leave type created',
    metadata: { code: input.code ?? null, name: input.name.trim(), isPaid: input.isPaid ?? true },
  });
  return { id: created?.id };
}

export async function createJobTitleSvc(input: {
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const duplicate = await findJobTitleByNameRepo(input.companyId, input.name);
  if (duplicate) throw Conflict('Job title name already exists');
  const created = await createJobTitleRepo({
    companyId: input.companyId,
    code: input.code ?? null,
    name: input.name,
    description: input.description ?? null,
    createdBy: input.createdBy,
  });
  return { id: created?.id };
}

export async function updateJobTitleSvc(
  id: string,
  companyId: string,
  patch: { code?: string | null; name?: string; description?: string | null; isActive?: boolean },
) {
  const current = await getJobTitleRepo(id);
  if (!current || current.companyId !== companyId) throw NotFound('Job title not found');
  if (patch.name && patch.name !== current.name) {
    const duplicate = await findJobTitleByNameRepo(companyId, patch.name);
    if (duplicate && duplicate.id !== id) throw Conflict('Job title name already exists');
  }
  const updated = await updateJobTitleRepo(id, patch);
  return { id: updated?.id };
}

export async function listEmployeesSvc(p: ListEmployeeParams) {
  return listEmployeesRepo(p);
}

export async function getEmployeeSvc(id: string) {
  const employee = await getEmployeeRepo(id);
  if (!employee || employee.isDeleted) throw NotFound('Employee not found');
  return employee;
}

function normalizeSettlementField(value?: string | null) {
  return value?.trim() || null;
}

function validateSettlementDetails(input: {
  paymentMethod?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyNumber?: string | null;
}) {
  const paymentMethod = normalizeSettlementField(input.paymentMethod)?.toLowerCase() ?? null;
  const bankName = normalizeSettlementField(input.bankName);
  const bankAccountName = normalizeSettlementField(input.bankAccountName);
  const bankAccountNumber = normalizeSettlementField(input.bankAccountNumber);
  const mobileMoneyNumber = normalizeSettlementField(input.mobileMoneyNumber);

  if (!paymentMethod) {
    return {
      paymentMethod: null,
      bankName,
      bankAccountName,
      bankAccountNumber,
      mobileMoneyNumber,
    };
  }

  if (!['cash', 'bank', 'mobile_money'].includes(paymentMethod)) {
    throw BadRequest('Payment method must be cash, bank, or mobile_money');
  }

  if (paymentMethod === 'bank') {
    if (!bankName || !bankAccountName || !bankAccountNumber) {
      throw BadRequest('Bank payment method requires bank name, account name, and account number');
    }
  }

  if (paymentMethod === 'mobile_money' && !mobileMoneyNumber) {
    throw BadRequest('Mobile money payment method requires mobile money number');
  }

  return {
    paymentMethod,
    bankName,
    bankAccountName,
    bankAccountNumber,
    mobileMoneyNumber,
  };
}

export async function createEmployeeSvc(input: {
  companyId: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  telephone: string;
  paymentMethod?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyNumber?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  managerEmployeeId?: string | null;
  employmentStatus?: number;
  employmentType?: number;
  hireDate: Date;
  createdBy: string;
}) {
  const duplicate = await findEmployeeByNumberRepo(input.companyId, input.employeeNumber);
  if (duplicate && !duplicate.isDeleted) {
    throw Conflict('Employee number already exists');
  }
  const settlement = validateSettlementDetails(input);

  const displayName = [input.firstName, input.middleName ?? null, input.lastName]
    .filter(Boolean)
    .join(' ');

  const created = await createEmployeeRepo({
    companyId: input.companyId,
    employeeNumber: input.employeeNumber,
    firstName: input.firstName,
    middleName: input.middleName ?? null,
    lastName: input.lastName,
    displayName,
    email: input.email ?? null,
    telephone: input.telephone,
    paymentMethod: settlement.paymentMethod,
    bankName: settlement.bankName,
    bankAccountName: settlement.bankAccountName,
    bankAccountNumber: settlement.bankAccountNumber,
    mobileMoneyNumber: settlement.mobileMoneyNumber,
    branchId: input.branchId ?? null,
    locationId: input.locationId ?? null,
    departmentId: input.departmentId ?? null,
    jobTitleId: input.jobTitleId ?? null,
    managerEmployeeId: input.managerEmployeeId ?? null,
    employmentStatus: input.employmentStatus ?? EmploymentStatus.ACTIVE,
    employmentType: input.employmentType,
    hireDate: input.hireDate,
    createdBy: input.createdBy,
  });

  if (created?.id) {
    await createEmployeeAssignmentRepo({
      companyId: input.companyId,
      employeeId: created.id,
      branchId: input.branchId ?? null,
      locationId: input.locationId ?? null,
      departmentId: input.departmentId ?? null,
      jobTitleId: input.jobTitleId ?? null,
      managerEmployeeId: input.managerEmployeeId ?? null,
      effectiveFrom: input.hireDate,
      reason: 'Initial assignment',
      createdBy: input.createdBy,
    });
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'employee',
    entityId: created?.id ?? null,
    action: 'EMPLOYEE_CREATED',
    message: 'Employee created',
    metadata: {
      employeeNumber: input.employeeNumber,
      displayName,
    },
  });

  return { id: created?.id };
}

export async function updateEmployeeSvc(
  id: string,
  patch: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
    email?: string | null;
    telephone?: string;
    paymentMethod?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    mobileMoneyNumber?: string | null;
    branchId?: string | null;
    locationId?: string | null;
    departmentId?: string | null;
    jobTitleId?: string | null;
    managerEmployeeId?: string | null;
    employmentStatus?: number;
    employmentType?: number;
    confirmationDate?: Date | null;
    terminationDate?: Date | null;
    terminationReason?: string | null;
  },
  actorUserId?: string | null,
) {
  const current = await getEmployeeSvc(id);
  const settlement = validateSettlementDetails({
    paymentMethod: patch.paymentMethod ?? current.paymentMethod ?? null,
    bankName: patch.bankName ?? current.bankName ?? null,
    bankAccountName: patch.bankAccountName ?? current.bankAccountName ?? null,
    bankAccountNumber: patch.bankAccountNumber ?? current.bankAccountNumber ?? null,
    mobileMoneyNumber: patch.mobileMoneyNumber ?? current.mobileMoneyNumber ?? null,
  });
  const nextFirstName = patch.firstName ?? current.firstName;
  const nextMiddleName = patch.middleName !== undefined ? patch.middleName : current.middleName;
  const nextLastName = patch.lastName ?? current.lastName;

  const updated = await updateEmployeeRepo(id, {
    ...patch,
    paymentMethod: settlement.paymentMethod,
    bankName: settlement.bankName,
    bankAccountName: settlement.bankAccountName,
    bankAccountNumber: settlement.bankAccountNumber,
    mobileMoneyNumber: settlement.mobileMoneyNumber,
    displayName: [nextFirstName, nextMiddleName ?? null, nextLastName].filter(Boolean).join(' '),
  });

  if (!updated) throw NotFound('Employee not found');

  await recordAuditLog({
    companyId: current.companyId,
    actorUserId: actorUserId ?? null,
    entityType: 'employee',
    entityId: id,
    action: 'EMPLOYEE_UPDATED',
    message: 'Employee updated',
    metadata: { patch },
  });

  return { id: updated.id };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function checkInAttendanceSvc(input: {
  companyId: string;
  employeeId: string;
  branchId?: string | null;
  locationId?: string | null;
  checkedInAt?: Date;
}) {
  await getEmployeeSvc(input.employeeId);
  const checkedInAt = input.checkedInAt ?? new Date();
  const attendanceDate = startOfDay(checkedInAt);
  const existing = await findAttendanceByEmployeeDateRepo(input.employeeId, attendanceDate);
  if (existing?.checkInAt) throw Conflict('Employee is already checked in for this date');

  if (existing) {
    const updated = await updateAttendanceRepo(existing.id, {
      checkInAt: checkedInAt,
      status: AttendanceStatus.PRESENT,
      branchId: input.branchId ?? existing.branchId ?? null,
      locationId: input.locationId ?? null,
    });
    return { id: updated?.id ?? existing.id };
  }

  const created = await createAttendanceRepo({
    companyId: input.companyId,
    employeeId: input.employeeId,
    branchId: input.branchId ?? null,
    locationId: input.locationId ?? null,
    attendanceDate,
    checkInAt: checkedInAt,
    status: AttendanceStatus.PRESENT,
    source: 'manual',
  });

  return { id: created?.id };
}

export async function checkOutAttendanceSvc(input: { employeeId: string; checkedOutAt?: Date }) {
  await getEmployeeSvc(input.employeeId);
  const checkedOutAt = input.checkedOutAt ?? new Date();
  const attendanceDate = startOfDay(checkedOutAt);
  const existing = await findAttendanceByEmployeeDateRepo(input.employeeId, attendanceDate);
  if (!existing) throw NotFound('Attendance record not found for this date');

  const minutesWorked =
    existing.checkInAt instanceof Date
      ? Math.max(0, Math.round((checkedOutAt.getTime() - existing.checkInAt.getTime()) / 60000))
      : null;

  const updated = await updateAttendanceRepo(existing.id, {
    checkOutAt: checkedOutAt,
    minutesWorked,
  });

  return { id: updated?.id ?? existing.id };
}

export async function listAttendanceSvc(p: ListAttendanceParams) {
  return listAttendanceRepo(p);
}

function differenceInDaysInclusive(dateFrom: Date, dateTo: Date) {
  const start = startOfDay(dateFrom).getTime();
  const end = startOfDay(dateTo).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export async function listLeaveRequestsSvc(p: ListLeaveRequestParams) {
  return listLeaveRequestsRepo(p);
}

export async function createLeaveRequestSvc(input: {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  dateFrom: Date;
  dateTo: Date;
  reason?: string | null;
  createdBy: string;
}) {
  const employee = await getEmployeeSvc(input.employeeId);
  if (employee.companyId !== input.companyId) throw NotFound('Employee not found');

  const leaveType = await getLeaveTypeRepo(input.leaveTypeId);
  if (!leaveType || leaveType.companyId !== input.companyId || !leaveType.isActive) {
    throw NotFound('Leave type not found');
  }
  if (input.dateTo < input.dateFrom) throw Conflict('Leave end date cannot be before start date');
  const managerApprovalStatus = employee.managerEmployeeId
    ? ApprovalStatus.PENDING
    : ApprovalStatus.APPROVED;

  const created = await createLeaveRequestRepo({
    companyId: input.companyId,
    employeeId: input.employeeId,
    leaveTypeId: input.leaveTypeId,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    daysCount: differenceInDaysInclusive(input.dateFrom, input.dateTo),
    reason: input.reason ?? null,
    managerApprovalStatus,
    managerApprovedAt: managerApprovalStatus === ApprovalStatus.APPROVED ? new Date() : null,
    status: LeaveRequestStatus.PENDING,
    createdBy: input.createdBy,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'leave_request',
    entityId: created?.id ?? null,
    action: 'LEAVE_REQUEST_CREATED',
    message: 'Leave request created',
    metadata: {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      dateFrom: input.dateFrom.toISOString(),
      dateTo: input.dateTo.toISOString(),
      managerApprovalStatus,
    },
  });

  return { id: created?.id };
}

async function assertManagerCanApproveLeaveRequest(
  request: { managerEmployeeId?: string | null },
  actorUserId: string,
) {
  const actor = await getUserByIdRepo(actorUserId);
  if (!actor?.employeeId) throw Forbidden('Current user is not linked to an employee record');
  if (!request.managerEmployeeId) {
    throw Conflict('This leave request does not require manager approval');
  }
  if (request.managerEmployeeId !== actor.employeeId) {
    throw Forbidden('Only the assigned manager can approve this leave request');
  }
}

export async function approveLeaveRequestByManagerSvc(id: string, approvedBy: string) {
  const request = await getLeaveRequestRepo(id);
  if (!request) throw NotFound('Leave request not found');
  if (request.status !== LeaveRequestStatus.PENDING) {
    throw Conflict('Only pending leave requests can be manager-approved');
  }
  if (request.managerApprovalStatus !== ApprovalStatus.PENDING) {
    throw Conflict('Manager approval has already been decided');
  }

  await assertManagerCanApproveLeaveRequest(request, approvedBy);

  const updated = await updateLeaveRequestRepo(id, {
    managerApprovalStatus: ApprovalStatus.APPROVED,
    managerApprovedBy: approvedBy,
    managerApprovedAt: new Date(),
    managerRejectionReason: null,
  });
  await recordAuditLog({
    companyId: request.companyId,
    actorUserId: approvedBy,
    entityType: 'leave_request',
    entityId: id,
    action: 'LEAVE_REQUEST_MANAGER_APPROVED',
    message: 'Leave request approved by manager',
    metadata: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId },
  });
  return { id: updated?.id };
}

export async function approveLeaveRequestSvc(id: string, approvedBy: string) {
  const request = await getLeaveRequestRepo(id);
  if (!request) throw NotFound('Leave request not found');
  if (request.status !== LeaveRequestStatus.PENDING) {
    throw Conflict('Only pending leave requests can be approved');
  }
  if (request.managerApprovalStatus !== ApprovalStatus.APPROVED) {
    throw Conflict('Leave request must be manager-approved before final approval');
  }

  const updated = await updateLeaveRequestRepo(id, {
    status: LeaveRequestStatus.APPROVED,
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: null,
  });
  await recordAuditLog({
    companyId: request.companyId,
    actorUserId: approvedBy,
    entityType: 'leave_request',
    entityId: id,
    action: 'LEAVE_REQUEST_APPROVED',
    message: 'Leave request approved',
    metadata: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId },
  });
  return { id: updated?.id };
}

export async function rejectLeaveRequestByManagerSvc(
  id: string,
  approvedBy: string,
  reason?: string | null,
) {
  const request = await getLeaveRequestRepo(id);
  if (!request) throw NotFound('Leave request not found');
  if (request.status !== LeaveRequestStatus.PENDING) {
    throw Conflict('Only pending leave requests can be manager-rejected');
  }
  if (request.managerApprovalStatus !== ApprovalStatus.PENDING) {
    throw Conflict('Manager approval has already been decided');
  }

  await assertManagerCanApproveLeaveRequest(request, approvedBy);

  const updated = await updateLeaveRequestRepo(id, {
    managerApprovalStatus: ApprovalStatus.REJECTED,
    managerApprovedBy: approvedBy,
    managerApprovedAt: new Date(),
    managerRejectionReason: reason ?? null,
    status: LeaveRequestStatus.REJECTED,
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: reason ?? null,
  });
  await recordAuditLog({
    companyId: request.companyId,
    actorUserId: approvedBy,
    entityType: 'leave_request',
    entityId: id,
    action: 'LEAVE_REQUEST_MANAGER_REJECTED',
    message: 'Leave request rejected by manager',
    metadata: {
      employeeId: request.employeeId,
      leaveTypeId: request.leaveTypeId,
      reason: reason ?? null,
    },
  });
  return { id: updated?.id };
}

export async function rejectLeaveRequestSvc(
  id: string,
  approvedBy: string,
  reason?: string | null,
) {
  const request = await getLeaveRequestRepo(id);
  if (!request) throw NotFound('Leave request not found');
  if (request.status !== LeaveRequestStatus.PENDING) {
    throw Conflict('Only pending leave requests can be rejected');
  }

  const updated = await updateLeaveRequestRepo(id, {
    status: LeaveRequestStatus.REJECTED,
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: reason ?? null,
  });
  await recordAuditLog({
    companyId: request.companyId,
    actorUserId: approvedBy,
    entityType: 'leave_request',
    entityId: id,
    action: 'LEAVE_REQUEST_REJECTED',
    message: 'Leave request rejected',
    metadata: {
      employeeId: request.employeeId,
      leaveTypeId: request.leaveTypeId,
      reason: reason ?? null,
    },
  });
  return { id: updated?.id };
}

export async function createEmployeeUserAccountSvc(input: {
  employeeId: string;
  roleId: string;
  branchId: string;
  locationId?: string | null;
  actor: {
    companyId?: string | null;
    branchId?: string | null;
    branchType?: number | null;
    locationId?: string | null;
  };
  createdBy: string;
}) {
  const employee = await getEmployeeSvc(input.employeeId);
  const existingUser = await findUserByEmployeeIdRepo(input.employeeId);
  if (existingUser) throw Conflict('Employee already has a linked user account');
  if (!employee.email)
    throw Conflict('Employee must have an email address to create a user account');
  if (!employee.branchId && !input.branchId)
    throw Conflict('Employee must be assigned to a branch');

  const created = await createUserSvc({
    fullname: employee.displayName,
    telephone: employee.telephone,
    email: employee.email,
    status: UserStatus.INVITED,
    roleId: input.roleId,
    companyId: employee.companyId,
    employeeId: employee.id,
    branchId: input.branchId,
    locationId: input.locationId ?? null,
    userType: UserType.STAFF,
    createdBy: input.createdBy,
    actor: input.actor,
  });

  await updateEmployeeHasUserAccountRepo(employee.id, true);

  await recordAuditLog({
    companyId: employee.companyId,
    actorUserId: input.createdBy,
    entityType: 'employee',
    entityId: employee.id,
    action: 'EMPLOYEE_USER_CREATED',
    message: 'User account created from employee',
    metadata: { userId: created.id },
  });

  return created;
}
