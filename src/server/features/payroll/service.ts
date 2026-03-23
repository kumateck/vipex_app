import { createId } from '@paralleldrive/cuid2';
import { Conflict, NotFound } from '@/server/utils/http-error';
import {
  CompensationItemCalculationType,
  EmploymentStatus,
  JournalSourceType,
  PayrollItemType,
  PayrollPeriodStatus,
  PayrollRunStatus,
} from '@/db/schemas/enums';
import { recordAuditLog } from '../audit/logger';
import { assertAccountingEnabledSvc } from '../accounting/service';
import { postJournalEntrySvc, type JournalLineInput } from '../accounting/posting.service';
import { getAccountByCodeRepo, listJournalLinesByBatchRepo } from '../accounting/repository';
import {
  createDeductionTypeRepo,
  createEarningTypeRepo,
  createEmployeeCompensationItemsRepo,
  createEmployeeCompensationRepo,
  createPayrollGroupRepo,
  createPayrollCycleRepo,
  deactivateEmployeeCompensationsRepo,
  findDeductionTypeByCodeRepo,
  findEarningTypeByCodeRepo,
  findPayrollGroupByNameRepo,
  createPayrollRunRepo,
  findLatestPayrollRunRepo,
  getDeductionTypeRepo,
  getEarningTypeRepo,
  findPayrollGroupRepo,
  getCurrentEmployeeCompensationRepo,
  getPayrollCycleRepo,
  getPayrollCycleWithGroupRepo,
  listCompensationByGroupAndPeriodRepo,
  listPayrollRunEmployeeSummariesRepo,
  listCompensationRepo,
  listBankExportRowsRepo,
  listDeductionTypesRepo,
  listEarningTypesRepo,
  listPayrollGroupsRepo,
  listPayrollCyclesRepo,
  listPayslipsByCycleRepo,
  getPayslipDetailRepo,
  replacePayrollRunDataRepo,
  updateDeductionTypeRepo,
  updateEarningTypeRepo,
  updatePayrollGroupRepo,
  updatePayrollCycleRepo,
  updatePayrollRunRepo,
  type ListCompensationParams,
  type ListPayrollTypeParams,
  type ListPayrollGroupParams,
  type ListPayrollCycleParams,
} from './repository';
import { getEmployeeSvc } from '../hr/service';
import { db } from '@/db/config';

export async function listPayrollGroupsSvc(p: ListPayrollGroupParams) {
  return listPayrollGroupsRepo(p);
}

export async function listEarningTypesSvc(p: ListPayrollTypeParams) {
  return listEarningTypesRepo(p);
}

export async function listDeductionTypesSvc(p: ListPayrollTypeParams) {
  return listDeductionTypesRepo(p);
}

export async function createEarningTypeSvc(input: {
  companyId: string;
  code: string;
  name: string;
  isTaxable?: boolean;
  isRecurring?: boolean;
}) {
  const duplicate = await findEarningTypeByCodeRepo(input.companyId, input.code);
  if (duplicate) throw Conflict('Earning type code already exists');
  const created = await createEarningTypeRepo({
    companyId: input.companyId,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    isTaxable: input.isTaxable ?? true,
    isRecurring: input.isRecurring ?? true,
  });
  return { id: created?.id };
}

export async function createDeductionTypeSvc(input: {
  companyId: string;
  code: string;
  name: string;
  isStatutory?: boolean;
  isRecurring?: boolean;
}) {
  const duplicate = await findDeductionTypeByCodeRepo(input.companyId, input.code);
  if (duplicate) throw Conflict('Deduction type code already exists');
  const created = await createDeductionTypeRepo({
    companyId: input.companyId,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    isStatutory: input.isStatutory ?? false,
    isRecurring: input.isRecurring ?? true,
  });
  return { id: created?.id };
}

export async function updateEarningTypeSvc(
  id: string,
  companyId: string,
  patch: {
    code?: string;
    name?: string;
    isTaxable?: boolean;
    isRecurring?: boolean;
    isActive?: boolean;
  },
) {
  const current = await getEarningTypeRepo(id);
  if (!current || current.companyId !== companyId) throw NotFound('Earning type not found');
  if (patch.code && patch.code.trim().toUpperCase() !== current.code) {
    const duplicate = await findEarningTypeByCodeRepo(companyId, patch.code);
    if (duplicate && duplicate.id !== id) throw Conflict('Earning type code already exists');
  }
  const updated = await updateEarningTypeRepo(id, {
    code: patch.code?.trim().toUpperCase(),
    name: patch.name?.trim(),
    isTaxable: patch.isTaxable,
    isRecurring: patch.isRecurring,
    isActive: patch.isActive,
  });
  return { id: updated?.id };
}

export async function updateDeductionTypeSvc(
  id: string,
  companyId: string,
  patch: {
    code?: string;
    name?: string;
    isStatutory?: boolean;
    isRecurring?: boolean;
    isActive?: boolean;
  },
) {
  const current = await getDeductionTypeRepo(id);
  if (!current || current.companyId !== companyId) throw NotFound('Deduction type not found');
  if (patch.code && patch.code.trim().toUpperCase() !== current.code) {
    const duplicate = await findDeductionTypeByCodeRepo(companyId, patch.code);
    if (duplicate && duplicate.id !== id) throw Conflict('Deduction type code already exists');
  }
  const updated = await updateDeductionTypeRepo(id, {
    code: patch.code?.trim().toUpperCase(),
    name: patch.name?.trim(),
    isStatutory: patch.isStatutory,
    isRecurring: patch.isRecurring,
    isActive: patch.isActive,
  });
  return { id: updated?.id };
}

export async function listCompensationSvc(p: ListCompensationParams) {
  return listCompensationRepo(p);
}

export async function getEmployeeCompensationSvc(employeeId: string, companyId: string) {
  await getEmployeeSvc(employeeId);
  return getCurrentEmployeeCompensationRepo(employeeId, companyId);
}

function toInactiveEffectiveTo(effectiveFrom: Date) {
  return new Date(effectiveFrom.getTime() - 1000);
}

export async function setEmployeeCompensationSvc(input: {
  companyId: string;
  employeeId: string;
  payrollGroupId: string;
  payType: number;
  currencyCode?: string | null;
  basePayPsw: number;
  effectiveFrom: Date;
  taxProfileId?: string | null;
  createdBy: string;
  items: Array<{
    itemType: number;
    earningTypeId?: string | null;
    deductionTypeId?: string | null;
    calculationType: number;
    amountPsw: number;
    percentageBasis?: string | null;
    isRecurring?: boolean;
    effectiveFrom?: Date | null;
    effectiveTo?: Date | null;
  }>;
}) {
  const employee = await getEmployeeSvc(input.employeeId);
  if (employee.companyId !== input.companyId) throw NotFound('Employee not found');

  const payrollGroup = await findPayrollGroupRepo(input.payrollGroupId);
  if (!payrollGroup || payrollGroup.companyId !== input.companyId) {
    throw NotFound('Payroll group not found');
  }

  await deactivateEmployeeCompensationsRepo(
    input.employeeId,
    input.companyId,
    toInactiveEffectiveTo(input.effectiveFrom),
  );

  const created = await createEmployeeCompensationRepo({
    companyId: input.companyId,
    employeeId: input.employeeId,
    payrollGroupId: input.payrollGroupId,
    payType: input.payType,
    currencyCode: input.currencyCode?.trim() || 'GHS',
    basePayPsw: input.basePayPsw,
    effectiveFrom: input.effectiveFrom,
    isActive: true,
    taxProfileId: input.taxProfileId ?? null,
    createdBy: input.createdBy,
  });

  if (!created?.id) throw Conflict('Unable to create compensation record');

  await createEmployeeCompensationItemsRepo(
    input.items.map((item) => ({
      companyId: input.companyId,
      employeeCompensationId: created.id,
      itemType: item.itemType,
      earningTypeId: item.earningTypeId ?? null,
      deductionTypeId: item.deductionTypeId ?? null,
      calculationType: item.calculationType,
      amountPsw: item.amountPsw,
      percentageBasis: item.percentageBasis ?? null,
      isRecurring: item.isRecurring ?? true,
      effectiveFrom: item.effectiveFrom ?? null,
      effectiveTo: item.effectiveTo ?? null,
    })),
  );

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'employee_compensation',
    entityId: created.id,
    action: 'EMPLOYEE_COMPENSATION_SET',
    message: 'Employee compensation configured',
    metadata: {
      employeeId: input.employeeId,
      payrollGroupId: input.payrollGroupId,
      itemCount: input.items.length,
      basePayPsw: input.basePayPsw,
    },
  });

  return { id: created.id };
}

export async function createPayrollGroupSvc(input: {
  companyId: string;
  name: string;
  payFrequency: number;
  currencyCode?: string | null;
  createdBy: string;
}) {
  const duplicate = await findPayrollGroupByNameRepo(input.companyId, input.name);
  if (duplicate) throw Conflict('Payroll group name already exists');
  const created = await createPayrollGroupRepo({
    companyId: input.companyId,
    name: input.name,
    payFrequency: input.payFrequency,
    currencyCode: input.currencyCode ?? 'GHS',
    createdBy: input.createdBy,
  });
  return { id: created?.id };
}

export async function updatePayrollGroupSvc(
  id: string,
  companyId: string,
  patch: {
    name?: string;
    payFrequency?: number;
    currencyCode?: string | null;
    isActive?: boolean;
  },
) {
  const current = await findPayrollGroupRepo(id);
  if (!current || current.companyId !== companyId) throw NotFound('Payroll group not found');
  if (patch.name && patch.name !== current.name) {
    const duplicate = await findPayrollGroupByNameRepo(companyId, patch.name);
    if (duplicate && duplicate.id !== id) throw Conflict('Payroll group name already exists');
  }
  const updated = await updatePayrollGroupRepo(id, {
    ...patch,
    currencyCode: patch.currencyCode ?? undefined,
  });
  return { id: updated?.id };
}

export async function listPayrollCyclesSvc(p: ListPayrollCycleParams) {
  return listPayrollCyclesRepo(p);
}

export async function createPayrollCycleSvc(input: {
  companyId: string;
  payrollGroupId: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate?: Date | null;
  createdBy: string;
}) {
  const group = await findPayrollGroupRepo(input.payrollGroupId);
  if (!group || group.companyId !== input.companyId) throw NotFound('Payroll group not found');

  const created = await createPayrollCycleRepo({
    companyId: input.companyId,
    payrollGroupId: input.payrollGroupId,
    name: `${group.name} ${input.periodStart.toISOString().slice(0, 10)} - ${input.periodEnd.toISOString().slice(0, 10)}`,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    paymentDate: input.paymentDate ?? null,
    status: PayrollPeriodStatus.OPEN,
    createdBy: input.createdBy,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'payroll_cycle',
    entityId: created?.id ?? null,
    action: 'PAYROLL_CYCLE_CREATED',
    message: 'Payroll cycle created',
    metadata: {
      payrollGroupId: input.payrollGroupId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
    },
  });

  return { id: created?.id };
}

function calculateItemAmount(
  basePayPsw: number,
  item: {
    calculationType: number;
    amountPsw: number;
    percentageBasis?: string | null;
  },
) {
  if (item.calculationType === CompensationItemCalculationType.PERCENTAGE) {
    const basis = (item.percentageBasis ?? 'base_pay').toLowerCase();
    const referenceAmount = basis === 'base_pay' ? basePayPsw : basePayPsw;
    return Math.round((referenceAmount * item.amountPsw) / 100);
  }
  return item.amountPsw;
}

function calculateStatutoryComponents(
  taxableGrossPsw: number,
  components: Array<{
    key: string;
    numerator: number;
    denominator: number;
    inclusive: boolean;
  }>,
) {
  return components
    .map((component) => {
      const numerator = Number(component.numerator ?? 0);
      const denominator = Number(component.denominator ?? 0);
      if (taxableGrossPsw <= 0 || numerator <= 0 || denominator <= 0) return null;
      const amountPsw = Math.round((taxableGrossPsw * numerator) / denominator);
      if (amountPsw <= 0) return null;
      return {
        code: component.key,
        name: `Statutory ${component.key}`,
        amountPsw,
        inclusive: component.inclusive,
      };
    })
    .filter(
      (value): value is { code: string; name: string; amountPsw: number; inclusive: boolean } =>
        Boolean(value),
    );
}

export async function runPayrollCycleSvc(id: string, initiatedBy: string) {
  const cycle = await getPayrollCycleWithGroupRepo(id);
  if (!cycle) throw NotFound('Payroll cycle not found');
  if (
    cycle.status === PayrollPeriodStatus.APPROVED ||
    cycle.status === PayrollPeriodStatus.POSTED
  ) {
    throw Conflict('Cannot run an approved or posted payroll cycle');
  }

  const existingRun = await findLatestPayrollRunRepo(id);
  let runId = existingRun?.id ?? null;

  if (!existingRun) {
    const run = await createPayrollRunRepo({
      companyId: cycle.companyId,
      payrollPeriodId: cycle.id,
      status: PayrollRunStatus.PROCESSING,
      startedBy: initiatedBy,
      startedAt: new Date(),
      notes: `Payroll run for ${cycle.name}`,
    });
    runId = run?.id ?? null;
  } else {
    await updatePayrollRunRepo(existingRun.id, {
      status: PayrollRunStatus.PROCESSING,
      startedBy: initiatedBy,
      startedAt: new Date(),
    });
    runId = existingRun.id;
  }

  if (!runId) throw Conflict('Unable to create payroll run');

  const compensationRows = await listCompensationByGroupAndPeriodRepo({
    companyId: cycle.companyId,
    payrollGroupId: cycle.payrollGroupId,
    periodStart: cycle.periodStart,
    periodEnd: cycle.periodEnd,
  });

  const eligibleRows = compensationRows.filter(
    (row) =>
      row.employmentStatus !== EmploymentStatus.RESIGNED &&
      row.employmentStatus !== EmploymentStatus.TERMINATED &&
      row.employmentStatus !== EmploymentStatus.INACTIVE,
  );

  const runEmployees = eligibleRows.map((row) => {
    let grossPayPsw = row.basePayPsw;
    let totalDeductionsPsw = 0;
    let taxableGrossPsw = row.basePayPsw;
    const computedItems = row.items.map((item) => {
      const amount = calculateItemAmount(row.basePayPsw, item);
      if (item.itemType === PayrollItemType.DEDUCTION) {
        totalDeductionsPsw += amount;
      } else {
        grossPayPsw += amount;
        if (item.earningIsTaxable) {
          taxableGrossPsw += amount;
        }
      }

      return {
        employeeId: row.employeeId,
        itemType: item.itemType,
        code:
          item.itemType === PayrollItemType.DEDUCTION
            ? (item.deductionCode ?? 'DEDUCTION')
            : (item.earningCode ?? 'EARNING'),
        name:
          item.itemType === PayrollItemType.DEDUCTION
            ? (item.deductionName ?? 'Deduction')
            : (item.earningName ?? 'Earning'),
        amountPsw: amount,
        isTaxable:
          item.itemType === PayrollItemType.DEDUCTION ? false : Boolean(item.earningIsTaxable),
        source: 'compensation',
        metadata: {
          compensationItemId: item.id,
          calculationType: item.calculationType,
          percentageBasis: item.percentageBasis ?? null,
        },
      };
    });

    const statutoryItems = calculateStatutoryComponents(
      taxableGrossPsw,
      row.taxComponents ?? [],
    ).map((item) => {
      totalDeductionsPsw += item.amountPsw;
      return {
        employeeId: row.employeeId,
        itemType: PayrollItemType.DEDUCTION,
        code: item.code,
        name: item.name,
        amountPsw: item.amountPsw,
        isTaxable: false,
        source: 'statutory',
        metadata: { inclusive: item.inclusive, taxProfileId: row.taxProfileId ?? null },
      };
    });

    const netPayPsw = grossPayPsw - totalDeductionsPsw;

    return {
      employeeId: row.employeeId,
      snapshot: {
        companyId: cycle.companyId,
        payrollRunId: runId!,
        employeeId: row.employeeId,
        employeeNumberSnapshot: row.employeeNumber,
        employeeNameSnapshot: row.employeeName,
        branchIdSnapshot: row.branchId ?? null,
        departmentNameSnapshot: row.departmentName ?? null,
        jobTitleNameSnapshot: row.jobTitleName ?? null,
        basePayPsw: row.basePayPsw,
        grossPayPsw,
        totalDeductionsPsw,
        netPayPsw,
        currencyCode: row.currencyCode || cycle.currencyCode || 'GHS',
        status: 'calculated',
      },
      items: [
        {
          employeeId: row.employeeId,
          itemType: PayrollItemType.EARNING,
          code: 'BASE',
          name: 'Base Pay',
          amountPsw: row.basePayPsw,
          isTaxable: true,
          source: 'base',
          metadata: { payType: row.payType },
        },
        ...computedItems,
        ...statutoryItems,
      ],
      payslip: {
        employeeId: row.employeeId,
        companyId: cycle.companyId,
        payslipNumber: `PS-${cycle.id.slice(0, 6).toUpperCase()}-${row.employeeNumber}`,
        issuedAt: new Date(),
        deliveryStatus: 'generated',
      },
    };
  });

  await replacePayrollRunDataRepo({
    runId,
    runEmployees: runEmployees.map((row) => row.snapshot),
    runItems: runEmployees.flatMap((row) =>
      row.items.map((item) => ({
        companyId: cycle.companyId,
        payrollRunEmployeeId: item.employeeId,
        itemType: item.itemType,
        code: item.code,
        name: item.name,
        amountPsw: item.amountPsw,
        isTaxable: item.isTaxable,
        source: item.source,
        metadata: item.metadata,
      })),
    ),
    payslipRows: runEmployees.map((row) => ({
      id: createId(),
      companyId: row.payslip.companyId,
      payrollRunEmployeeId: row.payslip.employeeId,
      payslipNumber: row.payslip.payslipNumber,
      issuedAt: row.payslip.issuedAt,
      deliveryStatus: row.payslip.deliveryStatus,
    })),
  });

  await updatePayrollRunRepo(runId, {
    status: PayrollRunStatus.COMPLETED,
    notes: `Calculated ${runEmployees.length} employee(s)`,
  });
  await updatePayrollCycleRepo(id, { status: PayrollPeriodStatus.PROCESSING });

  await recordAuditLog({
    companyId: cycle.companyId,
    actorUserId: initiatedBy,
    entityType: 'payroll_run',
    entityId: runId,
    action: 'PAYROLL_RUN_COMPLETED',
    message: 'Payroll cycle run completed',
    metadata: {
      payrollCycleId: cycle.id,
      payrollGroupId: cycle.payrollGroupId,
      employeeCount: runEmployees.length,
    },
  });

  return { id: runId, employeeCount: runEmployees.length };
}

export async function approvePayrollCycleSvc(
  id: string,
  approvedBy: string,
  comments?: string | null,
) {
  const cycle = await getPayrollCycleRepo(id);
  if (!cycle) throw NotFound('Payroll cycle not found');

  const run = await findLatestPayrollRunRepo(id);
  if (!run) throw Conflict('Payroll cycle must be run before approval');

  await updatePayrollRunRepo(run.id, {
    status: PayrollRunStatus.APPROVED,
    approvedBy,
    approvedAt: new Date(),
    notes: comments ?? null,
  });
  await updatePayrollCycleRepo(id, { status: PayrollPeriodStatus.APPROVED });

  return { id: run.id };
}

export async function journalizePayrollCycleSvc(id: string, postedBy: string) {
  const cycle = await getPayrollCycleRepo(id);
  if (!cycle) throw NotFound('Payroll cycle not found');
  if (cycle.status !== PayrollPeriodStatus.APPROVED) {
    throw Conflict('Payroll cycle must be approved before journal posting');
  }

  await assertAccountingEnabledSvc(cycle.companyId);

  const run = await findLatestPayrollRunRepo(id);
  if (!run) throw Conflict('Payroll cycle must be run before posting');
  if (run.status !== PayrollRunStatus.APPROVED) {
    throw Conflict('Payroll run must be approved before journal posting');
  }
  if (run.journalBatchId) {
    throw Conflict('Payroll cycle has already been journalized');
  }

  const runEmployees = await listPayrollRunEmployeeSummariesRepo(run.id);
  if (!runEmployees.length) {
    throw Conflict('Payroll run has no employee results to journalize');
  }

  return db.transaction(async (tx) => {
    const compensationExpense = await getAccountByCodeRepo(cycle.companyId, '5190', tx);
    if (!compensationExpense || !compensationExpense.active) {
      throw NotFound('Accounting account 5190 not found');
    }

    const accruedExpenses = await getAccountByCodeRepo(cycle.companyId, '2100', tx);
    if (!accruedExpenses || !accruedExpenses.active) {
      throw NotFound('Accounting account 2100 not found');
    }

    const totalsByBranch = new Map<string, number>();
    for (const row of runEmployees) {
      const branchKey = row.branchIdSnapshot ?? '__unassigned__';
      totalsByBranch.set(
        branchKey,
        (totalsByBranch.get(branchKey) ?? 0) + Number(row.grossPayPsw ?? 0),
      );
    }

    const lines: JournalLineInput[] = [];
    for (const [branchKey, grossPayPsw] of totalsByBranch.entries()) {
      if (grossPayPsw <= 0) continue;
      const branchId = branchKey === '__unassigned__' ? null : branchKey;
      lines.push({
        accountId: compensationExpense.id,
        debitPsw: grossPayPsw,
        branchId,
        description: 'Payroll compensation expense',
        metadata: { payrollCycleId: cycle.id, payrollRunId: run.id },
      });
      lines.push({
        accountId: accruedExpenses.id,
        creditPsw: grossPayPsw,
        branchId,
        description: 'Payroll accrued liability',
        metadata: { payrollCycleId: cycle.id, payrollRunId: run.id },
      });
    }

    const posted = await postJournalEntrySvc(
      {
        companyId: cycle.companyId,
        sourceType: JournalSourceType.PAYROLL,
        sourceId: cycle.id,
        description: 'Payroll accrual posting',
        memo: cycle.name,
        recordedByUserId: run.approvedBy ?? postedBy,
        approvedByUserId: run.approvedBy ?? postedBy,
        postedBy,
        lines,
      },
      tx,
    );

    await updatePayrollRunRepo(
      run.id,
      {
        status: PayrollRunStatus.POSTED,
        journalBatchId: posted.batchId,
      },
      tx,
    );
    await updatePayrollCycleRepo(id, { status: PayrollPeriodStatus.POSTED }, tx);

    await recordAuditLog({
      companyId: cycle.companyId,
      actorUserId: postedBy,
      entityType: 'payroll_run',
      entityId: run.id,
      action: 'PAYROLL_JOURNALIZED',
      message: 'Payroll cycle journalized into accounting',
      metadata: {
        payrollCycleId: cycle.id,
        journalBatchId: posted.batchId,
        lineCount: lines.length,
      },
    });

    return { id: run.id, journalBatchId: posted.batchId };
  });
}

export async function reopenPayrollCycleSvc(id: string, reopenedBy: string) {
  const cycle = await getPayrollCycleRepo(id);
  if (!cycle) throw NotFound('Payroll cycle not found');

  const run = await findLatestPayrollRunRepo(id);
  if (!run) throw Conflict('Payroll cycle must be run before reopening');
  if (cycle.status === PayrollPeriodStatus.POSTED || run.journalBatchId) {
    throw Conflict('Reverse the payroll journal before reopening this cycle');
  }
  if (
    cycle.status !== PayrollPeriodStatus.APPROVED &&
    cycle.status !== PayrollPeriodStatus.PROCESSING
  ) {
    throw Conflict('Only processing or approved payroll cycles can be reopened');
  }

  await updatePayrollRunRepo(run.id, {
    status: PayrollRunStatus.COMPLETED,
    approvedBy: null,
    approvedAt: null,
    notes: 'Payroll cycle reopened',
  });
  await updatePayrollCycleRepo(id, { status: PayrollPeriodStatus.OPEN });

  await recordAuditLog({
    companyId: cycle.companyId,
    actorUserId: reopenedBy,
    entityType: 'payroll_run',
    entityId: run.id,
    action: 'PAYROLL_REOPENED',
    message: 'Payroll cycle reopened',
    metadata: { payrollCycleId: cycle.id },
  });

  return { id: run.id };
}

export async function reversePayrollCycleSvc(id: string, reversedBy: string) {
  const cycle = await getPayrollCycleRepo(id);
  if (!cycle) throw NotFound('Payroll cycle not found');

  await assertAccountingEnabledSvc(cycle.companyId);

  const run = await findLatestPayrollRunRepo(id);
  if (!run) throw Conflict('Payroll cycle must be run before reversal');
  if (!run.journalBatchId) throw Conflict('Payroll cycle has not been journalized');

  return db.transaction(async (tx) => {
    const journalLines = await listJournalLinesByBatchRepo(run.journalBatchId!, tx);
    if (!journalLines.length) {
      throw Conflict('Original payroll journal lines were not found');
    }

    const reversalLines: JournalLineInput[] = journalLines.map((line) => ({
      accountId: line.accountId,
      debitPsw: Number(line.creditPsw ?? 0),
      creditPsw: Number(line.debitPsw ?? 0),
      branchId: line.branchId ?? null,
      locationId: line.locationId ?? null,
      recordedByUserId: line.recordedByUserId ?? reversedBy,
      description: line.description ? `${line.description} reversal` : 'Payroll journal reversal',
      metadata: {
        ...(line.metadata && typeof line.metadata === 'object' ? line.metadata : {}),
        reversalOfBatchId: run.journalBatchId,
        payrollCycleId: cycle.id,
        payrollRunId: run.id,
      },
    }));

    const reversal = await postJournalEntrySvc(
      {
        companyId: cycle.companyId,
        sourceType: JournalSourceType.PAYROLL,
        sourceId: cycle.id,
        description: 'Payroll accrual reversal',
        memo: `${cycle.name} reversal`,
        recordedByUserId: reversedBy,
        approvedByUserId: reversedBy,
        postedBy: reversedBy,
        lines: reversalLines,
      },
      tx,
    );

    await updatePayrollRunRepo(
      run.id,
      {
        status: PayrollRunStatus.APPROVED,
        journalBatchId: null,
        notes: `Journal reversed by batch ${reversal.batchId}`,
      },
      tx,
    );
    await updatePayrollCycleRepo(id, { status: PayrollPeriodStatus.APPROVED }, tx);

    await recordAuditLog({
      companyId: cycle.companyId,
      actorUserId: reversedBy,
      entityType: 'payroll_run',
      entityId: run.id,
      action: 'PAYROLL_JOURNAL_REVERSED',
      message: 'Payroll journal reversal posted',
      metadata: {
        payrollCycleId: cycle.id,
        originalJournalBatchId: run.journalBatchId,
        reversalJournalBatchId: reversal.batchId,
      },
    });

    return { id: run.id, reversalJournalBatchId: reversal.batchId };
  });
}

export async function getPayrollBankExportSvc(payrollCycleId: string) {
  const cycle = await getPayrollCycleRepo(payrollCycleId);
  if (!cycle) throw NotFound('Payroll cycle not found');

  const run = await findLatestPayrollRunRepo(payrollCycleId);
  if (!run) throw Conflict('Payroll cycle must be run before export');

  const rows = await listBankExportRowsRepo(run.id);
  return {
    payrollCycleId: cycle.id,
    payrollCycleName: cycle.name,
    payrollRunId: run.id,
    rows,
  };
}

export async function getPayslipDetailSvc(payslipId: string) {
  const detail = await getPayslipDetailRepo(payslipId);
  if (!detail) throw NotFound('Payslip not found');
  return detail;
}

export async function listPayslipsSvc(input: {
  payrollCycleId: string;
  employeeId?: string | null;
  limit: number;
  offset: number;
}) {
  return listPayslipsByCycleRepo(input);
}
