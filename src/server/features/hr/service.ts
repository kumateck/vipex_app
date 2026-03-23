import { Conflict, NotFound } from '@/server/utils/http-error';
import { AttendanceStatus, EmploymentStatus, UserStatus, UserType } from '@/db/schemas/enums';
import { recordAuditLog } from '../audit/logger';
import { createUserSvc } from '../users/service';
import {
  createDepartmentRepo,
  createAttendanceRepo,
  createEmployeeAssignmentRepo,
  createEmployeeRepo,
  createJobTitleRepo,
  findDepartmentByNameRepo,
  findAttendanceByEmployeeDateRepo,
  findEmployeeByNumberRepo,
  findJobTitleByNameRepo,
  findUserByEmployeeIdRepo,
  getDepartmentRepo,
  getEmployeeRepo,
  getJobTitleRepo,
  listDepartmentOptionsRepo,
  listDepartmentsRepo,
  listAttendanceRepo,
  listEmployeesRepo,
  listJobTitleOptionsRepo,
  listJobTitlesRepo,
  updateAttendanceRepo,
  updateDepartmentRepo,
  updateEmployeeHasUserAccountRepo,
  updateEmployeeRepo,
  updateJobTitleRepo,
  type ListDepartmentParams,
  type ListAttendanceParams,
  type ListEmployeeParams,
  type ListJobTitleParams,
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
    paymentMethod: input.paymentMethod ?? null,
    bankName: input.bankName ?? null,
    bankAccountName: input.bankAccountName ?? null,
    bankAccountNumber: input.bankAccountNumber ?? null,
    mobileMoneyNumber: input.mobileMoneyNumber ?? null,
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
  const nextFirstName = patch.firstName ?? current.firstName;
  const nextMiddleName = patch.middleName !== undefined ? patch.middleName : current.middleName;
  const nextLastName = patch.lastName ?? current.lastName;

  const updated = await updateEmployeeRepo(id, {
    ...patch,
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
