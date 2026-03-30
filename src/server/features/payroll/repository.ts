import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  attendanceRecords,
  deductionTypes,
  departments,
  earningTypes,
  employeeCompensation,
  employeeCompensationItems,
  payrollGroups,
  payrollManualAdjustments,
  payrollOvertimeEntries,
  payrollPeriods,
  payrollRunItems,
  payrollRuns,
  payrollRunEmployees,
  payslips,
  taxComponents,
  employees,
  jobTitles,
} from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type ListPayrollCycleParams = {
  limit: number;
  offset: number;
  companyId: string;
  branchId?: string | null;
  status?: number | null;
  sort?: SortField[] | null;
};

export type ListPayrollGroupParams = {
  limit: number;
  offset: number;
  companyId: string;
  includeInactive?: boolean | null;
  search?: string | null;
};

export type ListPayrollTypeParams = {
  limit: number;
  offset: number;
  companyId: string;
  includeInactive?: boolean | null;
  search?: string | null;
};

export type ListCompensationParams = {
  limit: number;
  offset: number;
  companyId: string;
  employeeId?: string | null;
  payrollGroupId?: string | null;
  search?: string | null;
};

export type PayrollCycleInputParams = {
  payrollCycleId: string;
  companyId: string;
};

export async function listPayrollGroupsRepo(p: ListPayrollGroupParams) {
  const where = [
    eq(payrollGroups.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(payrollGroups.isActive, true)]),
    ...(p.search ? [ilike(payrollGroups.name, `%${p.search}%`)] : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(payrollGroups)
    .where(and(...where));

  const data = await db
    .select({
      id: payrollGroups.id,
      companyId: payrollGroups.companyId,
      name: payrollGroups.name,
      payFrequency: payrollGroups.payFrequency,
      currencyCode: payrollGroups.currencyCode,
      isActive: payrollGroups.isActive,
      createdBy: payrollGroups.createdBy,
      createdAt: payrollGroups.createdAt,
      updatedAt: payrollGroups.updatedAt,
    })
    .from(payrollGroups)
    .where(and(...where))
    .orderBy(asc(payrollGroups.name), asc(payrollGroups.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function listEarningTypesRepo(p: ListPayrollTypeParams) {
  const where = [
    eq(earningTypes.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(earningTypes.isActive, true)]),
    ...(p.search
      ? [or(ilike(earningTypes.name, `%${p.search}%`), ilike(earningTypes.code, `%${p.search}%`))]
      : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(earningTypes)
    .where(and(...where));
  const data = await db
    .select({
      id: earningTypes.id,
      companyId: earningTypes.companyId,
      code: earningTypes.code,
      name: earningTypes.name,
      isTaxable: earningTypes.isTaxable,
      isRecurring: earningTypes.isRecurring,
      isActive: earningTypes.isActive,
      createdAt: earningTypes.createdAt,
      updatedAt: earningTypes.updatedAt,
    })
    .from(earningTypes)
    .where(and(...where))
    .orderBy(asc(earningTypes.name), asc(earningTypes.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function listDeductionTypesRepo(p: ListPayrollTypeParams) {
  const where = [
    eq(deductionTypes.companyId, p.companyId),
    ...(p.includeInactive ? [] : [eq(deductionTypes.isActive, true)]),
    ...(p.search
      ? [
          or(
            ilike(deductionTypes.name, `%${p.search}%`),
            ilike(deductionTypes.code, `%${p.search}%`),
          ),
        ]
      : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(deductionTypes)
    .where(and(...where));
  const data = await db
    .select({
      id: deductionTypes.id,
      companyId: deductionTypes.companyId,
      code: deductionTypes.code,
      name: deductionTypes.name,
      isStatutory: deductionTypes.isStatutory,
      isRecurring: deductionTypes.isRecurring,
      isActive: deductionTypes.isActive,
      createdAt: deductionTypes.createdAt,
      updatedAt: deductionTypes.updatedAt,
    })
    .from(deductionTypes)
    .where(and(...where))
    .orderBy(asc(deductionTypes.name), asc(deductionTypes.id))
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function findEarningTypeByCodeRepo(companyId: string, code: string) {
  const [row] = await db
    .select({ id: earningTypes.id, isActive: earningTypes.isActive })
    .from(earningTypes)
    .where(
      and(eq(earningTypes.companyId, companyId), sql`lower(${earningTypes.code}) = lower(${code})`),
    )
    .limit(1);
  return row ?? null;
}

export async function findDeductionTypeByCodeRepo(companyId: string, code: string) {
  const [row] = await db
    .select({ id: deductionTypes.id, isActive: deductionTypes.isActive })
    .from(deductionTypes)
    .where(
      and(
        eq(deductionTypes.companyId, companyId),
        sql`lower(${deductionTypes.code}) = lower(${code})`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createEarningTypeRepo(values: typeof earningTypes.$inferInsert) {
  const [row] = await db.insert(earningTypes).values(values).returning({ id: earningTypes.id });
  return row ?? null;
}

export async function createDeductionTypeRepo(values: typeof deductionTypes.$inferInsert) {
  const [row] = await db.insert(deductionTypes).values(values).returning({ id: deductionTypes.id });
  return row ?? null;
}

export async function updateEarningTypeRepo(
  id: string,
  patch: Partial<typeof earningTypes.$inferInsert>,
) {
  const [row] = await db
    .update(earningTypes)
    .set(patch)
    .where(eq(earningTypes.id, id))
    .returning({ id: earningTypes.id });
  return row ?? null;
}

export async function updateDeductionTypeRepo(
  id: string,
  patch: Partial<typeof deductionTypes.$inferInsert>,
) {
  const [row] = await db
    .update(deductionTypes)
    .set(patch)
    .where(eq(deductionTypes.id, id))
    .returning({ id: deductionTypes.id });
  return row ?? null;
}

export async function getEarningTypeRepo(id: string) {
  const [row] = await db
    .select({
      id: earningTypes.id,
      companyId: earningTypes.companyId,
      code: earningTypes.code,
      name: earningTypes.name,
      isTaxable: earningTypes.isTaxable,
      isRecurring: earningTypes.isRecurring,
      isActive: earningTypes.isActive,
    })
    .from(earningTypes)
    .where(eq(earningTypes.id, id))
    .limit(1);
  return row ?? null;
}

export async function getDeductionTypeRepo(id: string) {
  const [row] = await db
    .select({
      id: deductionTypes.id,
      companyId: deductionTypes.companyId,
      code: deductionTypes.code,
      name: deductionTypes.name,
      isStatutory: deductionTypes.isStatutory,
      isRecurring: deductionTypes.isRecurring,
      isActive: deductionTypes.isActive,
    })
    .from(deductionTypes)
    .where(eq(deductionTypes.id, id))
    .limit(1);
  return row ?? null;
}

export async function listCompensationRepo(p: ListCompensationParams) {
  const where = [
    eq(employeeCompensation.companyId, p.companyId),
    eq(employeeCompensation.isActive, true),
    ...(p.employeeId ? [eq(employeeCompensation.employeeId, p.employeeId)] : []),
    ...(p.payrollGroupId ? [eq(employeeCompensation.payrollGroupId, p.payrollGroupId)] : []),
    ...(p.search
      ? [
          or(
            ilike(employees.displayName, `%${p.search}%`),
            ilike(employees.employeeNumber, `%${p.search}%`),
            ilike(payrollGroups.name, `%${p.search}%`),
          ),
        ]
      : []),
  ];

  const [countRow] = await db
    .select({ c: count() })
    .from(employeeCompensation)
    .innerJoin(employees, eq(employeeCompensation.employeeId, employees.id))
    .innerJoin(payrollGroups, eq(employeeCompensation.payrollGroupId, payrollGroups.id))
    .where(and(...where));

  const data = await db
    .select({
      id: employeeCompensation.id,
      companyId: employeeCompensation.companyId,
      employeeId: employeeCompensation.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      payrollGroupId: employeeCompensation.payrollGroupId,
      payrollGroupName: payrollGroups.name,
      payType: employeeCompensation.payType,
      currencyCode: employeeCompensation.currencyCode,
      basePayPsw: employeeCompensation.basePayPsw,
      taxProfileId: employeeCompensation.taxProfileId,
      effectiveFrom: employeeCompensation.effectiveFrom,
      effectiveTo: employeeCompensation.effectiveTo,
      isActive: employeeCompensation.isActive,
      createdAt: employeeCompensation.createdAt,
      updatedAt: employeeCompensation.updatedAt,
    })
    .from(employeeCompensation)
    .innerJoin(employees, eq(employeeCompensation.employeeId, employees.id))
    .innerJoin(payrollGroups, eq(employeeCompensation.payrollGroupId, payrollGroups.id))
    .where(and(...where))
    .orderBy(
      asc(employees.displayName),
      desc(employeeCompensation.effectiveFrom),
      desc(employeeCompensation.id),
    )
    .limit(p.limit)
    .offset(p.offset);

  return { data, totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n) };
}

export async function getCurrentEmployeeCompensationRepo(employeeId: string, companyId: string) {
  const [row] = await db
    .select({
      id: employeeCompensation.id,
      companyId: employeeCompensation.companyId,
      employeeId: employeeCompensation.employeeId,
      payrollGroupId: employeeCompensation.payrollGroupId,
      payrollGroupName: payrollGroups.name,
      payType: employeeCompensation.payType,
      currencyCode: employeeCompensation.currencyCode,
      basePayPsw: employeeCompensation.basePayPsw,
      effectiveFrom: employeeCompensation.effectiveFrom,
      effectiveTo: employeeCompensation.effectiveTo,
      isActive: employeeCompensation.isActive,
      taxProfileId: employeeCompensation.taxProfileId,
    })
    .from(employeeCompensation)
    .innerJoin(payrollGroups, eq(employeeCompensation.payrollGroupId, payrollGroups.id))
    .where(
      and(
        eq(employeeCompensation.companyId, companyId),
        eq(employeeCompensation.employeeId, employeeId),
        eq(employeeCompensation.isActive, true),
      ),
    )
    .orderBy(desc(employeeCompensation.effectiveFrom), desc(employeeCompensation.id))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select({
      id: employeeCompensationItems.id,
      companyId: employeeCompensationItems.companyId,
      employeeCompensationId: employeeCompensationItems.employeeCompensationId,
      itemType: employeeCompensationItems.itemType,
      earningTypeId: employeeCompensationItems.earningTypeId,
      deductionTypeId: employeeCompensationItems.deductionTypeId,
      calculationType: employeeCompensationItems.calculationType,
      amountPsw: employeeCompensationItems.amountPsw,
      percentageBasis: employeeCompensationItems.percentageBasis,
      isRecurring: employeeCompensationItems.isRecurring,
      effectiveFrom: employeeCompensationItems.effectiveFrom,
      effectiveTo: employeeCompensationItems.effectiveTo,
      earningCode: earningTypes.code,
      earningName: earningTypes.name,
      deductionCode: deductionTypes.code,
      deductionName: deductionTypes.name,
    })
    .from(employeeCompensationItems)
    .leftJoin(earningTypes, eq(employeeCompensationItems.earningTypeId, earningTypes.id))
    .leftJoin(deductionTypes, eq(employeeCompensationItems.deductionTypeId, deductionTypes.id))
    .where(eq(employeeCompensationItems.employeeCompensationId, row.id))
    .orderBy(asc(employeeCompensationItems.createdAt), asc(employeeCompensationItems.id));

  return { ...row, items };
}

export async function deactivateEmployeeCompensationsRepo(
  employeeId: string,
  companyId: string,
  effectiveTo: Date,
) {
  await db
    .update(employeeCompensation)
    .set({
      isActive: false,
      effectiveTo,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(employeeCompensation.companyId, companyId),
        eq(employeeCompensation.employeeId, employeeId),
        eq(employeeCompensation.isActive, true),
      ),
    );
}

export async function createEmployeeCompensationRepo(
  values: typeof employeeCompensation.$inferInsert,
) {
  const [row] = await db
    .insert(employeeCompensation)
    .values(values)
    .returning({ id: employeeCompensation.id });
  return row ?? null;
}

export async function createEmployeeCompensationItemsRepo(
  values: Array<typeof employeeCompensationItems.$inferInsert>,
) {
  if (!values.length) return [];
  return db
    .insert(employeeCompensationItems)
    .values(values)
    .returning({ id: employeeCompensationItems.id });
}

export async function createPayrollGroupRepo(values: typeof payrollGroups.$inferInsert) {
  const [row] = await db.insert(payrollGroups).values(values).returning({ id: payrollGroups.id });
  return row ?? null;
}

export async function findPayrollGroupByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: payrollGroups.id, isActive: payrollGroups.isActive })
    .from(payrollGroups)
    .where(and(eq(payrollGroups.companyId, companyId), ilike(payrollGroups.name, name)))
    .limit(1);
  return row ?? null;
}

export async function listPayrollCyclesRepo(p: ListPayrollCycleParams) {
  const where = [eq(payrollPeriods.companyId, p.companyId)];
  if (p.status !== null && p.status !== undefined) where.push(eq(payrollPeriods.status, p.status));

  const [countRow] = await db
    .select({ c: count() })
    .from(payrollPeriods)
    .where(and(...where));

  const orderBy = (p.sort ?? [])
    .map((s) => {
      if (s.field === 'createdAt')
        return s.direction === 'desc'
          ? desc(payrollPeriods.createdAt)
          : asc(payrollPeriods.createdAt);
      if (s.field === 'periodStart')
        return s.direction === 'desc'
          ? desc(payrollPeriods.periodStart)
          : asc(payrollPeriods.periodStart);
      return null;
    })
    .filter((value): value is ReturnType<typeof asc> => value !== null);

  const data = await db
    .select({
      id: payrollPeriods.id,
      companyId: payrollPeriods.companyId,
      payrollGroupId: payrollPeriods.payrollGroupId,
      payrollGroupName: payrollGroups.name,
      name: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
      status: payrollPeriods.status,
      createdBy: payrollPeriods.createdBy,
      createdAt: payrollPeriods.createdAt,
      updatedAt: payrollPeriods.updatedAt,
    })
    .from(payrollPeriods)
    .leftJoin(payrollGroups, eq(payrollPeriods.payrollGroupId, payrollGroups.id))
    .where(and(...where))
    .orderBy(
      ...(orderBy.length ? orderBy : [desc(payrollPeriods.periodStart), desc(payrollPeriods.id)]),
    )
    .limit(p.limit)
    .offset(p.offset);

  if (!data.length) {
    return {
      data,
      totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
    };
  }

  const cycleIds = data.map((row) => row.id);
  const runRows = await db
    .select({
      id: payrollRuns.id,
      payrollPeriodId: payrollRuns.payrollPeriodId,
      status: payrollRuns.status,
      journalBatchId: payrollRuns.journalBatchId,
      approvedAt: payrollRuns.approvedAt,
      createdAt: payrollRuns.createdAt,
    })
    .from(payrollRuns)
    .where(inArray(payrollRuns.payrollPeriodId, cycleIds))
    .orderBy(desc(payrollRuns.createdAt), desc(payrollRuns.id));

  const latestRunByCycleId = new Map<string, (typeof runRows)[number]>();
  for (const row of runRows) {
    if (!latestRunByCycleId.has(row.payrollPeriodId)) {
      latestRunByCycleId.set(row.payrollPeriodId, row);
    }
  }

  const enrichedData = data.map((row) => {
    const latestRun = latestRunByCycleId.get(row.id);
    return {
      ...row,
      latestRunId: latestRun?.id ?? null,
      latestRunStatus: latestRun?.status ?? null,
      journalBatchId: latestRun?.journalBatchId ?? null,
      approvedAt: latestRun?.approvedAt ?? null,
    };
  });

  return {
    data: enrichedData,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function findPayrollGroupRepo(id: string) {
  const [row] = await db
    .select({
      id: payrollGroups.id,
      companyId: payrollGroups.companyId,
      name: payrollGroups.name,
    })
    .from(payrollGroups)
    .where(eq(payrollGroups.id, id))
    .limit(1);
  return row ?? null;
}

export async function updatePayrollGroupRepo(
  id: string,
  patch: Partial<typeof payrollGroups.$inferInsert>,
) {
  const [row] = await db
    .update(payrollGroups)
    .set(patch)
    .where(eq(payrollGroups.id, id))
    .returning({ id: payrollGroups.id });
  return row ?? null;
}

export async function createPayrollCycleRepo(values: typeof payrollPeriods.$inferInsert) {
  const [row] = await db.insert(payrollPeriods).values(values).returning({ id: payrollPeriods.id });
  return row ?? null;
}

export async function getPayrollCycleRepo(id: string) {
  const [row] = await db
    .select({
      id: payrollPeriods.id,
      companyId: payrollPeriods.companyId,
      payrollGroupId: payrollPeriods.payrollGroupId,
      name: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
      status: payrollPeriods.status,
      createdBy: payrollPeriods.createdBy,
      createdAt: payrollPeriods.createdAt,
      updatedAt: payrollPeriods.updatedAt,
    })
    .from(payrollPeriods)
    .where(eq(payrollPeriods.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPayrollCycleWithGroupRepo(id: string) {
  const [row] = await db
    .select({
      id: payrollPeriods.id,
      companyId: payrollPeriods.companyId,
      payrollGroupId: payrollPeriods.payrollGroupId,
      payrollGroupName: payrollGroups.name,
      name: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
      status: payrollPeriods.status,
      currencyCode: payrollGroups.currencyCode,
    })
    .from(payrollPeriods)
    .innerJoin(payrollGroups, eq(payrollPeriods.payrollGroupId, payrollGroups.id))
    .where(eq(payrollPeriods.id, id))
    .limit(1);
  return row ?? null;
}

export async function listPayrollOvertimeEntriesRepo(input: PayrollCycleInputParams) {
  return db
    .select({
      id: payrollOvertimeEntries.id,
      companyId: payrollOvertimeEntries.companyId,
      payrollPeriodId: payrollOvertimeEntries.payrollPeriodId,
      employeeId: payrollOvertimeEntries.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      overtimeMinutes: payrollOvertimeEntries.overtimeMinutes,
      ratePerHourPsw: payrollOvertimeEntries.ratePerHourPsw,
      multiplierPct: payrollOvertimeEntries.multiplierPct,
      approvalStatus: payrollOvertimeEntries.approvalStatus,
      approvedBy: payrollOvertimeEntries.approvedBy,
      approvedAt: payrollOvertimeEntries.approvedAt,
      rejectionReason: payrollOvertimeEntries.rejectionReason,
      notes: payrollOvertimeEntries.notes,
      createdBy: payrollOvertimeEntries.createdBy,
      createdAt: payrollOvertimeEntries.createdAt,
      updatedAt: payrollOvertimeEntries.updatedAt,
    })
    .from(payrollOvertimeEntries)
    .innerJoin(employees, eq(payrollOvertimeEntries.employeeId, employees.id))
    .where(
      and(
        eq(payrollOvertimeEntries.companyId, input.companyId),
        eq(payrollOvertimeEntries.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollOvertimeEntries.createdAt), desc(payrollOvertimeEntries.id));
}

export async function createPayrollOvertimeEntryRepo(
  values: typeof payrollOvertimeEntries.$inferInsert,
) {
  const [row] = await db
    .insert(payrollOvertimeEntries)
    .values(values)
    .returning({ id: payrollOvertimeEntries.id });
  return row ?? null;
}

export async function getPayrollOvertimeEntryRepo(id: string) {
  const [row] = await db
    .select({
      id: payrollOvertimeEntries.id,
      companyId: payrollOvertimeEntries.companyId,
      payrollPeriodId: payrollOvertimeEntries.payrollPeriodId,
      employeeId: payrollOvertimeEntries.employeeId,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      approvalStatus: payrollOvertimeEntries.approvalStatus,
      approvedBy: payrollOvertimeEntries.approvedBy,
      approvedAt: payrollOvertimeEntries.approvedAt,
      rejectionReason: payrollOvertimeEntries.rejectionReason,
    })
    .from(payrollOvertimeEntries)
    .innerJoin(employees, eq(payrollOvertimeEntries.employeeId, employees.id))
    .where(eq(payrollOvertimeEntries.id, id))
    .limit(1);
  return row ?? null;
}

export async function updatePayrollOvertimeEntryRepo(
  id: string,
  patch: Partial<typeof payrollOvertimeEntries.$inferInsert>,
) {
  const [row] = await db
    .update(payrollOvertimeEntries)
    .set(patch)
    .where(eq(payrollOvertimeEntries.id, id))
    .returning({ id: payrollOvertimeEntries.id });
  return row ?? null;
}

export async function listPayrollManualAdjustmentsRepo(input: PayrollCycleInputParams) {
  return db
    .select({
      id: payrollManualAdjustments.id,
      companyId: payrollManualAdjustments.companyId,
      payrollPeriodId: payrollManualAdjustments.payrollPeriodId,
      employeeId: payrollManualAdjustments.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      itemType: payrollManualAdjustments.itemType,
      earningTypeId: payrollManualAdjustments.earningTypeId,
      deductionTypeId: payrollManualAdjustments.deductionTypeId,
      code: payrollManualAdjustments.code,
      name: payrollManualAdjustments.name,
      amountPsw: payrollManualAdjustments.amountPsw,
      isTaxable: payrollManualAdjustments.isTaxable,
      approvalStatus: payrollManualAdjustments.approvalStatus,
      approvedBy: payrollManualAdjustments.approvedBy,
      approvedAt: payrollManualAdjustments.approvedAt,
      rejectionReason: payrollManualAdjustments.rejectionReason,
      notes: payrollManualAdjustments.notes,
      createdBy: payrollManualAdjustments.createdBy,
      createdAt: payrollManualAdjustments.createdAt,
      updatedAt: payrollManualAdjustments.updatedAt,
    })
    .from(payrollManualAdjustments)
    .innerJoin(employees, eq(payrollManualAdjustments.employeeId, employees.id))
    .where(
      and(
        eq(payrollManualAdjustments.companyId, input.companyId),
        eq(payrollManualAdjustments.payrollPeriodId, input.payrollCycleId),
      ),
    )
    .orderBy(desc(payrollManualAdjustments.createdAt), desc(payrollManualAdjustments.id));
}

export async function createPayrollManualAdjustmentRepo(
  values: typeof payrollManualAdjustments.$inferInsert,
) {
  const [row] = await db
    .insert(payrollManualAdjustments)
    .values(values)
    .returning({ id: payrollManualAdjustments.id });
  return row ?? null;
}

export async function getPayrollManualAdjustmentRepo(id: string) {
  const [row] = await db
    .select({
      id: payrollManualAdjustments.id,
      companyId: payrollManualAdjustments.companyId,
      payrollPeriodId: payrollManualAdjustments.payrollPeriodId,
      employeeId: payrollManualAdjustments.employeeId,
      supervisorEmployeeId: sql<
        string | null
      >`coalesce(${employees.officerEmployeeId}, ${employees.managerEmployeeId})`,
      itemType: payrollManualAdjustments.itemType,
      approvalStatus: payrollManualAdjustments.approvalStatus,
      approvedBy: payrollManualAdjustments.approvedBy,
      approvedAt: payrollManualAdjustments.approvedAt,
      rejectionReason: payrollManualAdjustments.rejectionReason,
    })
    .from(payrollManualAdjustments)
    .innerJoin(employees, eq(payrollManualAdjustments.employeeId, employees.id))
    .where(eq(payrollManualAdjustments.id, id))
    .limit(1);
  return row ?? null;
}

export async function updatePayrollManualAdjustmentRepo(
  id: string,
  patch: Partial<typeof payrollManualAdjustments.$inferInsert>,
) {
  const [row] = await db
    .update(payrollManualAdjustments)
    .set(patch)
    .where(eq(payrollManualAdjustments.id, id))
    .returning({ id: payrollManualAdjustments.id });
  return row ?? null;
}

export async function updatePayrollCycleRepo(
  id: string,
  patch: Partial<typeof payrollPeriods.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(payrollPeriods)
    .set(patch)
    .where(eq(payrollPeriods.id, id))
    .returning({ id: payrollPeriods.id });
  return row ?? null;
}

export async function findLatestPayrollRunRepo(payrollPeriodId: string) {
  const [row] = await db
    .select({
      id: payrollRuns.id,
      companyId: payrollRuns.companyId,
      payrollPeriodId: payrollRuns.payrollPeriodId,
      status: payrollRuns.status,
      journalBatchId: payrollRuns.journalBatchId,
      approvedBy: payrollRuns.approvedBy,
      approvedAt: payrollRuns.approvedAt,
    })
    .from(payrollRuns)
    .where(eq(payrollRuns.payrollPeriodId, payrollPeriodId))
    .orderBy(desc(payrollRuns.createdAt), desc(payrollRuns.id))
    .limit(1);
  return row ?? null;
}

export async function listPayrollRunEmployeeSummariesRepo(payrollRunId: string) {
  return db
    .select({
      id: payrollRunEmployees.id,
      companyId: payrollRunEmployees.companyId,
      payrollRunId: payrollRunEmployees.payrollRunId,
      employeeId: payrollRunEmployees.employeeId,
      branchIdSnapshot: payrollRunEmployees.branchIdSnapshot,
      grossPayPsw: payrollRunEmployees.grossPayPsw,
      totalDeductionsPsw: payrollRunEmployees.totalDeductionsPsw,
      netPayPsw: payrollRunEmployees.netPayPsw,
      currencyCode: payrollRunEmployees.currencyCode,
    })
    .from(payrollRunEmployees)
    .where(eq(payrollRunEmployees.payrollRunId, payrollRunId))
    .orderBy(asc(payrollRunEmployees.employeeNameSnapshot), asc(payrollRunEmployees.id));
}

export async function listBankExportRowsRepo(payrollRunId: string) {
  return db
    .select({
      payslipId: payslips.id,
      payslipNumber: payslips.payslipNumber,
      employeeId: payrollRunEmployees.employeeId,
      employeeNumber: payrollRunEmployees.employeeNumberSnapshot,
      employeeName: payrollRunEmployees.employeeNameSnapshot,
      bankName: employees.bankName,
      bankAccountName: employees.bankAccountName,
      bankAccountNumber: employees.bankAccountNumber,
      mobileMoneyNumber: employees.mobileMoneyNumber,
      paymentMethod: employees.paymentMethod,
      netPayPsw: payrollRunEmployees.netPayPsw,
      currencyCode: payrollRunEmployees.currencyCode,
    })
    .from(payrollRunEmployees)
    .leftJoin(employees, eq(employees.id, payrollRunEmployees.employeeId))
    .leftJoin(payslips, eq(payslips.payrollRunEmployeeId, payrollRunEmployees.id))
    .where(eq(payrollRunEmployees.payrollRunId, payrollRunId))
    .orderBy(asc(payrollRunEmployees.employeeNameSnapshot), asc(payrollRunEmployees.id));
}

export async function getPayslipDetailRepo(payslipId: string) {
  const [header] = await db
    .select({
      id: payslips.id,
      companyId: payslips.companyId,
      payrollRunEmployeeId: payslips.payrollRunEmployeeId,
      payslipNumber: payslips.payslipNumber,
      issuedAt: payslips.issuedAt,
      deliveryStatus: payslips.deliveryStatus,
      employeeId: payrollRunEmployees.employeeId,
      employeeNumber: payrollRunEmployees.employeeNumberSnapshot,
      employeeName: payrollRunEmployees.employeeNameSnapshot,
      branchId: payrollRunEmployees.branchIdSnapshot,
      departmentName: payrollRunEmployees.departmentNameSnapshot,
      jobTitleName: payrollRunEmployees.jobTitleNameSnapshot,
      basePayPsw: payrollRunEmployees.basePayPsw,
      grossPayPsw: payrollRunEmployees.grossPayPsw,
      totalDeductionsPsw: payrollRunEmployees.totalDeductionsPsw,
      netPayPsw: payrollRunEmployees.netPayPsw,
      currencyCode: payrollRunEmployees.currencyCode,
      payrollRunId: payrollRunEmployees.payrollRunId,
      payrollCycleId: payrollRuns.payrollPeriodId,
      payrollCycleName: payrollPeriods.name,
      periodStart: payrollPeriods.periodStart,
      periodEnd: payrollPeriods.periodEnd,
      paymentDate: payrollPeriods.paymentDate,
    })
    .from(payslips)
    .innerJoin(payrollRunEmployees, eq(payrollRunEmployees.id, payslips.payrollRunEmployeeId))
    .innerJoin(payrollRuns, eq(payrollRuns.id, payrollRunEmployees.payrollRunId))
    .innerJoin(payrollPeriods, eq(payrollPeriods.id, payrollRuns.payrollPeriodId))
    .where(eq(payslips.id, payslipId))
    .limit(1);

  if (!header) return null;

  const items = await db
    .select({
      id: payrollRunItems.id,
      itemType: payrollRunItems.itemType,
      code: payrollRunItems.code,
      name: payrollRunItems.name,
      amountPsw: payrollRunItems.amountPsw,
      isTaxable: payrollRunItems.isTaxable,
      source: payrollRunItems.source,
      metadata: payrollRunItems.metadata,
    })
    .from(payrollRunItems)
    .where(eq(payrollRunItems.payrollRunEmployeeId, header.payrollRunEmployeeId))
    .orderBy(asc(payrollRunItems.createdAt), asc(payrollRunItems.id));

  return { ...header, items };
}

export async function createPayrollRunRepo(values: typeof payrollRuns.$inferInsert) {
  const [row] = await db.insert(payrollRuns).values(values).returning({ id: payrollRuns.id });
  return row ?? null;
}

export async function updatePayrollRunRepo(
  id: string,
  patch: Partial<typeof payrollRuns.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(payrollRuns)
    .set(patch)
    .where(eq(payrollRuns.id, id))
    .returning({ id: payrollRuns.id });
  return row ?? null;
}

export async function replacePayrollRunDataRepo(input: {
  runId: string;
  runEmployees: Array<typeof payrollRunEmployees.$inferInsert>;
  runItems: Array<typeof payrollRunItems.$inferInsert>;
  payslipRows: Array<typeof payslips.$inferInsert>;
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(payslips)
      .where(
        inArray(
          payslips.payrollRunEmployeeId,
          tx
            .select({ id: payrollRunEmployees.id })
            .from(payrollRunEmployees)
            .where(eq(payrollRunEmployees.payrollRunId, input.runId)),
        ),
      );

    await tx
      .delete(payrollRunItems)
      .where(
        inArray(
          payrollRunItems.payrollRunEmployeeId,
          tx
            .select({ id: payrollRunEmployees.id })
            .from(payrollRunEmployees)
            .where(eq(payrollRunEmployees.payrollRunId, input.runId)),
        ),
      );

    await tx.delete(payrollRunEmployees).where(eq(payrollRunEmployees.payrollRunId, input.runId));

    const insertedEmployees = input.runEmployees.length
      ? await tx
          .insert(payrollRunEmployees)
          .values(input.runEmployees)
          .returning({ id: payrollRunEmployees.id, employeeId: payrollRunEmployees.employeeId })
      : [];

    if (!insertedEmployees.length) {
      return;
    }

    const runEmployeeIdByEmployeeId = new Map(
      insertedEmployees.map((row) => [row.employeeId, row.id]),
    );

    if (input.runItems.length) {
      await tx.insert(payrollRunItems).values(
        input.runItems.map((item) => ({
          ...item,
          payrollRunEmployeeId:
            runEmployeeIdByEmployeeId.get(item.payrollRunEmployeeId) ?? item.payrollRunEmployeeId,
        })),
      );
    }

    if (input.payslipRows.length) {
      await tx.insert(payslips).values(
        input.payslipRows.map((row) => ({
          ...row,
          payrollRunEmployeeId:
            runEmployeeIdByEmployeeId.get(row.payrollRunEmployeeId) ?? row.payrollRunEmployeeId,
        })),
      );
    }
  });
}

export async function listCompensationByGroupAndPeriodRepo(input: {
  companyId: string;
  payrollGroupId: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  const rows = await db
    .select({
      compensationId: employeeCompensation.id,
      companyId: employeeCompensation.companyId,
      employeeId: employeeCompensation.employeeId,
      employeeNumber: employees.employeeNumber,
      employeeName: employees.displayName,
      branchId: employees.branchId,
      departmentName: departments.name,
      jobTitleName: jobTitles.name,
      employmentStatus: employees.employmentStatus,
      payrollGroupId: employeeCompensation.payrollGroupId,
      payType: employeeCompensation.payType,
      currencyCode: employeeCompensation.currencyCode,
      basePayPsw: employeeCompensation.basePayPsw,
      taxProfileId: employeeCompensation.taxProfileId,
      effectiveFrom: employeeCompensation.effectiveFrom,
      effectiveTo: employeeCompensation.effectiveTo,
    })
    .from(employeeCompensation)
    .innerJoin(employees, eq(employeeCompensation.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobTitles, eq(employees.jobTitleId, jobTitles.id))
    .where(
      and(
        eq(employeeCompensation.companyId, input.companyId),
        eq(employeeCompensation.payrollGroupId, input.payrollGroupId),
        eq(employeeCompensation.isActive, true),
        eq(employees.isDeleted, false),
        lte(employeeCompensation.effectiveFrom, input.periodEnd),
        or(
          isNull(employeeCompensation.effectiveTo),
          gte(employeeCompensation.effectiveTo, input.periodStart),
        ),
      ),
    )
    .orderBy(
      asc(employees.displayName),
      desc(employeeCompensation.effectiveFrom),
      desc(employeeCompensation.id),
    );

  if (!rows.length) return [];

  const compensationIds = rows.map((row) => row.compensationId);
  const items = compensationIds.length
    ? await db
        .select({
          id: employeeCompensationItems.id,
          employeeCompensationId: employeeCompensationItems.employeeCompensationId,
          itemType: employeeCompensationItems.itemType,
          earningTypeId: employeeCompensationItems.earningTypeId,
          deductionTypeId: employeeCompensationItems.deductionTypeId,
          calculationType: employeeCompensationItems.calculationType,
          amountPsw: employeeCompensationItems.amountPsw,
          percentageBasis: employeeCompensationItems.percentageBasis,
          isRecurring: employeeCompensationItems.isRecurring,
          effectiveFrom: employeeCompensationItems.effectiveFrom,
          effectiveTo: employeeCompensationItems.effectiveTo,
          earningCode: earningTypes.code,
          earningName: earningTypes.name,
          earningIsTaxable: earningTypes.isTaxable,
          deductionCode: deductionTypes.code,
          deductionName: deductionTypes.name,
        })
        .from(employeeCompensationItems)
        .leftJoin(earningTypes, eq(employeeCompensationItems.earningTypeId, earningTypes.id))
        .leftJoin(deductionTypes, eq(employeeCompensationItems.deductionTypeId, deductionTypes.id))
        .where(
          and(
            inArray(employeeCompensationItems.employeeCompensationId, compensationIds),
            or(
              isNull(employeeCompensationItems.effectiveFrom),
              lte(employeeCompensationItems.effectiveFrom, input.periodEnd),
            ),
            or(
              isNull(employeeCompensationItems.effectiveTo),
              gte(employeeCompensationItems.effectiveTo, input.periodStart),
            ),
          ),
        )
    : [];

  const taxProfileIds = Array.from(
    new Set(rows.map((row) => row.taxProfileId).filter((value): value is string => Boolean(value))),
  );
  const profileComponents = taxProfileIds.length
    ? await db
        .select({
          profileId: taxComponents.profileId,
          key: taxComponents.key,
          numerator: taxComponents.numerator,
          denominator: taxComponents.denominator,
          inclusive: taxComponents.inclusive,
          sortOrder: taxComponents.sortOrder,
          active: taxComponents.active,
        })
        .from(taxComponents)
        .where(and(inArray(taxComponents.profileId, taxProfileIds), eq(taxComponents.active, true)))
        .orderBy(asc(taxComponents.profileId), asc(taxComponents.sortOrder), asc(taxComponents.key))
    : [];

  const itemsByCompensationId = new Map<string, typeof items>();
  for (const item of items) {
    const arr = itemsByCompensationId.get(item.employeeCompensationId) ?? [];
    arr.push(item);
    itemsByCompensationId.set(item.employeeCompensationId, arr);
  }

  const componentsByProfileId = new Map<string, typeof profileComponents>();
  for (const component of profileComponents) {
    const arr = componentsByProfileId.get(component.profileId) ?? [];
    arr.push(component);
    componentsByProfileId.set(component.profileId, arr);
  }

  return rows.map((row) => ({
    ...row,
    items: itemsByCompensationId.get(row.compensationId) ?? [],
    taxComponents: row.taxProfileId ? (componentsByProfileId.get(row.taxProfileId) ?? []) : [],
  }));
}

export async function listPayrollOvertimeEntriesByEmployeesRepo(input: {
  companyId: string;
  payrollCycleId: string;
  employeeIds: string[];
}) {
  if (!input.employeeIds.length) return [];

  return db
    .select({
      id: payrollOvertimeEntries.id,
      employeeId: payrollOvertimeEntries.employeeId,
      overtimeMinutes: payrollOvertimeEntries.overtimeMinutes,
      ratePerHourPsw: payrollOvertimeEntries.ratePerHourPsw,
      multiplierPct: payrollOvertimeEntries.multiplierPct,
      notes: payrollOvertimeEntries.notes,
    })
    .from(payrollOvertimeEntries)
    .where(
      and(
        eq(payrollOvertimeEntries.companyId, input.companyId),
        eq(payrollOvertimeEntries.payrollPeriodId, input.payrollCycleId),
        eq(payrollOvertimeEntries.approvalStatus, 1),
        inArray(payrollOvertimeEntries.employeeId, input.employeeIds),
      ),
    )
    .orderBy(asc(payrollOvertimeEntries.createdAt), asc(payrollOvertimeEntries.id));
}

export async function listPayrollManualAdjustmentsByEmployeesRepo(input: {
  companyId: string;
  payrollCycleId: string;
  employeeIds: string[];
}) {
  if (!input.employeeIds.length) return [];

  return db
    .select({
      id: payrollManualAdjustments.id,
      employeeId: payrollManualAdjustments.employeeId,
      itemType: payrollManualAdjustments.itemType,
      code: payrollManualAdjustments.code,
      name: payrollManualAdjustments.name,
      amountPsw: payrollManualAdjustments.amountPsw,
      isTaxable: payrollManualAdjustments.isTaxable,
      notes: payrollManualAdjustments.notes,
    })
    .from(payrollManualAdjustments)
    .where(
      and(
        eq(payrollManualAdjustments.companyId, input.companyId),
        eq(payrollManualAdjustments.payrollPeriodId, input.payrollCycleId),
        eq(payrollManualAdjustments.approvalStatus, 1),
        inArray(payrollManualAdjustments.employeeId, input.employeeIds),
      ),
    )
    .orderBy(asc(payrollManualAdjustments.createdAt), asc(payrollManualAdjustments.id));
}

export async function listPayslipsByCycleRepo(input: {
  payrollCycleId: string;
  employeeId?: string | null;
  limit: number;
  offset: number;
}) {
  const where = [eq(payrollRuns.payrollPeriodId, input.payrollCycleId)];
  if (input.employeeId) where.push(eq(payrollRunEmployees.employeeId, input.employeeId));

  const [countRow] = await db
    .select({ c: count() })
    .from(payslips)
    .innerJoin(payrollRunEmployees, eq(payslips.payrollRunEmployeeId, payrollRunEmployees.id))
    .innerJoin(payrollRuns, eq(payrollRunEmployees.payrollRunId, payrollRuns.id))
    .where(and(...where));

  const data = await db
    .select({
      id: payslips.id,
      payrollRunEmployeeId: payslips.payrollRunEmployeeId,
      payslipNumber: payslips.payslipNumber,
      issuedAt: payslips.issuedAt,
      deliveryStatus: payslips.deliveryStatus,
      employeeId: payrollRunEmployees.employeeId,
      employeeName: employees.displayName,
      netPayPsw: payrollRunEmployees.netPayPsw,
      createdAt: payslips.createdAt,
    })
    .from(payslips)
    .innerJoin(payrollRunEmployees, eq(payslips.payrollRunEmployeeId, payrollRunEmployees.id))
    .innerJoin(payrollRuns, eq(payrollRunEmployees.payrollRunId, payrollRuns.id))
    .innerJoin(employees, eq(payrollRunEmployees.employeeId, employees.id))
    .where(and(...where))
    .orderBy(desc(payslips.createdAt), desc(payslips.id))
    .limit(input.limit)
    .offset(input.offset);

  return {
    data,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function getAttendanceSummariesRepo(input: {
  companyId: string;
  employeeIds: string[];
  periodStart: Date;
  periodEnd: Date;
}) {
  if (!input.employeeIds.length) {
    return new Map<
      string,
      {
        presentDays: number;
        halfDays: number;
        totalMinutesWorked: number;
      }
    >();
  }

  const rows = await db
    .select({
      employeeId: attendanceRecords.employeeId,
      status: attendanceRecords.status,
      minutesWorked: attendanceRecords.minutesWorked,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.companyId, input.companyId),
        inArray(attendanceRecords.employeeId, input.employeeIds),
        gte(attendanceRecords.attendanceDate, input.periodStart),
        lte(attendanceRecords.attendanceDate, input.periodEnd),
      ),
    );

  const summaryByEmployeeId = new Map<
    string,
    {
      presentDays: number;
      halfDays: number;
      totalMinutesWorked: number;
    }
  >();

  for (const row of rows) {
    const current = summaryByEmployeeId.get(row.employeeId) ?? {
      presentDays: 0,
      halfDays: 0,
      totalMinutesWorked: 0,
    };

    if (row.status === 0 || row.status === 2) {
      current.presentDays += 1;
    } else if (row.status === 3) {
      current.halfDays += 1;
    }

    current.totalMinutesWorked += Number(row.minutesWorked ?? 0);
    summaryByEmployeeId.set(row.employeeId, current);
  }

  return summaryByEmployeeId;
}
