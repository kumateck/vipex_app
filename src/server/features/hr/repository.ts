import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  attendanceRecords,
  branches,
  departments,
  employees,
  employeeJobAssignments,
  jobTitles,
  leaveRequests,
  leaveTypes,
  locations,
  users,
} from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListEmployeeParams = {
  limit: number;
  offset: number;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  officerEmployeeId?: string | null;
  status?: number | null;
  search?: string | null;
  sort?: SortField[] | null;
  noPagination?: boolean;
};

export type ListDepartmentParams = {
  limit: number;
  offset: number;
  companyId: string;
  includeInactive?: boolean | null;
  search?: string | null;
};

export type ListJobTitleParams = {
  limit: number;
  offset: number;
  companyId: string;
  includeInactive?: boolean | null;
  search?: string | null;
};

export type ListLeaveTypeParams = {
  limit: number;
  offset: number;
  companyId: string;
  includeInactive?: boolean | null;
  search?: string | null;
};

export type ListLeaveRequestParams = {
  limit: number;
  offset: number;
  companyId: string;
  employeeId?: string | null;
  leaveTypeId?: string | null;
  status?: number | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
};

export async function listDepartmentsRepo(p: ListDepartmentParams) {
  const where = [
    eq(departments.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(departments.isActive, true)]),
    ...(p.search ? [ilike(departments.name, `%${p.search}%`)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(departments)
    .where(and(...where));

  const data = await db
    .select({
      id: departments.id,
      companyId: departments.companyId,
      code: departments.code,
      name: departments.name,
      description: departments.description,
      isActive: departments.isActive,
      createdBy: departments.createdBy,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments)
    .where(and(...where))
    .orderBy(asc(departments.name), asc(departments.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function listDepartmentOptionsRepo(companyId: string, search?: string | null) {
  return db
    .select({ id: departments.id, code: departments.code, name: departments.name })
    .from(departments)
    .where(
      and(
        eq(departments.companyId, companyId),
        eq(departments.isActive, true),
        ...(search ? [ilike(departments.name, `%${search}%`)] : []),
      ),
    )
    .orderBy(asc(departments.name), asc(departments.id));
}

export async function createDepartmentRepo(values: typeof departments.$inferInsert) {
  const [row] = await db.insert(departments).values(values).returning({ id: departments.id });
  return row ?? null;
}

export async function findDepartmentByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: departments.id, isActive: departments.isActive })
    .from(departments)
    .where(and(eq(departments.companyId, companyId), ilike(departments.name, name)))
    .limit(1);
  return row ?? null;
}

export async function updateDepartmentRepo(
  id: string,
  patch: Partial<typeof departments.$inferInsert>,
) {
  const [row] = await db
    .update(departments)
    .set(patch)
    .where(eq(departments.id, id))
    .returning({ id: departments.id });
  return row ?? null;
}

export async function listJobTitlesRepo(p: ListJobTitleParams) {
  const where = [
    eq(jobTitles.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(jobTitles.isActive, true)]),
    ...(p.search ? [ilike(jobTitles.name, `%${p.search}%`)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(jobTitles)
    .where(and(...where));

  const data = await db
    .select({
      id: jobTitles.id,
      companyId: jobTitles.companyId,
      departmentId: jobTitles.departmentId,
      departmentName: departments.name,
      code: jobTitles.code,
      name: jobTitles.name,
      description: jobTitles.description,
      defaultLeaveDays: jobTitles.defaultLeaveDays,
      isActive: jobTitles.isActive,
      createdBy: jobTitles.createdBy,
      createdAt: jobTitles.createdAt,
      updatedAt: jobTitles.updatedAt,
    })
    .from(jobTitles)
    .leftJoin(departments, eq(jobTitles.departmentId, departments.id))
    .where(and(...where))
    .orderBy(asc(jobTitles.name), asc(jobTitles.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function listJobTitleOptionsRepo(companyId: string, search?: string | null) {
  return db
    .select({
      id: jobTitles.id,
      code: jobTitles.code,
      name: jobTitles.name,
      departmentId: jobTitles.departmentId,
      departmentName: departments.name,
      defaultLeaveDays: jobTitles.defaultLeaveDays,
    })
    .from(jobTitles)
    .leftJoin(departments, eq(jobTitles.departmentId, departments.id))
    .where(
      and(
        eq(jobTitles.companyId, companyId),
        eq(jobTitles.isActive, true),
        ...(search ? [ilike(jobTitles.name, `%${search}%`)] : []),
      ),
    )
    .orderBy(asc(jobTitles.name), asc(jobTitles.id));
}

export async function listLeaveTypesRepo(p: ListLeaveTypeParams) {
  const where = [
    eq(leaveTypes.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(leaveTypes.isActive, true)]),
    ...(p.search ? [ilike(leaveTypes.name, `%${p.search}%`)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(leaveTypes)
    .where(and(...where));
  const data = await db
    .select({
      id: leaveTypes.id,
      companyId: leaveTypes.companyId,
      code: leaveTypes.code,
      name: leaveTypes.name,
      isPaid: leaveTypes.isPaid,
      minAdvanceDays: leaveTypes.minAdvanceDays,
      allowEmergencySameDay: leaveTypes.allowEmergencySameDay,
      isActive: leaveTypes.isActive,
      createdAt: leaveTypes.createdAt,
      updatedAt: leaveTypes.updatedAt,
    })
    .from(leaveTypes)
    .where(and(...where))
    .orderBy(asc(leaveTypes.name), asc(leaveTypes.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function listLeaveTypeOptionsRepo(companyId: string) {
  return db
    .select({
      id: leaveTypes.id,
      code: leaveTypes.code,
      name: leaveTypes.name,
      isPaid: leaveTypes.isPaid,
      minAdvanceDays: leaveTypes.minAdvanceDays,
      allowEmergencySameDay: leaveTypes.allowEmergencySameDay,
    })
    .from(leaveTypes)
    .where(and(eq(leaveTypes.companyId, companyId), eq(leaveTypes.isActive, true)))
    .orderBy(asc(leaveTypes.name), asc(leaveTypes.id));
}

export async function createLeaveTypeRepo(values: typeof leaveTypes.$inferInsert) {
  const [row] = await db.insert(leaveTypes).values(values).returning({ id: leaveTypes.id });
  return row ?? null;
}

export async function findLeaveTypeByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: leaveTypes.id })
    .from(leaveTypes)
    .where(and(eq(leaveTypes.companyId, companyId), ilike(leaveTypes.name, name)))
    .limit(1);
  return row ?? null;
}

export async function getLeaveTypeRepo(id: string) {
  const [row] = await db
    .select({
      id: leaveTypes.id,
      companyId: leaveTypes.companyId,
      name: leaveTypes.name,
      isPaid: leaveTypes.isPaid,
      minAdvanceDays: leaveTypes.minAdvanceDays,
      allowEmergencySameDay: leaveTypes.allowEmergencySameDay,
      isActive: leaveTypes.isActive,
    })
    .from(leaveTypes)
    .where(eq(leaveTypes.id, id))
    .limit(1);
  return row ?? null;
}

export async function createJobTitleRepo(values: typeof jobTitles.$inferInsert) {
  const [row] = await db.insert(jobTitles).values(values).returning({ id: jobTitles.id });
  return row ?? null;
}

export async function findJobTitleByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: jobTitles.id, isActive: jobTitles.isActive })
    .from(jobTitles)
    .where(and(eq(jobTitles.companyId, companyId), ilike(jobTitles.name, name)))
    .limit(1);
  return row ?? null;
}

export async function updateJobTitleRepo(
  id: string,
  patch: Partial<typeof jobTitles.$inferInsert>,
) {
  const [row] = await db
    .update(jobTitles)
    .set(patch)
    .where(eq(jobTitles.id, id))
    .returning({ id: jobTitles.id });
  return row ?? null;
}

export async function listEmployeesRepo(p: ListEmployeeParams) {
  const where = [eq(employees.companyId, p.companyId), eq(employees.isDeleted, false)];
  if (p.branchId) where.push(eq(employees.branchId, p.branchId));
  if (p.departmentId) where.push(eq(employees.departmentId, p.departmentId));
  if (p.jobTitleId) where.push(eq(employees.jobTitleId, p.jobTitleId));
  if (p.officerEmployeeId) where.push(eq(employees.officerEmployeeId, p.officerEmployeeId));
  if (p.status !== null && p.status !== undefined)
    where.push(eq(employees.employmentStatus, p.status));

  const searchPredicate = p.search
    ? or(
        ilike(employees.firstName, `%${p.search}%`),
        ilike(employees.lastName, `%${p.search}%`),
        ilike(employees.displayName, `%${p.search}%`),
        ilike(employees.employeeNumber, `%${p.search}%`),
        ilike(employees.email, `%${p.search}%`),
        ilike(employees.telephone, `%${p.search}%`),
      )
    : undefined;

  const orderBy = (p.sort ?? [])
    .map((s) => {
      if (s.field === 'createdAt')
        return s.direction === 'desc' ? desc(employees.createdAt) : asc(employees.createdAt);
      if (s.field === 'displayName')
        return s.direction === 'desc' ? desc(employees.displayName) : asc(employees.displayName);
      if (s.field === 'employeeNumber')
        return s.direction === 'desc'
          ? desc(employees.employeeNumber)
          : asc(employees.employeeNumber);
      return null;
    })
    .filter((value): value is ReturnType<typeof asc> => value !== null);

  const [countRow] = await db
    .select({ c: count() })
    .from(employees)
    .where(and(...where, ...(searchPredicate ? [searchPredicate] : [])));

  const baseQuery = db
    .select({
      id: employees.id,
      companyId: employees.companyId,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      middleName: employees.middleName,
      lastName: employees.lastName,
      displayName: employees.displayName,
      email: employees.email,
      profileImageUrl: sql<string | null>`NULL`,
      telephone: employees.telephone,
      paymentMethod: sql<string | null>`NULL`,
      bankName: sql<string | null>`NULL`,
      bankAccountName: sql<string | null>`NULL`,
      bankAccountNumber: sql<string | null>`NULL`,
      mobileMoneyNumber: sql<string | null>`NULL`,
      employmentStatus: employees.employmentStatus,
      employmentType: employees.employmentType,
      hireDate: employees.hireDate,
      branchId: employees.branchId,
      branchName: branches.name,
      locationId: employees.locationId,
      locationName: locations.name,
      departmentId: employees.departmentId,
      departmentName: departments.name,
      jobTitleId: employees.jobTitleId,
      jobTitleName: jobTitles.name,
      reportingOfficerTitleId: employees.reportingOfficerTitleId,
      officerEmployeeId: employees.officerEmployeeId,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      hasUserAccount: employees.hasUserAccount,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    })
    .from(employees)
    .leftJoin(branches, eq(employees.branchId, branches.id))
    .leftJoin(locations, eq(employees.locationId, locations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobTitles, eq(employees.jobTitleId, jobTitles.id))
    .where(and(...where, ...(searchPredicate ? [searchPredicate] : [])))
    .orderBy(...(orderBy.length ? orderBy : [asc(employees.displayName), asc(employees.id)]));

  const data = p.noPagination ? await baseQuery : await baseQuery.limit(p.limit).offset(p.offset);

  return {
    data,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function listEmployeeOptionsRepo(input: {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  officerEmployeeId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  const where = [eq(employees.companyId, input.companyId), eq(employees.isDeleted, false)];
  if (input.branchId) where.push(eq(employees.branchId, input.branchId));
  if (input.departmentId) where.push(eq(employees.departmentId, input.departmentId));
  if (input.jobTitleId) where.push(eq(employees.jobTitleId, input.jobTitleId));
  if (input.officerEmployeeId) where.push(eq(employees.officerEmployeeId, input.officerEmployeeId));
  if (input.status !== null && input.status !== undefined)
    where.push(eq(employees.employmentStatus, input.status));

  const searchPredicate = input.search
    ? or(
        ilike(employees.displayName, `%${input.search}%`),
        ilike(employees.employeeNumber, `%${input.search}%`),
        ilike(employees.firstName, `%${input.search}%`),
        ilike(employees.lastName, `%${input.search}%`),
        ilike(employees.email, `%${input.search}%`),
      )
    : undefined;

  return db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      displayName: employees.displayName,
      branchId: employees.branchId,
      locationId: employees.locationId,
      departmentId: employees.departmentId,
      jobTitleId: employees.jobTitleId,
      employmentStatus: employees.employmentStatus,
    })
    .from(employees)
    .where(and(...where, ...(searchPredicate ? [searchPredicate] : [])))
    .orderBy(asc(employees.displayName), asc(employees.id));
}

export async function getEmployeeRepo(id: string) {
  const [row] = await db
    .select({
      id: employees.id,
      companyId: employees.companyId,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      middleName: employees.middleName,
      lastName: employees.lastName,
      displayName: employees.displayName,
      email: employees.email,
      profileImageUrl: employees.profileImageUrl,
      telephone: employees.telephone,
      alternatePhone: employees.alternatePhone,
      dateOfBirth: employees.dateOfBirth,
      gender: employees.gender,
      maritalStatus: employees.maritalStatus,
      nationalIdType: employees.nationalIdType,
      nationalIdNumber: employees.nationalIdNumber,
      taxId: employees.taxId,
      ssnitNumber: employees.ssnitNumber,
      address: employees.address,
      city: employees.city,
      country: employees.country,
      emergencyContactName: employees.emergencyContactName,
      emergencyContactPhone: employees.emergencyContactPhone,
      paymentMethod: employees.paymentMethod,
      bankName: employees.bankName,
      bankAccountName: employees.bankAccountName,
      bankAccountNumber: employees.bankAccountNumber,
      mobileMoneyNumber: employees.mobileMoneyNumber,
      employmentStatus: employees.employmentStatus,
      employmentType: employees.employmentType,
      hireDate: employees.hireDate,
      confirmationDate: employees.confirmationDate,
      terminationDate: employees.terminationDate,
      terminationReason: employees.terminationReason,
      branchId: employees.branchId,
      locationId: employees.locationId,
      departmentId: employees.departmentId,
      jobTitleId: employees.jobTitleId,
      reportingOfficerTitleId: employees.reportingOfficerTitleId,
      officerEmployeeId: employees.officerEmployeeId,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      hasUserAccount: employees.hasUserAccount,
      isDeleted: employees.isDeleted,
      createdBy: employees.createdBy,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    })
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  return row ?? null;
}

export async function findEmployeeByNumberRepo(companyId: string, employeeNumber: string) {
  const [row] = await db
    .select({ id: employees.id, isDeleted: employees.isDeleted })
    .from(employees)
    .where(and(eq(employees.companyId, companyId), eq(employees.employeeNumber, employeeNumber)))
    .limit(1);
  return row ?? null;
}

export async function createEmployeeRepo(values: typeof employees.$inferInsert) {
  const [row] = await db.insert(employees).values(values).returning({ id: employees.id });
  return row ?? null;
}

export async function updateEmployeeRepo(
  id: string,
  patch: Partial<typeof employees.$inferInsert>,
) {
  const [row] = await db
    .update(employees)
    .set(patch)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  return row ?? null;
}

export async function createEmployeeAssignmentRepo(
  values: typeof employeeJobAssignments.$inferInsert,
) {
  const [row] = await db
    .insert(employeeJobAssignments)
    .values(values)
    .returning({ id: employeeJobAssignments.id });
  return row ?? null;
}

export async function createAttendanceRepo(values: typeof attendanceRecords.$inferInsert) {
  const [row] = await db
    .insert(attendanceRecords)
    .values(values)
    .returning({ id: attendanceRecords.id });
  return row ?? null;
}

export async function findAttendanceByEmployeeDateRepo(employeeId: string, attendanceDate: Date) {
  const [row] = await db
    .select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      branchId: attendanceRecords.branchId,
      locationId: attendanceRecords.locationId,
      attendanceDate: attendanceRecords.attendanceDate,
      checkInAt: attendanceRecords.checkInAt,
      checkOutAt: attendanceRecords.checkOutAt,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.attendanceDate, attendanceDate),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateAttendanceRepo(
  id: string,
  patch: Partial<typeof attendanceRecords.$inferInsert>,
) {
  const [row] = await db
    .update(attendanceRecords)
    .set(patch)
    .where(eq(attendanceRecords.id, id))
    .returning({ id: attendanceRecords.id });
  return row ?? null;
}

export type ListAttendanceParams = {
  limit: number;
  offset: number;
  companyId: string;
  employeeId?: string | null;
  branchId?: string | null;
  from: Date;
  to: Date;
};

export async function listAttendanceRepo(p: ListAttendanceParams) {
  const baseWhere = [
    eq(attendanceRecords.companyId, p.companyId),
    ...(p.employeeId ? [eq(attendanceRecords.employeeId, p.employeeId)] : []),
    ...(p.branchId ? [eq(attendanceRecords.branchId, p.branchId)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(attendanceRecords)
    .where(
      and(
        ...baseWhere,
        and(),
        gte(attendanceRecords.attendanceDate, p.from),
        lte(attendanceRecords.attendanceDate, p.to),
      ),
    );

  const data = await db
    .select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      employeeName: employees.displayName,
      branchId: attendanceRecords.branchId,
      branchName: branches.name,
      locationId: attendanceRecords.locationId,
      locationName: locations.name,
      attendanceDate: attendanceRecords.attendanceDate,
      checkInAt: attendanceRecords.checkInAt,
      checkOutAt: attendanceRecords.checkOutAt,
      minutesWorked: attendanceRecords.minutesWorked,
      status: attendanceRecords.status,
      createdAt: attendanceRecords.createdAt,
      updatedAt: attendanceRecords.updatedAt,
    })
    .from(attendanceRecords)
    .leftJoin(employees, eq(attendanceRecords.employeeId, employees.id))
    .leftJoin(branches, eq(attendanceRecords.branchId, branches.id))
    .leftJoin(locations, eq(attendanceRecords.locationId, locations.id))
    .where(
      and(
        ...baseWhere,
        gte(attendanceRecords.attendanceDate, p.from),
        lte(attendanceRecords.attendanceDate, p.to),
      ),
    )
    .orderBy(asc(attendanceRecords.attendanceDate), asc(attendanceRecords.createdAt))
    .limit(p.limit)
    .offset(p.offset);

  return {
    data,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function listLeaveRequestsRepo(p: ListLeaveRequestParams) {
  const where = [
    eq(leaveRequests.companyId, p.companyId),
    ...(p.employeeId ? [eq(leaveRequests.employeeId, p.employeeId)] : []),
    ...(p.leaveTypeId ? [eq(leaveRequests.leaveTypeId, p.leaveTypeId)] : []),
    ...(p.status !== null && p.status !== undefined ? [eq(leaveRequests.status, p.status)] : []),
    ...(p.dateFrom ? [gte(leaveRequests.dateFrom, p.dateFrom)] : []),
    ...(p.dateTo ? [lte(leaveRequests.dateTo, p.dateTo)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(leaveRequests)
    .where(and(...where));
  const data = await db
    .select({
      id: leaveRequests.id,
      companyId: leaveRequests.companyId,
      employeeId: leaveRequests.employeeId,
      employeeName: employees.displayName,
      leaveTypeId: leaveRequests.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      leaveTypeIsPaid: leaveTypes.isPaid,
      dateFrom: leaveRequests.dateFrom,
      dateTo: leaveRequests.dateTo,
      daysCount: leaveRequests.daysCount,
      isEmergency: leaveRequests.isEmergency,
      reason: leaveRequests.reason,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      managerApprovalStatus: leaveRequests.managerApprovalStatus,
      managerApprovedBy: leaveRequests.managerApprovedBy,
      managerApprovedAt: leaveRequests.managerApprovedAt,
      managerRejectionReason: leaveRequests.managerRejectionReason,
      status: leaveRequests.status,
      approvedBy: leaveRequests.approvedBy,
      approvedAt: leaveRequests.approvedAt,
      rejectionReason: leaveRequests.rejectionReason,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .where(and(...where))
    .orderBy(asc(leaveRequests.dateFrom), asc(leaveRequests.createdAt))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function createLeaveRequestRepo(values: typeof leaveRequests.$inferInsert) {
  const [row] = await db.insert(leaveRequests).values(values).returning({ id: leaveRequests.id });
  return row ?? null;
}

export async function getLeaveRequestRepo(id: string) {
  const [row] = await db
    .select({
      id: leaveRequests.id,
      companyId: leaveRequests.companyId,
      employeeId: leaveRequests.employeeId,
      leaveTypeId: leaveRequests.leaveTypeId,
      dateFrom: leaveRequests.dateFrom,
      dateTo: leaveRequests.dateTo,
      daysCount: leaveRequests.daysCount,
      isEmergency: leaveRequests.isEmergency,
      managerApprovalStatus: leaveRequests.managerApprovalStatus,
      managerApprovedBy: leaveRequests.managerApprovedBy,
      managerApprovedAt: leaveRequests.managerApprovedAt,
      managerRejectionReason: leaveRequests.managerRejectionReason,
      status: leaveRequests.status,
      approvedBy: leaveRequests.approvedBy,
      approvedAt: leaveRequests.approvedAt,
      rejectionReason: leaveRequests.rejectionReason,
      officerEmployeeId: employees.officerEmployeeId,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateLeaveRequestRepo(
  id: string,
  patch: Partial<typeof leaveRequests.$inferInsert>,
) {
  const [row] = await db
    .update(leaveRequests)
    .set(patch)
    .where(eq(leaveRequests.id, id))
    .returning({ id: leaveRequests.id });
  return row ?? null;
}

export async function getPaidLeaveSummariesRepo(input: {
  companyId: string;
  employeeIds: string[];
  periodStart: Date;
  periodEnd: Date;
}) {
  if (!input.employeeIds.length) return new Map<string, number>();

  const rows = await db
    .select({
      employeeId: leaveRequests.employeeId,
      daysCount: leaveRequests.daysCount,
    })
    .from(leaveRequests)
    .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .where(
      and(
        eq(leaveRequests.companyId, input.companyId),
        inArray(leaveRequests.employeeId, input.employeeIds),
        eq(leaveRequests.status, 1),
        eq(leaveTypes.isPaid, true),
        lte(leaveRequests.dateFrom, input.periodEnd),
        gte(leaveRequests.dateTo, input.periodStart),
      ),
    );

  const daysByEmployeeId = new Map<string, number>();
  for (const row of rows) {
    daysByEmployeeId.set(
      row.employeeId,
      (daysByEmployeeId.get(row.employeeId) ?? 0) + Number(row.daysCount ?? 0),
    );
  }
  return daysByEmployeeId;
}

export async function getEmployeeBookedLeaveDaysRepo(input: {
  companyId: string;
  employeeId: string;
  from: Date;
  to: Date;
}) {
  const [row] = await db
    .select({
      totalDays: sql<number>`COALESCE(SUM(${leaveRequests.daysCount}), 0)`,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.companyId, input.companyId),
        eq(leaveRequests.employeeId, input.employeeId),
        inArray(leaveRequests.status, [0, 1]),
        lte(leaveRequests.dateFrom, input.to),
        gte(leaveRequests.dateTo, input.from),
      ),
    );

  return Number(row?.totalDays ?? 0);
}

export async function updateEmployeeHasUserAccountRepo(id: string, hasUserAccount: boolean) {
  const [row] = await db
    .update(employees)
    .set({ hasUserAccount })
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  return row ?? null;
}

export async function getDepartmentRepo(id: string) {
  const [row] = await db
    .select({ id: departments.id, companyId: departments.companyId, name: departments.name })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  return row ?? null;
}

export async function getJobTitleRepo(id: string) {
  const [row] = await db
    .select({
      id: jobTitles.id,
      companyId: jobTitles.companyId,
      departmentId: jobTitles.departmentId,
      name: jobTitles.name,
      defaultLeaveDays: jobTitles.defaultLeaveDays,
    })
    .from(jobTitles)
    .where(eq(jobTitles.id, id))
    .limit(1);
  return row ?? null;
}

export async function findUserByEmployeeIdRepo(employeeId: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.employeeId, employeeId))
    .limit(1);
  return row ?? null;
}
