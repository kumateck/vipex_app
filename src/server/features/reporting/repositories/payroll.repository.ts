import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  branches,
  departments,
  employees,
  payrollManualAdjustments,
  payrollOvertimeEntries,
  payrollPeriods,
  payrollRunEmployees,
  payrollRuns,
} from '@/db/schemas';

export async function findLatestPayrollRunForCycleRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const [row] = await db
    .select({
      id: payrollRuns.id,
      payrollCycleId: payrollRuns.payrollPeriodId,
      status: payrollRuns.status,
      approvedAt: payrollRuns.approvedAt,
      createdAt: payrollRuns.createdAt,
    })
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.companyId, input.companyId),
        eq(payrollRuns.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollRuns.createdAt), desc(payrollRuns.id))
    .limit(1);

  return row ?? null;
}

export async function listPayrollRegisterRowsRepo(input: { payrollRunId: string }) {
  return db
    .select({
      id: payrollRunEmployees.id,
      payrollRunId: payrollRunEmployees.payrollRunId,
      employeeId: payrollRunEmployees.employeeId,
      employeeNumber: payrollRunEmployees.employeeNumberSnapshot,
      employeeName: payrollRunEmployees.employeeNameSnapshot,
      branchId: payrollRunEmployees.branchIdSnapshot,
      branchName: branches.name,
      departmentName: payrollRunEmployees.departmentNameSnapshot,
      jobTitleName: payrollRunEmployees.jobTitleNameSnapshot,
      basePayPsw: payrollRunEmployees.basePayPsw,
      grossPayPsw: payrollRunEmployees.grossPayPsw,
      totalDeductionsPsw: payrollRunEmployees.totalDeductionsPsw,
      netPayPsw: payrollRunEmployees.netPayPsw,
      currencyCode: payrollRunEmployees.currencyCode,
      status: payrollRunEmployees.status,
    })
    .from(payrollRunEmployees)
    .leftJoin(branches, eq(branches.id, payrollRunEmployees.branchIdSnapshot))
    .where(eq(payrollRunEmployees.payrollRunId, input.payrollRunId))
    .orderBy(asc(payrollRunEmployees.employeeNameSnapshot), asc(payrollRunEmployees.id));
}

export async function listPayrollOvertimeReportRowsRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  return db
    .select({
      id: payrollOvertimeEntries.id,
      employeeId: payrollOvertimeEntries.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: employees.branchId,
      branchName: branches.name,
      departmentName: departments.name,
      overtimeMinutes: payrollOvertimeEntries.overtimeMinutes,
      ratePerHourPsw: payrollOvertimeEntries.ratePerHourPsw,
      multiplierPct: payrollOvertimeEntries.multiplierPct,
      approvalStatus: payrollOvertimeEntries.approvalStatus,
      approvedAt: payrollOvertimeEntries.approvedAt,
      notes: payrollOvertimeEntries.notes,
      createdAt: payrollOvertimeEntries.createdAt,
    })
    .from(payrollOvertimeEntries)
    .innerJoin(employees, eq(employees.id, payrollOvertimeEntries.employeeId))
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(
      and(
        eq(payrollOvertimeEntries.companyId, input.companyId),
        eq(payrollOvertimeEntries.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollOvertimeEntries.createdAt), asc(employees.displayName), asc(employees.id));
}

export async function listPayrollAdjustmentReportRowsRepo(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  return db
    .select({
      id: payrollManualAdjustments.id,
      employeeId: payrollManualAdjustments.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: employees.branchId,
      branchName: branches.name,
      departmentName: departments.name,
      itemType: payrollManualAdjustments.itemType,
      code: payrollManualAdjustments.code,
      name: payrollManualAdjustments.name,
      amountPsw: payrollManualAdjustments.amountPsw,
      isTaxable: payrollManualAdjustments.isTaxable,
      approvalStatus: payrollManualAdjustments.approvalStatus,
      approvedAt: payrollManualAdjustments.approvedAt,
      notes: payrollManualAdjustments.notes,
      createdAt: payrollManualAdjustments.createdAt,
    })
    .from(payrollManualAdjustments)
    .innerJoin(employees, eq(employees.id, payrollManualAdjustments.employeeId))
    .leftJoin(branches, eq(branches.id, employees.branchId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(
      and(
        eq(payrollManualAdjustments.companyId, input.companyId),
        eq(payrollManualAdjustments.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(
      desc(payrollManualAdjustments.createdAt),
      asc(employees.displayName),
      asc(employees.id),
    );
}

export async function getPayrollCycleRepo(input: { companyId: string; payrollCycleId: string }) {
  const [row] = await db
    .select({
      id: payrollPeriods.id,
      name: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
      status: payrollPeriods.status,
    })
    .from(payrollPeriods)
    .where(
      and(
        eq(payrollPeriods.companyId, input.companyId),
        eq(payrollPeriods.id, input.payrollCycleId),
      ),
    )
    .limit(1);
  return row ?? null;
}
