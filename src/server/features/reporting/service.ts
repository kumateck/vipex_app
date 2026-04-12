import { BadRequest, NotFound } from '@/server/utils/http-error';
import { listJournalLinesForReportingRepo } from '@/server/features/accounting/repository';
import {
  AccountClass,
  CashierType,
  CustomerCreditSourceType,
  PaymentMethod,
} from '@/db/schemas/enums';
import type { CreditExposureReportRow } from './repository';
import {
  findLatestPayrollRunRepo,
  getPayrollCycleWithGroupRepo,
  listPayrollRunEmployeeSummariesRepo,
} from '../payroll/repository';
import {
  categorizeShiftRevenueMethod,
  listCustomerCreditAgingDetailReportRowsRepo,
  listAttendanceReportRowsRepo,
  listCashierSessionsForDayRepo,
  listCreditExposureReportRowsRepo,
  listDailyCashierSalesSessionsRepo,
  listDailyCashierSalesTransactionsRepo,
  listDailyCashConfirmationReportRowsRepo,
  listEmployeeMasterReportRowsRepo,
  listExpenseByCategoryDetailRowsRepo,
  listExpenseByCategorySummaryRowsRepo,
  getJournalBatchReportMetaRepo,
  listLeaveRequestReportRowsRepo,
  listDeliveryPerformanceReportRowsRepo,
  listJournalLinesForBatchDetailedRepo,
  listParcelStatusReportRowsRepo,
  listPayrollAdjustmentReportRowsRepo,
  listPayrollOvertimeReportRowsRepo,
  listPayrollRegisterRowsRepo,
  listShiftRevenueSessionsRepo,
  listShiftRevenueTransactionRowsRepo,
  listSessionTransactionsRepo,
  listStorageWaiverFinancialReportRowsRepo,
  listToBePaidCollectionsReconciliationReportRowsRepo,
  listToBePaidOutstandingReportRowsRepo,
} from './repository';

function parseDateInput(value: string, endOfDay = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw BadRequest('Invalid date');
  }

  if (value.length <= 10) {
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
  }

  return date;
}

export async function getCashierDaySessionsReportSvc(input: {
  companyId: string;
  cashierId: string;
  date: string;
  branchId?: string | null;
  includeTransactions?: boolean;
}) {
  const reportDate = parseDateInput(input.date);

  const sessions = await listCashierSessionsForDayRepo({
    companyId: input.companyId,
    cashierId: input.cashierId,
    date: reportDate,
    branchId: input.branchId ?? null,
  });

  const sessionIds = sessions.map((session) => session.id);
  const transactions =
    sessionIds.length && input.includeTransactions !== false
      ? await listSessionTransactionsRepo(sessionIds)
      : [];

  const transactionsBySession = new Map<string, typeof transactions>();
  for (const transaction of transactions) {
    if (!transaction.sessionId) continue;
    const current = transactionsBySession.get(transaction.sessionId) ?? [];
    current.push(transaction);
    transactionsBySession.set(transaction.sessionId, current);
  }

  return {
    cashierId: input.cashierId,
    date: input.date,
    sessions: sessions.map((session) => {
      const sessionTransactions = transactionsBySession.get(session.id) ?? [];
      const totalGrossPsw = sessionTransactions.reduce((sum, tx) => sum + tx.grossAmountPsw, 0);
      const totalNetPsw = sessionTransactions.reduce((sum, tx) => sum + tx.netAmountPsw, 0);
      const totalTaxPsw = sessionTransactions.reduce((sum, tx) => sum + tx.taxTotalPsw, 0);

      return {
        id: session.id,
        cashierId: session.cashierId,
        branchId: session.branchId,
        scheduledStartTime: session.scheduledStartTime.toISOString(),
        actualEndTime: session.actualEndTime ? session.actualEndTime.toISOString() : null,
        openingBalancePsw: session.openingBalancePsw,
        closingBalancePsw: session.closingBalancePsw,
        status: session.status,
        transactionCount: sessionTransactions.length,
        totalGrossPsw,
        totalNetPsw,
        totalTaxPsw,
        transactions: sessionTransactions.map((tx) => ({
          paymentId: tx.paymentId,
          parcelId: tx.parcelId,
          trackingCode: tx.trackingCode,
          method: tx.method,
          component: tx.component,
          payer: tx.payer,
          cashierType: tx.cashierType,
          grossAmountPsw: tx.grossAmountPsw,
          netAmountPsw: tx.netAmountPsw,
          taxTotalPsw: tx.taxTotalPsw,
          receivedAt: tx.receivedAt.toISOString(),
          receiptNo: tx.receiptNo,
        })),
      };
    }),
  };
}

export async function getDailyCashierSalesReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  viewerUserId: string;
  canSelectCashier: boolean;
  date: string;
  requestedBranchId?: string | null;
  locationId?: string | null;
  cashierUserId?: string | null;
  cashierType?: number | null;
}) {
  const reportDate = parseDateInput(input.date);
  const effectiveCashierUserId = input.canSelectCashier
    ? (input.cashierUserId ?? null)
    : input.viewerUserId;

  const sessions = await listDailyCashierSalesSessionsRepo({
    companyId: input.companyId,
    date: reportDate,
    branchId: input.branchId ?? null,
    locationId: input.locationId ?? null,
  });

  const scopedSessions = effectiveCashierUserId
    ? sessions.filter((session) => session.cashierId === effectiveCashierUserId)
    : sessions;

  const sessionIds = scopedSessions.map((session) => session.id);
  const transactions = await listDailyCashierSalesTransactionsRepo({
    sessionIds,
    cashierType: input.cashierType ?? null,
  });

  const sessionById = new Map(scopedSessions.map((session) => [session.id, session]));
  const transactionsBySessionId = new Map<string, typeof transactions>();
  for (const transaction of transactions) {
    if (!transaction.sessionId) continue;
    const current = transactionsBySessionId.get(transaction.sessionId) ?? [];
    current.push(transaction);
    transactionsBySessionId.set(transaction.sessionId, current);
  }

  const sessionRows = scopedSessions
    .map((session) => {
      const sessionTransactions = transactionsBySessionId.get(session.id) ?? [];
      const totals = {
        transactionCount: sessionTransactions.length,
        grossPsw: 0,
        netPsw: 0,
        taxPsw: 0,
        cashPsw: 0,
        mtnPsw: 0,
        telecelPsw: 0,
        airtelPsw: 0,
        creditPsw: 0,
      };

      for (const transaction of sessionTransactions) {
        totals.grossPsw += Number(transaction.grossAmountPsw ?? 0);
        totals.netPsw += Number(transaction.netAmountPsw ?? 0);
        totals.taxPsw += Number(transaction.taxTotalPsw ?? 0);
        if (transaction.method === PaymentMethod.CASH)
          totals.cashPsw += Number(transaction.grossAmountPsw ?? 0);
        if (transaction.method === PaymentMethod.MTN)
          totals.mtnPsw += Number(transaction.grossAmountPsw ?? 0);
        if (transaction.method === PaymentMethod.TELECEL)
          totals.telecelPsw += Number(transaction.grossAmountPsw ?? 0);
        if (transaction.method === PaymentMethod.AIRTEL)
          totals.airtelPsw += Number(transaction.grossAmountPsw ?? 0);
        if (transaction.method === PaymentMethod.CREDIT)
          totals.creditPsw += Number(transaction.grossAmountPsw ?? 0);
      }

      return {
        id: session.id,
        cashierId: session.cashierId,
        cashierName: session.cashierName,
        branchId: session.branchId,
        branchName: session.branchName,
        locationId: session.locationId,
        locationName: session.locationName,
        scheduledStartTime: session.scheduledStartTime.toISOString(),
        scheduledEndTime: session.scheduledEndTime.toISOString(),
        actualStartTime: session.actualStartTime?.toISOString() ?? null,
        actualEndTime: session.actualEndTime?.toISOString() ?? null,
        status: session.status,
        openingBalancePsw: Number(session.openingBalancePsw ?? 0),
        closingBalancePsw:
          session.closingBalancePsw !== null && session.closingBalancePsw !== undefined
            ? Number(session.closingBalancePsw)
            : null,
        totals,
      };
    })
    .filter((session) => session.totals.transactionCount > 0);

  const transactionRows = transactions
    .map((transaction) => {
      const session = transaction.sessionId ? sessionById.get(transaction.sessionId) : null;
      return {
        paymentId: transaction.paymentId,
        sessionId: transaction.sessionId,
        parcelId: transaction.parcelId,
        bookingCode: transaction.bookingCode,
        trackingCode: transaction.trackingCode,
        cashierId: session?.cashierId ?? null,
        cashierName: session?.cashierName ?? '-',
        branchId: session?.branchId ?? null,
        branchName: session?.branchName ?? '-',
        locationId: session?.locationId ?? null,
        locationName: session?.locationName ?? null,
        cashierType: transaction.cashierType,
        method: transaction.method,
        component: transaction.component,
        payer: transaction.payer,
        grossAmountPsw: Number(transaction.grossAmountPsw ?? 0),
        netAmountPsw: Number(transaction.netAmountPsw ?? 0),
        taxTotalPsw: Number(transaction.taxTotalPsw ?? 0),
        receivedAt: transaction.receivedAt.toISOString(),
        receiptNo: transaction.receiptNo,
      };
    })
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));

  const totals = {
    sessions: sessionRows.length,
    transactions: transactionRows.length,
    grossPsw: 0,
    netPsw: 0,
    taxPsw: 0,
  };

  const paymentModeTotals = {
    cashPsw: 0,
    mtnPsw: 0,
    telecelPsw: 0,
    airtelPsw: 0,
    creditPsw: 0,
  };

  const cashierTypeTotals = {
    senderPsw: 0,
    receiverPsw: 0,
    deliveryPsw: 0,
  };

  for (const row of transactionRows) {
    totals.grossPsw += row.grossAmountPsw;
    totals.netPsw += row.netAmountPsw;
    totals.taxPsw += row.taxTotalPsw;

    if (row.method === PaymentMethod.CASH) paymentModeTotals.cashPsw += row.grossAmountPsw;
    if (row.method === PaymentMethod.MTN) paymentModeTotals.mtnPsw += row.grossAmountPsw;
    if (row.method === PaymentMethod.TELECEL) paymentModeTotals.telecelPsw += row.grossAmountPsw;
    if (row.method === PaymentMethod.AIRTEL) paymentModeTotals.airtelPsw += row.grossAmountPsw;
    if (row.method === PaymentMethod.CREDIT) paymentModeTotals.creditPsw += row.grossAmountPsw;

    if (row.cashierType === CashierType.SENDING) cashierTypeTotals.senderPsw += row.grossAmountPsw;
    if (row.cashierType === CashierType.TOBEPAID)
      cashierTypeTotals.receiverPsw += row.grossAmountPsw;
    if (row.cashierType === CashierType.DELIVERY)
      cashierTypeTotals.deliveryPsw += row.grossAmountPsw;
  }

  return {
    filters: {
      date: input.date,
      branchId: input.branchId ?? null,
      requestedBranchId: input.requestedBranchId ?? null,
      locationId: input.locationId ?? null,
      cashierUserId: effectiveCashierUserId,
      cashierType: input.cashierType ?? null,
    },
    generatedAt: new Date().toISOString(),
    totals,
    paymentModeTotals,
    cashierTypeTotals,
    sessions: sessionRows,
    transactions: transactionRows,
  };
}

export async function getEmployeeMasterReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: number | null;
  search?: string | null;
}) {
  const rows = await listEmployeeMasterReportRowsRepo(input);

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    totals: {
      employees: rows.length,
      activeEmployees: rows.filter((row) => row.employmentStatus === 0).length,
      withUserAccounts: rows.filter((row) => row.hasUserAccount).length,
    },
    rows: rows.map((row) => ({
      ...row,
      hireDate: row.hireDate?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
  };
}

export async function getAttendanceReportSvc(input: {
  companyId: string;
  from: string;
  to: string;
  employeeId?: string | null;
  branchId?: string | null;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listAttendanceReportRowsRepo({
    companyId: input.companyId,
    from,
    to,
    employeeId: input.employeeId ?? null,
    branchId: input.branchId ?? null,
  });

  return {
    filters: { ...input, from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    totals: {
      records: rows.length,
      workedMinutes: rows.reduce((sum, row) => sum + Number(row.minutesWorked ?? 0), 0),
      checkedIn: rows.filter((row) => row.checkInAt).length,
      checkedOut: rows.filter((row) => row.checkOutAt).length,
    },
    rows: rows.map((row) => ({
      ...row,
      attendanceDate: row.attendanceDate.toISOString(),
      checkInAt: row.checkInAt?.toISOString() ?? null,
      checkOutAt: row.checkOutAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
  };
}

export async function getLeaveRequestsReportSvc(input: {
  companyId: string;
  from: string;
  to: string;
  employeeId?: string | null;
  status?: number | null;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listLeaveRequestReportRowsRepo({
    companyId: input.companyId,
    from,
    to,
    employeeId: input.employeeId ?? null,
    status: input.status ?? null,
  });

  return {
    filters: { ...input, from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    totals: {
      requests: rows.length,
      daysRequested: rows.reduce((sum, row) => sum + Number(row.daysCount ?? 0), 0),
      approved: rows.filter((row) => row.status === 1).length,
      pending: rows.filter((row) => row.status === 0).length,
    },
    rows: rows.map((row) => ({
      ...row,
      dateFrom: row.dateFrom.toISOString(),
      dateTo: row.dateTo.toISOString(),
      approvedAt: row.approvedAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
  };
}

export async function getDailyCashConfirmationReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
  status?: number | null;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listDailyCashConfirmationReportRowsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    from,
    to,
    status: input.status ?? null,
  });

  return {
    filters: { ...input, from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    totals: {
      confirmations: rows.length,
      expectedCashPsw: rows.reduce((sum, row) => sum + row.expectedCashPsw, 0),
      countedCashPsw: rows.reduce((sum, row) => sum + row.countedCashPsw, 0),
      shortagePsw: rows.reduce((sum, row) => sum + row.shortagePsw, 0),
      overagePsw: rows.reduce((sum, row) => sum + row.overagePsw, 0),
      confirmed: rows.filter((row) => row.status >= 1).length,
      posted: rows.filter((row) => row.status === 2).length,
    },
    rows: rows.map((row) => ({
      ...row,
      confirmationDate: row.confirmationDate.toISOString(),
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      postedAt: row.postedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getExpenseByCategoryReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
  status?: number | null;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const [summaryRows, detailRows] = await Promise.all([
    listExpenseByCategorySummaryRowsRepo({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      from,
      to,
      status: input.status ?? null,
    }),
    listExpenseByCategoryDetailRowsRepo({
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      from,
      to,
      status: input.status ?? null,
    }),
  ]);

  return {
    filters: { ...input, from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    totals: {
      categories: summaryRows.length,
      requests: detailRows.length,
      totalAmountPsw: detailRows.reduce((sum, row) => sum + row.amountPsw, 0),
      approvedPsw: detailRows
        .filter((row) => row.status === 2)
        .reduce((sum, row) => sum + row.amountPsw, 0),
      paidPsw: detailRows
        .filter((row) => row.status === 4)
        .reduce((sum, row) => sum + row.amountPsw, 0),
      postedPsw: detailRows
        .filter((row) => row.status === 5)
        .reduce((sum, row) => sum + row.amountPsw, 0),
    },
    summaryRows,
    detailRows: detailRows.map((row) => ({
      ...row,
      paidAt: row.paidAt?.toISOString() ?? null,
      postedAt: row.postedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getDeliveryPerformanceReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  riderUserId?: string | null;
  from: string;
  to: string;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listDeliveryPerformanceReportRowsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    riderUserId: input.riderUserId ?? null,
    from,
    to,
  });

  const countsByStatus = new Map<string, number>();
  for (const row of rows) {
    countsByStatus.set(row.deliveryStatus, (countsByStatus.get(row.deliveryStatus) ?? 0) + 1);
  }

  return {
    filters: { ...input, from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    totals: {
      deliveries: rows.length,
      delivered: rows.filter((row) => row.deliveryStatus === 'DELIVERED').length,
      returnedToOffice: rows.filter((row) => row.deliveryStatus === 'RETURNED_TO_OFFICE').length,
      outForDelivery: rows.filter((row) => row.deliveryStatus === 'OUT_FOR_DELIVERY').length,
      deliveryFeesPsw: rows.reduce((sum, row) => sum + Number(row.deliveryFeePsw ?? 0), 0),
      amountPaidPsw: rows.reduce((sum, row) => sum + Number(row.amountPaidPsw ?? 0), 0),
    },
    statusSummary: Array.from(countsByStatus.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status)),
    rows: rows.map((row) => ({
      ...row,
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

export async function getPayrollJournalReconciliationReportSvc(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const cycle = await getPayrollCycleWithGroupRepo(input.payrollCycleId);
  if (!cycle || cycle.companyId !== input.companyId) {
    throw NotFound('Payroll cycle not found');
  }

  const run = await findLatestPayrollRunRepo(input.payrollCycleId);
  if (!run) {
    throw NotFound('Payroll run not found');
  }

  const payrollRows = await listPayrollRunEmployeeSummariesRepo(run.id);
  const payrollTotals = {
    employees: payrollRows.length,
    grossPayPsw: payrollRows.reduce((sum, row) => sum + Number(row.grossPayPsw ?? 0), 0),
    totalDeductionsPsw: payrollRows.reduce(
      (sum, row) => sum + Number(row.totalDeductionsPsw ?? 0),
      0,
    ),
    netPayPsw: payrollRows.reduce((sum, row) => sum + Number(row.netPayPsw ?? 0), 0),
  };

  const journalBatch = run.journalBatchId
    ? await getJournalBatchReportMetaRepo(run.journalBatchId)
    : null;
  const journalLines = run.journalBatchId
    ? await listJournalLinesForBatchDetailedRepo(run.journalBatchId)
    : [];

  const journalTotals = {
    lines: journalLines.length,
    debitPsw: journalLines.reduce((sum, row) => sum + Number(row.debitPsw ?? 0), 0),
    creditPsw: journalLines.reduce((sum, row) => sum + Number(row.creditPsw ?? 0), 0),
  };

  const accountSummaryMap = new Map<
    string,
    {
      accountCode: string;
      accountName: string;
      debitPsw: number;
      creditPsw: number;
    }
  >();

  for (const line of journalLines) {
    const current = accountSummaryMap.get(line.accountId) ?? {
      accountCode: line.accountCode,
      accountName: line.accountName,
      debitPsw: 0,
      creditPsw: 0,
    };
    current.debitPsw += Number(line.debitPsw ?? 0);
    current.creditPsw += Number(line.creditPsw ?? 0);
    accountSummaryMap.set(line.accountId, current);
  }

  const accountSummary = [...accountSummaryMap.values()].sort((a, b) =>
    a.accountCode.localeCompare(b.accountCode),
  );

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    payrollCycle: {
      id: cycle.id,
      name: cycle.name,
      payrollGroupName: cycle.payrollGroupName,
      periodStart: cycle.periodStart?.toISOString() ?? null,
      periodEnd: cycle.periodEnd?.toISOString() ?? null,
      paymentDate: cycle.paymentDate?.toISOString() ?? null,
      status: cycle.status,
      currencyCode: cycle.currencyCode,
    },
    payrollRun: {
      id: run.id,
      status: run.status,
      approvedBy: run.approvedBy ?? null,
      approvedAt: run.approvedAt?.toISOString() ?? null,
      journalBatchId: run.journalBatchId ?? null,
    },
    journalBatch: journalBatch
      ? {
          id: journalBatch.id,
          sourceType: journalBatch.sourceType,
          sourceId: journalBatch.sourceId ?? null,
          batchDate: journalBatch.batchDate.toISOString(),
          description: journalBatch.description ?? null,
          postedAt: journalBatch.postedAt?.toISOString() ?? null,
          postedBy: journalBatch.postedBy ?? null,
          postedByName: journalBatch.postedByName ?? null,
        }
      : null,
    totals: {
      payrollEmployees: payrollTotals.employees,
      payrollGrossPayPsw: payrollTotals.grossPayPsw,
      payrollDeductionsPsw: payrollTotals.totalDeductionsPsw,
      payrollNetPayPsw: payrollTotals.netPayPsw,
      journalLines: journalTotals.lines,
      journalDebitPsw: journalTotals.debitPsw,
      journalCreditPsw: journalTotals.creditPsw,
      grossVsJournalDebitDifferencePsw: payrollTotals.grossPayPsw - journalTotals.debitPsw,
      journalBalanced: journalTotals.debitPsw === journalTotals.creditPsw,
      matchedToGrossPay: payrollTotals.grossPayPsw === journalTotals.debitPsw,
    },
    accountSummary,
    journalLines: journalLines.map((row) => ({
      ...row,
      entryDate: row.entryDate.toISOString(),
    })),
  };
}

export async function getPayrollRegisterReportSvc(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const payrollCycle = await getPayrollCycleWithGroupRepo(input.payrollCycleId);
  if (!payrollCycle || payrollCycle.companyId !== input.companyId) {
    throw NotFound('Payroll cycle not found');
  }

  const latestRun = await findLatestPayrollRunRepo(input.payrollCycleId);
  if (!latestRun) {
    throw NotFound('No payroll run found for the selected cycle');
  }

  const rows = await listPayrollRegisterRowsRepo({ payrollRunId: latestRun.id });

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    payrollCycle: {
      id: payrollCycle.id,
      name: payrollCycle.name,
      periodStart: payrollCycle.periodStart?.toISOString() ?? null,
      periodEnd: payrollCycle.periodEnd?.toISOString() ?? null,
      paymentDate: payrollCycle.paymentDate?.toISOString() ?? null,
      status: payrollCycle.status,
    },
    payrollRun: {
      id: latestRun.id,
      status: latestRun.status,
      approvedAt: latestRun.approvedAt?.toISOString() ?? null,
      createdAt: null,
    },
    totals: {
      employees: rows.length,
      basePayPsw: rows.reduce((sum, row) => sum + Number(row.basePayPsw ?? 0), 0),
      grossPayPsw: rows.reduce((sum, row) => sum + Number(row.grossPayPsw ?? 0), 0),
      totalDeductionsPsw: rows.reduce((sum, row) => sum + Number(row.totalDeductionsPsw ?? 0), 0),
      netPayPsw: rows.reduce((sum, row) => sum + Number(row.netPayPsw ?? 0), 0),
    },
    rows,
  };
}

export async function getPayrollOvertimeReportSvc(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const payrollCycle = await getPayrollCycleWithGroupRepo(input.payrollCycleId);
  if (!payrollCycle || payrollCycle.companyId !== input.companyId) {
    throw NotFound('Payroll cycle not found');
  }

  const rows = await listPayrollOvertimeReportRowsRepo(input);
  const totalAmountPsw = rows.reduce((sum, row) => {
    const hours = Number(row.overtimeMinutes ?? 0) / 60;
    const multiplier = Number(row.multiplierPct ?? 100) / 100;
    return sum + Math.round(hours * Number(row.ratePerHourPsw ?? 0) * multiplier);
  }, 0);

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    payrollCycle: {
      id: payrollCycle.id,
      name: payrollCycle.name,
      periodStart: payrollCycle.periodStart?.toISOString() ?? null,
      periodEnd: payrollCycle.periodEnd?.toISOString() ?? null,
      paymentDate: payrollCycle.paymentDate?.toISOString() ?? null,
      status: payrollCycle.status,
    },
    totals: {
      rows: rows.length,
      overtimeMinutes: rows.reduce((sum, row) => sum + Number(row.overtimeMinutes ?? 0), 0),
      estimatedAmountPsw: totalAmountPsw,
    },
    rows: rows.map((row) => ({
      ...row,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
  };
}

export async function getPayrollAdjustmentsReportSvc(input: {
  companyId: string;
  payrollCycleId: string;
}) {
  const payrollCycle = await getPayrollCycleWithGroupRepo(input.payrollCycleId);
  if (!payrollCycle || payrollCycle.companyId !== input.companyId) {
    throw NotFound('Payroll cycle not found');
  }

  const rows = await listPayrollAdjustmentReportRowsRepo(input);

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    payrollCycle: {
      id: payrollCycle.id,
      name: payrollCycle.name,
      periodStart: payrollCycle.periodStart?.toISOString() ?? null,
      periodEnd: payrollCycle.periodEnd?.toISOString() ?? null,
      paymentDate: payrollCycle.paymentDate?.toISOString() ?? null,
      status: payrollCycle.status,
    },
    totals: {
      rows: rows.length,
      earningsPsw: rows
        .filter((row) => row.itemType === 0)
        .reduce((sum, row) => sum + Number(row.amountPsw ?? 0), 0),
      deductionsPsw: rows
        .filter((row) => row.itemType === 1)
        .reduce((sum, row) => sum + Number(row.amountPsw ?? 0), 0),
    },
    rows: rows.map((row) => ({
      ...row,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? null,
    })),
  };
}

export async function getParcelStatusSummaryReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const from = input.from ? parseDateInput(input.from) : null;
  const to = input.to ? parseDateInput(input.to, true) : null;
  if (from && to && to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listParcelStatusReportRowsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    from,
    to,
  });

  const countsByStatus = new Map<number, number>();
  for (const row of rows) {
    countsByStatus.set(row.status, (countsByStatus.get(row.status) ?? 0) + 1);
  }

  return {
    filters: {
      ...input,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    generatedAt: new Date().toISOString(),
    totals: {
      parcels: rows.length,
      chargePsw: rows.reduce((sum, row) => sum + Number(row.chargePsw ?? 0), 0),
      toBePaidPsw: rows.reduce((sum, row) => sum + Number(row.plannedToBePaidPsw ?? 0), 0),
    },
    summary: Array.from(countsByStatus.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status - b.status),
    rows: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt?.toISOString() ?? null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
    })),
  };
}

export async function getStorageWaiverFinancialReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) throw BadRequest('Invalid date range');

  const rows = await listStorageWaiverFinancialReportRowsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    from,
    to,
  });

  return {
    filters: {
      ...input,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    totals: {
      waivers: rows.length,
      waivedAmountPsw: rows.reduce((sum, row) => sum + Number(row.waivedAmountPsw ?? 0), 0),
      postedCount: rows.filter((row) => Boolean(row.accountingJournalEntryId)).length,
    },
    rows: rows.map((row) => ({
      ...row,
      waivedAt: row.waivedAt.toISOString(),
      accountingPostedAt: row.accountingPostedAt?.toISOString() ?? null,
    })),
  };
}

export async function getShiftRevenueReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  shiftSessionId?: string | null;
  from: string;
  to: string;
}) {
  const from = parseDateInput(input.from);
  const to = parseDateInput(input.to, true);
  if (to < from) {
    throw BadRequest('Invalid date range');
  }

  const sessions = await listShiftRevenueSessionsRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    shiftSessionId: input.shiftSessionId ?? null,
    from,
    to,
  });
  const transactions = await listShiftRevenueTransactionRowsRepo(
    sessions.map((session) => session.id),
  );

  const transactionsBySessionId = new Map<string, typeof transactions>();
  for (const transaction of transactions) {
    if (!transaction.sessionId) continue;
    const current = transactionsBySessionId.get(transaction.sessionId) ?? [];
    current.push(transaction);
    transactionsBySessionId.set(transaction.sessionId, current);
  }

  const rows = sessions.map((session) => {
    const sessionTransactions = transactionsBySessionId.get(session.id) ?? [];
    let grossPsw = 0;
    let netPsw = 0;
    let taxPsw = 0;
    let cashPsw = 0;
    let mobileMoneyPsw = 0;
    let creditPsw = 0;

    for (const transaction of sessionTransactions) {
      grossPsw += Number(transaction.grossAmountPsw ?? 0);
      netPsw += Number(transaction.netAmountPsw ?? 0);
      taxPsw += Number(transaction.taxTotalPsw ?? 0);
      const bucket = categorizeShiftRevenueMethod(
        transaction.method,
        Number(transaction.netAmountPsw ?? 0),
      );
      cashPsw += bucket.cashPsw;
      mobileMoneyPsw += bucket.mobileMoneyPsw;
      creditPsw += bucket.creditPsw;
    }

    return {
      ...session,
      scheduledStartTime: session.scheduledStartTime.toISOString(),
      scheduledEndTime: session.scheduledEndTime.toISOString(),
      actualStartTime: session.actualStartTime?.toISOString() ?? null,
      actualEndTime: session.actualEndTime?.toISOString() ?? null,
      openingBalancePsw: Number(session.openingBalancePsw ?? 0),
      closingBalancePsw: Number(session.closingBalancePsw ?? 0),
      transactionCount: sessionTransactions.length,
      grossPsw,
      netPsw,
      taxPsw,
      cashPsw,
      mobileMoneyPsw,
      creditPsw,
    };
  });

  return {
    filters: {
      ...input,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    totals: {
      sessions: rows.length,
      transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      grossPsw: rows.reduce((sum, row) => sum + row.grossPsw, 0),
      netPsw: rows.reduce((sum, row) => sum + row.netPsw, 0),
      taxPsw: rows.reduce((sum, row) => sum + row.taxPsw, 0),
      cashPsw: rows.reduce((sum, row) => sum + row.cashPsw, 0),
      mobileMoneyPsw: rows.reduce((sum, row) => sum + row.mobileMoneyPsw, 0),
      creditPsw: rows.reduce((sum, row) => sum + row.creditPsw, 0),
    },
    rows,
  };
}

function computeAccountClassSignedBalance(
  accountClass: number,
  debitPsw: number,
  creditPsw: number,
) {
  if (accountClass === AccountClass.EXPENSE || accountClass === AccountClass.ASSET) {
    return debitPsw - creditPsw;
  }
  return creditPsw - debitPsw;
}

export async function getBranchProfitabilityReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  from: string;
  to: string;
}) {
  const dateFrom = parseDateInput(input.from);
  const dateTo = parseDateInput(input.to, true);
  if (dateTo < dateFrom) {
    throw BadRequest('Invalid date range');
  }

  const lines = await listJournalLinesForReportingRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    dateFrom,
    dateTo,
  });

  const byBranch = new Map<
    string,
    {
      branchId: string;
      branchName: string;
      incomePsw: number;
      expensePsw: number;
      netProfitPsw: number;
      lineCount: number;
    }
  >();

  for (const line of lines) {
    const branchId = line.branchId ?? 'unassigned';
    const branchName = line.branchName ?? 'Unassigned';
    const current = byBranch.get(branchId) ?? {
      branchId,
      branchName,
      incomePsw: 0,
      expensePsw: 0,
      netProfitPsw: 0,
      lineCount: 0,
    };

    const debitPsw = Number(line.debitPsw ?? 0);
    const creditPsw = Number(line.creditPsw ?? 0);

    if (line.accountClass === AccountClass.INCOME) {
      current.incomePsw += computeAccountClassSignedBalance(line.accountClass, debitPsw, creditPsw);
    } else if (line.accountClass === AccountClass.EXPENSE) {
      current.expensePsw += computeAccountClassSignedBalance(
        line.accountClass,
        debitPsw,
        creditPsw,
      );
    }

    current.lineCount += 1;
    byBranch.set(branchId, current);
  }

  const rows = [...byBranch.values()]
    .map((row) => ({
      ...row,
      incomePsw: Math.max(row.incomePsw, 0),
      expensePsw: Math.max(row.expensePsw, 0),
      netProfitPsw: Math.max(row.incomePsw, 0) - Math.max(row.expensePsw, 0),
    }))
    .sort((a, b) => a.branchName.localeCompare(b.branchName));

  return {
    filters: {
      ...input,
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
    },
    generatedAt: new Date().toISOString(),
    totals: {
      branches: rows.length,
      incomePsw: rows.reduce((sum, row) => sum + row.incomePsw, 0),
      expensePsw: rows.reduce((sum, row) => sum + row.expensePsw, 0),
      netProfitPsw: rows.reduce((sum, row) => sum + row.netProfitPsw, 0),
    },
    rows,
  };
}

function includeCreditExposureBucket(row: CreditExposureReportRow, agingBucket?: string | null) {
  if (!agingBucket) return true;
  switch (agingBucket) {
    case 'current':
      return row.bucketCurrentPsw > 0;
    case '1-30':
      return row.bucket1To30Psw > 0;
    case '31-60':
      return row.bucket31To60Psw > 0;
    case '61-90':
      return row.bucket61To90Psw > 0;
    case '91+':
      return row.bucket91PlusPsw > 0;
    default:
      throw BadRequest('Invalid aging bucket');
  }
}

export async function getCreditExposureReportSvc(input: {
  companyId: string;
  branchId?: string | null;
  agingBucket?: string | null;
}) {
  const rows = (await listCreditExposureReportRowsRepo({ companyId: input.companyId })).filter(
    (row) => includeCreditExposureBucket(row, input.agingBucket ?? null),
  );

  return {
    filters: input,
    generatedAt: new Date().toISOString(),
    totals: {
      customers: rows.length,
      outstandingPsw: rows.reduce((sum, row) => sum + row.outstandingPsw, 0),
      creditLimitPsw: rows.reduce((sum, row) => sum + row.creditLimitPsw, 0),
      currentPsw: rows.reduce((sum, row) => sum + row.bucketCurrentPsw, 0),
      bucket1To30Psw: rows.reduce((sum, row) => sum + row.bucket1To30Psw, 0),
      bucket31To60Psw: rows.reduce((sum, row) => sum + row.bucket31To60Psw, 0),
      bucket61To90Psw: rows.reduce((sum, row) => sum + row.bucket61To90Psw, 0),
      bucket91PlusPsw: rows.reduce((sum, row) => sum + row.bucket91PlusPsw, 0),
    },
    rows: rows.map((row) => ({
      ...row,
      oldestChargeAt: row.oldestChargeAt?.toISOString() ?? null,
    })),
  };
}

function formatCustomerCreditSourceType(sourceType: number) {
  switch (sourceType) {
    case CustomerCreditSourceType.PARCEL:
      return 'Parcel';
    case CustomerCreditSourceType.DELIVERY:
      return 'Delivery';
    case CustomerCreditSourceType.MANUAL:
      return 'Manual';
    default:
      return 'Other';
  }
}

export async function getCustomerCreditAgingDetailReportSvc(input: {
  companyId: string;
  customerId?: string | null;
  agingBucket?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const from = input.from ? parseDateInput(input.from) : null;
  const to = input.to ? parseDateInput(input.to, true) : null;
  if (from && to && to < from) {
    throw BadRequest('Invalid date range');
  }
  if (input.agingBucket) {
    includeCreditExposureBucket(
      {
        customerId: '',
        customerName: '',
        telephone: null,
        creditLimitPsw: 0,
        outstandingPsw: 0,
        oldestChargeAt: null,
        bucketCurrentPsw: input.agingBucket === 'current' ? 1 : 0,
        bucket1To30Psw: input.agingBucket === '1-30' ? 1 : 0,
        bucket31To60Psw: input.agingBucket === '31-60' ? 1 : 0,
        bucket61To90Psw: input.agingBucket === '61-90' ? 1 : 0,
        bucket91PlusPsw: input.agingBucket === '91+' ? 1 : 0,
      },
      input.agingBucket,
    );
  }

  const rows = await listCustomerCreditAgingDetailReportRowsRepo({
    companyId: input.companyId,
    customerId: input.customerId ?? null,
    agingBucket: input.agingBucket ?? null,
    from,
    to,
  });

  return {
    filters: {
      ...input,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    generatedAt: new Date().toISOString(),
    totals: {
      items: rows.length,
      customers: new Set(rows.map((row) => row.customerId)).size,
      chargeAmountPsw: rows.reduce((sum, row) => sum + row.chargeAmountPsw, 0),
      allocatedAmountPsw: rows.reduce((sum, row) => sum + row.allocatedAmountPsw, 0),
      outstandingAmountPsw: rows.reduce((sum, row) => sum + row.outstandingAmountPsw, 0),
    },
    rows: rows.map((row) => ({
      ...row,
      sourceLabel: formatCustomerCreditSourceType(row.sourceType),
      chargeCreatedAt: row.chargeCreatedAt.toISOString(),
    })),
  };
}

export async function getOutstandingToBePaidReportSvc(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const from = input.from ? parseDateInput(input.from) : null;
  const to = input.to ? parseDateInput(input.to, true) : null;
  if (from && to && to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listToBePaidOutstandingReportRowsRepo({
    companyId: input.companyId,
    sourceBranchId: input.sourceBranchId ?? null,
    destinationBranchId: input.destinationBranchId ?? null,
    from,
    to,
  });

  return {
    filters: {
      ...input,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    generatedAt: new Date().toISOString(),
    totals: {
      parcels: rows.length,
      plannedToBePaidPsw: rows.reduce((sum, row) => sum + row.plannedToBePaidPsw, 0),
      paidPrincipalPsw: rows.reduce((sum, row) => sum + row.paidPrincipalPsw, 0),
      outstandingPsw: rows.reduce((sum, row) => sum + row.outstandingPsw, 0),
    },
    rows: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getToBePaidCollectionsReconciliationReportSvc(input: {
  companyId: string;
  sourceBranchId?: string | null;
  destinationBranchId?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const from = input.from ? parseDateInput(input.from) : null;
  const to = input.to ? parseDateInput(input.to, true) : null;
  if (from && to && to < from) {
    throw BadRequest('Invalid date range');
  }

  const rows = await listToBePaidCollectionsReconciliationReportRowsRepo({
    companyId: input.companyId,
    sourceBranchId: input.sourceBranchId ?? null,
    destinationBranchId: input.destinationBranchId ?? null,
    from,
    to,
  });

  return {
    filters: {
      ...input,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    generatedAt: new Date().toISOString(),
    totals: {
      parcels: rows.length,
      plannedToBePaidPsw: rows.reduce((sum, row) => sum + row.plannedToBePaidPsw, 0),
      collectedPrincipalPsw: rows.reduce((sum, row) => sum + row.collectedPrincipalPsw, 0),
      creditedPrincipalPsw: rows.reduce((sum, row) => sum + row.creditedPrincipalPsw, 0),
      recognizedPrincipalPsw: rows.reduce((sum, row) => sum + row.recognizedPrincipalPsw, 0),
      outstandingPsw: rows.reduce((sum, row) => sum + row.outstandingPsw, 0),
      variancePsw: rows.reduce((sum, row) => sum + row.variancePsw, 0),
    },
    rows: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
