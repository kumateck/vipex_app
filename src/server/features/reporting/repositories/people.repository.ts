import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/db/config';
import {
  attendanceRecords,
  branches,
  departments,
  employees,
  jobTitles,
  leaveRequests,
  leaveTypes,
  locations,
} from '@/db/schemas';

export async function listEmployeeMasterReportRowsRepo(input: {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  const where = [
    eq(employees.companyId, input.companyId),
    eq(employees.isDeleted, false),
    ...(input.branchId ? [eq(employees.branchId, input.branchId)] : []),
    ...(input.departmentId ? [eq(employees.departmentId, input.departmentId)] : []),
    ...(input.status !== null && input.status !== undefined
      ? [eq(employees.employmentStatus, input.status)]
      : []),
    ...(input.search
      ? [
          or(
            ilike(employees.displayName, `%${input.search}%`),
            ilike(employees.employeeNumber, `%${input.search}%`),
            ilike(employees.email, `%${input.search}%`),
            ilike(employees.telephone, `%${input.search}%`),
          )!,
        ]
      : []),
  ];

  const manager = alias(employees, 'report_employee_manager');

  return db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      displayName: employees.displayName,
      email: employees.email,
      telephone: employees.telephone,
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
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      supervisorName: manager.displayName,
      hasUserAccount: employees.hasUserAccount,
      paymentMethod: sql<string | null>`NULL`,
      bankName: sql<string | null>`NULL`,
      mobileMoneyNumber: sql<string | null>`NULL`,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(locations, eq(locations.id, employees.locationId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(jobTitles, eq(jobTitles.id, employees.jobTitleId))
    .leftJoin(
      manager,
      sql`${manager.id} = coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
    )
    .where(and(...where))
    .orderBy(asc(employees.displayName), asc(employees.id));
}

export async function listAttendanceReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  employeeId?: string | null;
  branchId?: string | null;
}) {
  return db
    .select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      employeeNumber: employees.employeeNumber,
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
    })
    .from(attendanceRecords)
    .leftJoin(employees, eq(employees.id, attendanceRecords.employeeId))
    .leftJoin(branches, eq(branches.id, attendanceRecords.branchId))
    .leftJoin(locations, eq(locations.id, attendanceRecords.locationId))
    .where(
      and(
        eq(attendanceRecords.companyId, input.companyId),
        gte(attendanceRecords.attendanceDate, input.from),
        lte(attendanceRecords.attendanceDate, input.to),
        ...(input.employeeId ? [eq(attendanceRecords.employeeId, input.employeeId)] : []),
        ...(input.branchId ? [eq(attendanceRecords.branchId, input.branchId)] : []),
      ),
    )
    .orderBy(desc(attendanceRecords.attendanceDate), asc(employees.displayName), asc(employees.id));
}

export async function listLeaveRequestReportRowsRepo(input: {
  companyId: string;
  from: Date;
  to: Date;
  employeeId?: string | null;
  status?: number | null;
}) {
  return db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      leaveTypeId: leaveRequests.leaveTypeId,
      leaveTypeName: leaveTypes.name,
      leaveTypeIsPaid: leaveTypes.isPaid,
      dateFrom: leaveRequests.dateFrom,
      dateTo: leaveRequests.dateTo,
      daysCount: leaveRequests.daysCount,
      managerApprovalStatus: leaveRequests.managerApprovalStatus,
      status: leaveRequests.status,
      reason: leaveRequests.reason,
      rejectionReason: leaveRequests.rejectionReason,
      approvedAt: leaveRequests.approvedAt,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .where(
      and(
        eq(leaveRequests.companyId, input.companyId),
        lte(leaveRequests.dateFrom, input.to),
        gte(leaveRequests.dateTo, input.from),
        ...(input.employeeId ? [eq(leaveRequests.employeeId, input.employeeId)] : []),
        ...(input.status !== null && input.status !== undefined
          ? [eq(leaveRequests.status, input.status)]
          : []),
      ),
    )
    .orderBy(desc(leaveRequests.dateFrom), asc(employees.displayName), asc(employees.id));
}
