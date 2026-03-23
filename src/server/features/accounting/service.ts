import { db } from '@/db/config';
import {
  AccountClass,
  CashConfirmationStatus,
  ExpenseFundingSource,
  ExpenseRequestStatus,
  JournalSourceType,
  TaxFilingPeriodStatus,
  TaxFilingStatus,
} from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';
import {
  createDailyCashConfirmationRepo,
  createExpenseRequestRepo,
  createTaxFilingAuditLogRepo,
  createTaxFilingPeriodRepo,
  createTaxJournalItemRepo,
  getAccountByCodeRepo,
  getCompanyBankAccountRepo,
  getDailyCashConfirmationRepo,
  getDailyCashExpectedSummaryRepo,
  getDailyCashSessionSummaryRepo,
  getExpenseCategoryRepo,
  getExpenseRequestRepo,
  getPettyCashFundByBranchRepo,
  getTaxFilingPeriodRepo,
  getTaxJournalItemRepo,
  listAccountsRepo,
  listApprovalPoliciesRepo,
  listCompanyBankAccountsRepo,
  listDailyCashConfirmationsRepo,
  listExpenseCategoriesRepo,
  listExpenseRequestsRepo,
  listJournalLinesForReportingRepo,
  listTaxFilingPeriodsRepo,
  listTaxJournalItemsRepo,
  updateTaxFilingPeriodRepo,
  updateTaxJournalItemRepo,
  updateDailyCashConfirmationRepo,
  updateExpenseRequestRepo,
} from './repository';
import { type JournalLineInput, postJournalEntrySvc } from './posting.service';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function toPsw(value: number | string) {
  return Number(toPesewas(value));
}

async function requireAccountByCode(companyId: string, code: string, executor: DbExecutor = db) {
  const account = await getAccountByCodeRepo(companyId, code, executor);
  if (!account) throw NotFound(`Accounting account ${code} not found`);
  if (!account.active) throw Conflict(`Accounting account ${code} is inactive`);
  return account;
}

export async function listAccountsSvc(input: { companyId: string; active?: boolean | null }) {
  return listAccountsRepo(input);
}

export async function listExpenseCategoriesSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listExpenseCategoriesRepo(input);
}

export async function listApprovalPoliciesSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listApprovalPoliciesRepo(input);
}

export async function listCompanyBankAccountsSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listCompanyBankAccountsRepo(input);
}

export async function listDailyCashConfirmationsSvc(input: {
  companyId: string;
  branchId?: string | null;
}) {
  return listDailyCashConfirmationsRepo(input);
}

export async function getDailyCashExpectedSummarySvc(input: {
  companyId: string;
  branchId: string;
  confirmationDate: string;
  locationId?: string | null;
  cashierUserId?: string | null;
}) {
  const dateFrom = normalizeDate(input.confirmationDate, false);
  if (!dateFrom) throw BadRequest('Valid confirmation date is required');
  const dateToExclusive = new Date(dateFrom);
  dateToExclusive.setDate(dateToExclusive.getDate() + 1);

  const paymentSummary = await getDailyCashExpectedSummaryRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    locationId: input.locationId ?? null,
    cashierUserId: input.cashierUserId ?? null,
    dateFrom,
    dateToExclusive,
  });

  const sessionSummary = input.cashierUserId
    ? await getDailyCashSessionSummaryRepo({
        branchId: input.branchId,
        cashierUserId: input.cashierUserId,
        dateFrom,
        dateToExclusive,
      })
    : null;

  return {
    ...paymentSummary,
    session: sessionSummary
      ? {
          sessionId: sessionSummary.sessionId,
          status: sessionSummary.status,
          scheduledStartTime: sessionSummary.scheduledStartTime.toISOString(),
          actualEndTime: sessionSummary.actualEndTime
            ? sessionSummary.actualEndTime.toISOString()
            : null,
          openingBalancePsw: Number(sessionSummary.openingBalancePsw ?? 0),
          closingBalancePsw:
            sessionSummary.closingBalancePsw != null
              ? Number(sessionSummary.closingBalancePsw)
              : null,
          expectedClosingBalancePsw:
            sessionSummary.expectedClosingBalancePsw != null
              ? Number(sessionSummary.expectedClosingBalancePsw)
              : null,
          variancePsw: Number(sessionSummary.variancePsw ?? 0),
          totalTransactions: Number(sessionSummary.totalTransactions ?? 0),
          cashTransactions: Number(sessionSummary.cashTransactions ?? 0),
          mobileMoneyTransactions: Number(sessionSummary.mobileMoneyTransactions ?? 0),
          cardTransactions: Number(sessionSummary.cardTransactions ?? 0),
          customerCount: Number(sessionSummary.customerCount ?? 0),
          parcelsProcessed: Number(sessionSummary.parcelsProcessed ?? 0),
        }
      : null,
  };
}

function allocateRevenueSplit(input: {
  expectedCashPsw: number;
  principalCashSalesPsw: number;
  deliveryCashSalesPsw: number;
}) {
  const expected = Number(input.expectedCashPsw ?? 0);
  const principal = Number(input.principalCashSalesPsw ?? 0);
  const delivery = Number(input.deliveryCashSalesPsw ?? 0);
  const total = principal + delivery;

  if (expected <= 0) {
    return {
      principalRevenuePsw: 0,
      deliveryRevenuePsw: 0,
    };
  }

  if (total <= 0) {
    return {
      principalRevenuePsw: expected,
      deliveryRevenuePsw: 0,
    };
  }

  const principalRevenuePsw = Math.round((principal / total) * expected);
  const deliveryRevenuePsw = expected - principalRevenuePsw;

  return {
    principalRevenuePsw,
    deliveryRevenuePsw,
  };
}

export async function createDailyCashConfirmationSvc(input: {
  companyId: string;
  branchId: string;
  locationId?: string | null;
  cashierUserId?: string | null;
  accountantUserId?: string | null;
  confirmationDate: string;
  expectedCashCedis: number | string;
  countedCashCedis: number | string;
  notes?: string | null;
  createdBy: string;
}) {
  const expectedCashPsw = toPsw(input.expectedCashCedis);
  const countedCashPsw = toPsw(input.countedCashCedis);
  const difference = countedCashPsw - expectedCashPsw;
  const shortagePsw = difference < 0 ? Math.abs(difference) : 0;
  const overagePsw = difference > 0 ? difference : 0;

  const created = await createDailyCashConfirmationRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    locationId: input.locationId ?? null,
    cashierUserId: input.cashierUserId ?? null,
    accountantUserId: input.accountantUserId ?? null,
    confirmationDate: new Date(input.confirmationDate),
    expectedCashPsw,
    countedCashPsw,
    shortagePsw,
    overagePsw,
    notes: input.notes ?? null,
    status: CashConfirmationStatus.DRAFT,
    createdBy: input.createdBy,
  });

  if (!created) throw NotFound('Failed to create daily cash confirmation');
  return { id: created.id };
}

export async function confirmDailyCashConfirmationSvc(input: {
  id: string;
  accountantUserId: string;
}) {
  const row = await getDailyCashConfirmationRepo(input.id);
  if (!row) throw NotFound('Daily cash confirmation not found');
  if (row.status !== CashConfirmationStatus.DRAFT) {
    throw Conflict('Only draft daily cash confirmations can be confirmed');
  }

  const updated = await updateDailyCashConfirmationRepo(input.id, {
    status: CashConfirmationStatus.CONFIRMED,
    accountantUserId: input.accountantUserId,
    confirmedAt: new Date(),
  });
  if (!updated) throw NotFound('Daily cash confirmation not found');
  return { id: updated.id };
}

export async function postDailyCashConfirmationSvc(input: { id: string; postedBy: string }) {
  return db.transaction(async (tx) => {
    const row = await getDailyCashConfirmationRepo(input.id, tx);
    if (!row) throw NotFound('Daily cash confirmation not found');
    if (row.status !== CashConfirmationStatus.CONFIRMED) {
      throw Conflict('Only confirmed daily cash confirmations can be posted');
    }

    const branchCash = await requireAccountByCode(row.companyId, '1120', tx);
    const parcelRevenue = await requireAccountByCode(row.companyId, '4000', tx);
    const deliveryRevenue = await requireAccountByCode(row.companyId, '4010', tx);
    const shortageExpense = await requireAccountByCode(row.companyId, '5210', tx);
    const overageIncome = await requireAccountByCode(row.companyId, '4030', tx);

    const paymentSummary = await getDailyCashExpectedSummarySvc({
      companyId: row.companyId,
      branchId: row.branchId,
      confirmationDate: row.confirmationDate.toISOString(),
      locationId: row.locationId ?? null,
      cashierUserId: row.cashierUserId ?? null,
    });
    const revenueSplit = allocateRevenueSplit({
      expectedCashPsw: Number(row.expectedCashPsw),
      principalCashSalesPsw: paymentSummary.principalCashSalesPsw,
      deliveryCashSalesPsw: paymentSummary.deliveryCashSalesPsw,
    });

    const lines: JournalLineInput[] = [
      {
        accountId: branchCash.id,
        debitPsw: Number(row.countedCashPsw),
        description: 'Confirmed cash counted',
      },
    ];

    if (revenueSplit.principalRevenuePsw > 0) {
      lines.push({
        accountId: parcelRevenue.id,
        creditPsw: revenueSplit.principalRevenuePsw,
        description: 'Confirmed parcel revenue',
      });
    }

    if (revenueSplit.deliveryRevenuePsw > 0) {
      lines.push({
        accountId: deliveryRevenue.id,
        creditPsw: revenueSplit.deliveryRevenuePsw,
        description: 'Confirmed delivery revenue',
      });
    }

    if (Number(row.shortagePsw) > 0) {
      lines.push({
        accountId: shortageExpense.id,
        debitPsw: Number(row.shortagePsw),
        description: 'Cash shortage recognized during confirmation',
      });
    }

    if (Number(row.overagePsw) > 0) {
      lines.push({
        accountId: overageIncome.id,
        creditPsw: Number(row.overagePsw),
        description: 'Cash overage recognized during confirmation',
      });
    }

    const posted = await postJournalEntrySvc(
      {
        companyId: row.companyId,
        sourceType: JournalSourceType.DAILY_CASH_CONFIRMATION,
        sourceId: row.id,
        description: 'Daily cash confirmation posting',
        memo: row.notes ?? 'Daily cash confirmation',
        branchId: row.branchId,
        locationId: row.locationId,
        recordedByUserId: row.createdBy,
        approvedByUserId: row.accountantUserId,
        postedBy: input.postedBy,
        lines,
      },
      tx,
    );

    const updated = await updateDailyCashConfirmationRepo(
      row.id,
      {
        status: CashConfirmationStatus.POSTED,
        journalEntryId: posted.entryId,
        postedAt: new Date(),
      },
      tx,
    );
    if (!updated) throw NotFound('Daily cash confirmation not found');
    return { id: updated.id, journalEntryId: posted.entryId };
  });
}

export async function listExpenseRequestsSvc(input: {
  companyId: string;
  branchId?: string | null;
}) {
  return listExpenseRequestsRepo(input);
}

export async function createExpenseRequestSvc(input: {
  companyId: string;
  branchId: string;
  locationId?: string | null;
  expenseCategoryId: string;
  amountCedis: number | string;
  fundingSource: ExpenseFundingSource;
  purpose: string;
  referenceNo?: string | null;
  requestedByUserId: string;
  recordedByUserId: string;
}) {
  const category = await getExpenseCategoryRepo(input.companyId, input.expenseCategoryId);
  if (!category) throw NotFound('Expense category not found');
  if (!category.active) throw Conflict('Expense category is inactive');

  const amountPsw = toPsw(input.amountCedis);
  if (amountPsw <= 0) throw BadRequest('Expense amount must be greater than zero');

  const created = await createExpenseRequestRepo({
    companyId: input.companyId,
    branchId: input.branchId,
    locationId: input.locationId ?? null,
    expenseCategoryId: input.expenseCategoryId,
    amountPsw,
    fundingSource: input.fundingSource,
    status: ExpenseRequestStatus.RECORDED,
    purpose: input.purpose.trim(),
    referenceNo: input.referenceNo?.trim() || null,
    requestedByUserId: input.requestedByUserId,
    recordedByUserId: input.recordedByUserId,
  });

  if (!created) throw NotFound('Failed to create expense request');
  return { id: created.id };
}

export async function submitExpenseRequestSvc(input: { id: string }) {
  const row = await getExpenseRequestRepo(input.id);
  if (!row) throw NotFound('Expense request not found');
  if (row.status !== ExpenseRequestStatus.RECORDED) {
    throw Conflict('Only recorded expense requests can be submitted');
  }
  const updated = await updateExpenseRequestRepo(input.id, {
    status: ExpenseRequestStatus.SUBMITTED,
  });
  if (!updated) throw NotFound('Expense request not found');
  return { id: updated.id };
}

export async function approveExpenseRequestSvc(input: {
  id: string;
  approvedByUserId: string;
  approvalReason?: string | null;
}) {
  const row = await getExpenseRequestRepo(input.id);
  if (!row) throw NotFound('Expense request not found');
  if (row.status !== ExpenseRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted expense requests can be approved');
  }
  const updated = await updateExpenseRequestRepo(input.id, {
    status: ExpenseRequestStatus.APPROVED,
    approvedByUserId: input.approvedByUserId,
    approvalReason: input.approvalReason?.trim() || null,
  });
  if (!updated) throw NotFound('Expense request not found');
  return { id: updated.id };
}

export async function rejectExpenseRequestSvc(input: {
  id: string;
  approvedByUserId: string;
  rejectionReason: string;
}) {
  const row = await getExpenseRequestRepo(input.id);
  if (!row) throw NotFound('Expense request not found');
  if (row.status !== ExpenseRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted expense requests can be rejected');
  }
  const updated = await updateExpenseRequestRepo(input.id, {
    status: ExpenseRequestStatus.REJECTED,
    approvedByUserId: input.approvedByUserId,
    rejectionReason: input.rejectionReason.trim(),
  });
  if (!updated) throw NotFound('Expense request not found');
  return { id: updated.id };
}

export async function payExpenseRequestSvc(input: {
  id: string;
  paidByUserId: string;
  companyBankAccountId?: string | null;
}) {
  const row = await getExpenseRequestRepo(input.id);
  if (!row) throw NotFound('Expense request not found');
  if (row.status !== ExpenseRequestStatus.APPROVED) {
    throw Conflict('Only approved expense requests can be paid');
  }

  if (row.fundingSource === ExpenseFundingSource.COMPANY_BANK) {
    if (!input.companyBankAccountId) {
      throw BadRequest('Company bank account is required for company bank expenses');
    }
    const bankAccount = await getCompanyBankAccountRepo(input.companyBankAccountId);
    if (!bankAccount || bankAccount.companyId !== row.companyId) {
      throw NotFound('Company bank account not found');
    }
  }

  const updated = await updateExpenseRequestRepo(input.id, {
    status: ExpenseRequestStatus.PAID,
    paidByUserId: input.paidByUserId,
    companyBankAccountId: input.companyBankAccountId ?? row.companyBankAccountId,
    paidAt: new Date(),
  });
  if (!updated) throw NotFound('Expense request not found');
  return { id: updated.id };
}

export async function postExpenseRequestSvc(input: { id: string; postedBy: string }) {
  return db.transaction(async (tx) => {
    const row = await getExpenseRequestRepo(input.id, tx);
    if (!row) throw NotFound('Expense request not found');
    if (row.status !== ExpenseRequestStatus.PAID) {
      throw Conflict('Only paid expense requests can be posted');
    }

    const category = await getExpenseCategoryRepo(row.companyId, row.expenseCategoryId, tx);
    if (!category) throw NotFound('Expense category not found');

    let creditAccountId: string;
    let creditDescription: string;
    if (row.fundingSource === ExpenseFundingSource.PETTY_CASH) {
      const pettyFund = await getPettyCashFundByBranchRepo(row.companyId, row.branchId, tx);
      if (!pettyFund) throw NotFound('Petty cash fund not found for branch');
      creditAccountId = pettyFund.accountId;
      creditDescription = 'Expense funded from petty cash';
    } else if (row.fundingSource === ExpenseFundingSource.SALES_CASH) {
      const salesCash = await requireAccountByCode(row.companyId, '1120', tx);
      creditAccountId = salesCash.id;
      creditDescription = 'Expense funded from confirmed sales cash';
    } else {
      if (!row.companyBankAccountId) {
        throw BadRequest('Company bank account is required for company bank expense posting');
      }
      const bankAccount = await getCompanyBankAccountRepo(row.companyBankAccountId, tx);
      if (!bankAccount) throw NotFound('Company bank account not found');
      creditAccountId = bankAccount.accountId;
      creditDescription = 'Expense funded from company bank';
    }

    const posted = await postJournalEntrySvc(
      {
        companyId: row.companyId,
        sourceType: JournalSourceType.EXPENSE,
        sourceId: row.id,
        description: 'Expense request posting',
        memo: row.purpose,
        branchId: row.branchId,
        locationId: row.locationId,
        recordedByUserId: row.recordedByUserId,
        approvedByUserId: row.approvedByUserId,
        postedBy: input.postedBy,
        lines: [
          {
            accountId: category.accountId,
            debitPsw: Number(row.amountPsw),
            description: `Expense: ${category.name}`,
          },
          {
            accountId: creditAccountId,
            creditPsw: Number(row.amountPsw),
            description: creditDescription,
          },
        ],
      },
      tx,
    );

    const updated = await updateExpenseRequestRepo(
      row.id,
      {
        status: ExpenseRequestStatus.POSTED,
        journalEntryId: posted.entryId,
        postedAt: new Date(),
      },
      tx,
    );
    if (!updated) throw NotFound('Expense request not found');
    return { id: updated.id, journalEntryId: posted.entryId };
  });
}

function normalizeDate(value?: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw BadRequest('Invalid date');
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
}

function getNormalBalance(accountClass: number) {
  return accountClass === AccountClass.ASSET || accountClass === AccountClass.EXPENSE
    ? 'DEBIT'
    : 'CREDIT';
}

function computeSignedBalance(input: {
  accountClass: number;
  debitPsw: number;
  creditPsw: number;
}) {
  return getNormalBalance(input.accountClass) === 'DEBIT'
    ? input.debitPsw - input.creditPsw
    : input.creditPsw - input.debitPsw;
}

function splitBalanceForTrial(accountClass: number, debitPsw: number, creditPsw: number) {
  const signed = computeSignedBalance({ accountClass, debitPsw, creditPsw });
  if (signed >= 0) {
    return getNormalBalance(accountClass) === 'DEBIT'
      ? { debitPsw: signed, creditPsw: 0 }
      : { debitPsw: 0, creditPsw: signed };
  }
  return getNormalBalance(accountClass) === 'DEBIT'
    ? { debitPsw: 0, creditPsw: Math.abs(signed) }
    : { debitPsw: Math.abs(signed), creditPsw: 0 };
}

async function getReportLines(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  accountId?: string | null;
}) {
  return listJournalLinesForReportingRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    locationId: input.locationId ?? null,
    dateFrom: normalizeDate(input.dateFrom ?? null, false),
    dateTo: normalizeDate(input.dateTo ?? null, true),
    accountId: input.accountId ?? null,
  });
}

export async function getTrialBalanceSvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const lines = await getReportLines(input);
  const totals = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      accountClass: number;
      debitPsw: number;
      creditPsw: number;
    }
  >();

  for (const line of lines) {
    const current = totals.get(line.accountId) ?? {
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      accountClass: line.accountClass,
      debitPsw: 0,
      creditPsw: 0,
    };
    current.debitPsw += Number(line.debitPsw ?? 0);
    current.creditPsw += Number(line.creditPsw ?? 0);
    totals.set(line.accountId, current);
  }

  const rows = [...totals.values()]
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
    .map((row) => ({
      ...row,
      ...splitBalanceForTrial(row.accountClass, row.debitPsw, row.creditPsw),
    }));

  return {
    filters: input,
    rows,
    totals: {
      debitPsw: rows.reduce((sum, row) => sum + row.debitPsw, 0),
      creditPsw: rows.reduce((sum, row) => sum + row.creditPsw, 0),
    },
  };
}

export async function getAccountStatementSvc(input: {
  companyId: string;
  accountId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}) {
  const lines = await getReportLines(input);
  let runningBalancePsw = 0;
  const accountClass = lines[0]?.accountClass;

  const rows = lines.map((line) => {
    const signed = computeSignedBalance({
      accountClass: line.accountClass,
      debitPsw: Number(line.debitPsw ?? 0),
      creditPsw: Number(line.creditPsw ?? 0),
    });
    runningBalancePsw += signed;
    return {
      ...line,
      runningBalancePsw,
    };
  });

  return {
    filters: input,
    account: rows[0]
      ? {
          id: rows[0].accountId,
          code: rows[0].accountCode,
          name: rows[0].accountName,
          accountClass: rows[0].accountClass,
        }
      : null,
    rows,
    closingBalancePsw:
      accountClass == null ? 0 : rows.length ? rows[rows.length - 1]!.runningBalancePsw : 0,
  };
}

export async function getIncomeStatementSvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  const lines = await getReportLines(input);
  const accounts = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      accountClass: number;
      amountPsw: number;
    }
  >();

  for (const line of lines) {
    if (line.accountClass !== AccountClass.INCOME && line.accountClass !== AccountClass.EXPENSE) {
      continue;
    }
    const current = accounts.get(line.accountId) ?? {
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      accountClass: line.accountClass,
      amountPsw: 0,
    };
    current.amountPsw += computeSignedBalance({
      accountClass: line.accountClass,
      debitPsw: Number(line.debitPsw ?? 0),
      creditPsw: Number(line.creditPsw ?? 0),
    });
    accounts.set(line.accountId, current);
  }

  const income = [...accounts.values()]
    .filter((row) => row.accountClass === AccountClass.INCOME)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const expenses = [...accounts.values()]
    .filter((row) => row.accountClass === AccountClass.EXPENSE)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  const totalIncomePsw = income.reduce((sum, row) => sum + row.amountPsw, 0);
  const totalExpensePsw = expenses.reduce((sum, row) => sum + row.amountPsw, 0);

  return {
    filters: input,
    income,
    expenses,
    totals: {
      totalIncomePsw,
      totalExpensePsw,
      netProfitPsw: totalIncomePsw - totalExpensePsw,
    },
  };
}

export async function getBalanceSheetSvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateTo: string;
}) {
  const lines = await getReportLines({
    companyId: input.companyId,
    branchId: input.branchId,
    locationId: input.locationId,
    dateTo: input.dateTo,
  });
  const accounts = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      accountClass: number;
      amountPsw: number;
    }
  >();

  for (const line of lines) {
    if (
      line.accountClass !== AccountClass.ASSET &&
      line.accountClass !== AccountClass.LIABILITY &&
      line.accountClass !== AccountClass.EQUITY
    ) {
      continue;
    }
    const current = accounts.get(line.accountId) ?? {
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      accountClass: line.accountClass,
      amountPsw: 0,
    };
    current.amountPsw += computeSignedBalance({
      accountClass: line.accountClass,
      debitPsw: Number(line.debitPsw ?? 0),
      creditPsw: Number(line.creditPsw ?? 0),
    });
    accounts.set(line.accountId, current);
  }

  const assets = [...accounts.values()]
    .filter((row) => row.accountClass === AccountClass.ASSET)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const liabilities = [...accounts.values()]
    .filter((row) => row.accountClass === AccountClass.LIABILITY)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const equity = [...accounts.values()]
    .filter((row) => row.accountClass === AccountClass.EQUITY)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  return {
    filters: input,
    assets,
    liabilities,
    equity,
    totals: {
      assetsPsw: assets.reduce((sum, row) => sum + row.amountPsw, 0),
      liabilitiesPsw: liabilities.reduce((sum, row) => sum + row.amountPsw, 0),
      equityPsw: equity.reduce((sum, row) => sum + row.amountPsw, 0),
    },
  };
}

export async function getCashFlowStatementSvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  const lines = await getReportLines(input);
  const byEntry = new Map<string, typeof lines>();
  for (const line of lines) {
    const current = byEntry.get(line.entryId) ?? [];
    current.push(line);
    byEntry.set(line.entryId, current);
  }

  const cashCodes = new Set(['1000', '1010', '1020', '1100', '1110', '1120']);
  let operatingInflowsPsw = 0;
  let operatingOutflowsPsw = 0;
  let investingNetPsw = 0;
  let financingNetPsw = 0;

  for (const entryLines of byEntry.values()) {
    const cashLines = entryLines.filter((line) => cashCodes.has(line.accountCode));
    const nonCashLines = entryLines.filter((line) => !cashCodes.has(line.accountCode));
    if (!cashLines.length || !nonCashLines.length) continue;

    const netCashPsw = cashLines.reduce(
      (sum, line) => sum + Number(line.debitPsw ?? 0) - Number(line.creditPsw ?? 0),
      0,
    );
    const opposingClasses = new Set(nonCashLines.map((line) => line.accountClass));

    if (opposingClasses.has(AccountClass.INCOME) || opposingClasses.has(AccountClass.EXPENSE)) {
      if (netCashPsw > 0) operatingInflowsPsw += netCashPsw;
      else operatingOutflowsPsw += Math.abs(netCashPsw);
      continue;
    }

    if (opposingClasses.has(AccountClass.ASSET)) {
      investingNetPsw += netCashPsw;
      continue;
    }

    if (opposingClasses.has(AccountClass.LIABILITY) || opposingClasses.has(AccountClass.EQUITY)) {
      financingNetPsw += netCashPsw;
    }
  }

  return {
    filters: input,
    operating: {
      inflowsPsw: operatingInflowsPsw,
      outflowsPsw: operatingOutflowsPsw,
      netPsw: operatingInflowsPsw - operatingOutflowsPsw,
    },
    investing: {
      netPsw: investingNetPsw,
    },
    financing: {
      netPsw: financingNetPsw,
    },
    totals: {
      netChangeInCashPsw:
        operatingInflowsPsw - operatingOutflowsPsw + investingNetPsw + financingNetPsw,
    },
  };
}

export async function getMonthlyBranchSummarySvc(input: {
  companyId: string;
  branchId?: string | null;
  locationId?: string | null;
  dateFrom: string;
  dateTo: string;
}) {
  const lines = await getReportLines(input);
  const branchMap = new Map<string, string>();
  const incomeRows = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      branchAmounts: Record<string, number>;
      totalPsw: number;
    }
  >();
  const expenseRows = new Map<
    string,
    {
      accountId: string;
      accountCode: string;
      accountName: string;
      branchAmounts: Record<string, number>;
      totalPsw: number;
    }
  >();
  const incomeByBranch: Record<string, number> = {};
  const expenseByBranch: Record<string, number> = {};

  for (const line of lines) {
    if (!line.branchId || !line.branchName) continue;
    branchMap.set(line.branchId, line.branchName);

    if (line.accountClass !== AccountClass.INCOME && line.accountClass !== AccountClass.EXPENSE) {
      continue;
    }

    const amountPsw =
      line.accountClass === AccountClass.INCOME
        ? Number(line.creditPsw ?? 0) - Number(line.debitPsw ?? 0)
        : Number(line.debitPsw ?? 0) - Number(line.creditPsw ?? 0);
    if (amountPsw === 0) continue;

    const target = line.accountClass === AccountClass.INCOME ? incomeRows : expenseRows;
    const existing = target.get(line.accountId) ?? {
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      branchAmounts: {},
      totalPsw: 0,
    };
    existing.branchAmounts[line.branchId] =
      (existing.branchAmounts[line.branchId] ?? 0) + amountPsw;
    existing.totalPsw += amountPsw;
    target.set(line.accountId, existing);

    if (line.accountClass === AccountClass.INCOME) {
      incomeByBranch[line.branchId] = (incomeByBranch[line.branchId] ?? 0) + amountPsw;
    } else {
      expenseByBranch[line.branchId] = (expenseByBranch[line.branchId] ?? 0) + amountPsw;
    }
  }

  const branches = Array.from(branchMap.entries())
    .map(([branchId, branchName]) => ({ branchId, branchName }))
    .sort((a, b) => a.branchName.localeCompare(b.branchName));

  const netByBranch: Record<string, number> = {};
  for (const branch of branches) {
    netByBranch[branch.branchId] =
      (incomeByBranch[branch.branchId] ?? 0) - (expenseByBranch[branch.branchId] ?? 0);
  }

  return {
    filters: input,
    branches,
    incomeRows: Array.from(incomeRows.values()).sort((a, b) =>
      a.accountName.localeCompare(b.accountName),
    ),
    expenseRows: Array.from(expenseRows.values()).sort((a, b) =>
      a.accountName.localeCompare(b.accountName),
    ),
    totals: {
      incomeByBranch,
      expenseByBranch,
      netByBranch,
      totalIncomePsw: Object.values(incomeByBranch).reduce((sum, value) => sum + value, 0),
      totalExpensePsw: Object.values(expenseByBranch).reduce((sum, value) => sum + value, 0),
    },
  };
}

export async function recordPaymentTaxJournalItemSvc(
  input: {
    companyId: string;
    branchId: string;
    locationId?: string | null;
    sourceId: string;
    taxProfileId?: string | null;
    postingDate?: Date;
    taxBasePsw: number;
    taxTotalPsw: number;
    vatPsw: number;
    getfundPsw: number;
    nhilPsw: number;
    covidPsw: number;
    recordedByUserId: string;
  },
  executor: DbExecutor = db,
) {
  if (input.taxTotalPsw <= 0) return null;

  const created = await createTaxJournalItemRepo(
    {
      companyId: input.companyId,
      branchId: input.branchId,
      locationId: input.locationId ?? null,
      sourceType: JournalSourceType.PAYMENT,
      sourceId: input.sourceId,
      taxProfileId: input.taxProfileId ?? null,
      postingDate: input.postingDate ?? new Date(),
      taxBasePsw: input.taxBasePsw,
      taxTotalPsw: input.taxTotalPsw,
      vatPsw: input.vatPsw,
      getfundPsw: input.getfundPsw,
      nhilPsw: input.nhilPsw,
      covidPsw: input.covidPsw,
      filingStatus: TaxFilingStatus.UNFILED,
      recordedByUserId: input.recordedByUserId,
    },
    executor,
  );

  return created ? { id: created.id } : null;
}

export async function listTaxFilingPeriodsSvc(input: { companyId: string }) {
  return listTaxFilingPeriodsRepo(input);
}

export async function createTaxFilingPeriodSvc(input: {
  companyId: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  notes?: string | null;
  createdByUserId: string;
}) {
  const dateFrom = normalizeDate(input.dateFrom, false);
  const dateTo = normalizeDate(input.dateTo, true);
  if (!dateFrom || !dateTo) throw BadRequest('Date range is required');
  if (dateFrom > dateTo) throw BadRequest('dateFrom must be before dateTo');

  const created = await createTaxFilingPeriodRepo({
    companyId: input.companyId,
    name: input.name.trim(),
    dateFrom,
    dateTo,
    status: TaxFilingPeriodStatus.OPEN,
    notes: input.notes?.trim() || null,
    createdByUserId: input.createdByUserId,
  });
  if (!created) throw NotFound('Failed to create tax filing period');
  return { id: created.id };
}

async function transitionTaxFilingPeriodStatus(
  input: {
    id: string;
    nextStatus: TaxFilingPeriodStatus;
  },
  executor: DbExecutor = db,
) {
  const period = await getTaxFilingPeriodRepo(input.id, executor);
  if (!period) throw NotFound('Tax filing period not found');
  const periodItems = await listTaxJournalItemsRepo(
    { companyId: period.companyId, filingPeriodId: period.id },
    executor,
  );

  if (
    input.nextStatus === TaxFilingPeriodStatus.UNDER_REVIEW &&
    period.status !== TaxFilingPeriodStatus.OPEN
  ) {
    throw Conflict('Only open tax filing periods can move to under review');
  }

  if (
    input.nextStatus === TaxFilingPeriodStatus.SUBMITTED &&
    period.status !== TaxFilingPeriodStatus.UNDER_REVIEW
  ) {
    throw Conflict('Only tax filing periods under review can be submitted');
  }

  if (input.nextStatus === TaxFilingPeriodStatus.SUBMITTED && periodItems.length === 0) {
    throw Conflict('A tax filing period cannot be submitted without tax items');
  }

  if (
    input.nextStatus === TaxFilingPeriodStatus.CLOSED &&
    period.status !== TaxFilingPeriodStatus.SUBMITTED
  ) {
    throw Conflict('Only submitted tax filing periods can be closed');
  }

  if (input.nextStatus === TaxFilingPeriodStatus.CLOSED) {
    const unresolvedItems = periodItems.filter(
      (item) =>
        item.filingStatus !== TaxFilingStatus.FILED &&
        item.filingStatus !== TaxFilingStatus.EXCLUDED,
    );
    if (unresolvedItems.length > 0) {
      throw Conflict('All tax items in the filing period must be filed or excluded before closing');
    }
  }

  const updated = await updateTaxFilingPeriodRepo(
    period.id,
    {
      status: input.nextStatus,
      submittedAt:
        input.nextStatus === TaxFilingPeriodStatus.SUBMITTED ? new Date() : period.submittedAt,
      closedAt: input.nextStatus === TaxFilingPeriodStatus.CLOSED ? new Date() : period.closedAt,
    },
    executor,
  );
  if (!updated) throw NotFound('Tax filing period not found');
  return { id: updated.id };
}

export async function markTaxFilingPeriodUnderReviewSvc(input: { id: string }) {
  return transitionTaxFilingPeriodStatus({
    id: input.id,
    nextStatus: TaxFilingPeriodStatus.UNDER_REVIEW,
  });
}

export async function submitTaxFilingPeriodSvc(input: { id: string }) {
  return transitionTaxFilingPeriodStatus({
    id: input.id,
    nextStatus: TaxFilingPeriodStatus.SUBMITTED,
  });
}

export async function closeTaxFilingPeriodSvc(input: { id: string }) {
  return transitionTaxFilingPeriodStatus({
    id: input.id,
    nextStatus: TaxFilingPeriodStatus.CLOSED,
  });
}

export async function listTaxJournalItemsSvc(input: {
  companyId: string;
  branchId?: string | null;
  filingStatus?: number | null;
  filingPeriodId?: string | null;
}) {
  return listTaxJournalItemsRepo(input);
}

async function transitionTaxItemStatus(
  input: {
    id: string;
    nextStatus: TaxFilingStatus;
    actedByUserId: string;
    filingPeriodId?: string | null;
    reason?: string | null;
  },
  executor: DbExecutor = db,
) {
  const item = await getTaxJournalItemRepo(input.id, executor);
  if (!item) throw NotFound('Tax journal item not found');

  if (input.nextStatus === TaxFilingStatus.READY_FOR_FILING) {
    if (!input.filingPeriodId) throw BadRequest('Filing period is required');
    const period = await getTaxFilingPeriodRepo(input.filingPeriodId, executor);
    if (!period || period.companyId !== item.companyId)
      throw NotFound('Tax filing period not found');
  }

  if (input.nextStatus === TaxFilingStatus.EXCLUDED && !input.reason?.trim()) {
    throw BadRequest('Excluded tax items require a reason');
  }

  const updated = await updateTaxJournalItemRepo(
    item.id,
    {
      filingStatus: input.nextStatus,
      filingPeriodId:
        input.nextStatus === TaxFilingStatus.READY_FOR_FILING ||
        input.nextStatus === TaxFilingStatus.FILED
          ? (input.filingPeriodId ?? item.filingPeriodId)
          : input.nextStatus === TaxFilingStatus.UNFILED
            ? null
            : item.filingPeriodId,
      excludedReason:
        input.nextStatus === TaxFilingStatus.EXCLUDED ? input.reason?.trim() || null : null,
      reviewedByUserId:
        input.nextStatus === TaxFilingStatus.READY_FOR_FILING ||
        input.nextStatus === TaxFilingStatus.EXCLUDED
          ? input.actedByUserId
          : item.reviewedByUserId,
      reviewedAt:
        input.nextStatus === TaxFilingStatus.READY_FOR_FILING ||
        input.nextStatus === TaxFilingStatus.EXCLUDED
          ? new Date()
          : item.reviewedAt,
      filedByUserId:
        input.nextStatus === TaxFilingStatus.FILED ? input.actedByUserId : item.filedByUserId,
      filedAt: input.nextStatus === TaxFilingStatus.FILED ? new Date() : item.filedAt,
    },
    executor,
  );
  if (!updated) throw NotFound('Tax journal item not found');

  await createTaxFilingAuditLogRepo(
    {
      taxJournalItemId: item.id,
      action:
        input.nextStatus === TaxFilingStatus.READY_FOR_FILING
          ? 'MARK_READY'
          : input.nextStatus === TaxFilingStatus.FILED
            ? 'MARK_FILED'
            : input.nextStatus === TaxFilingStatus.EXCLUDED
              ? 'EXCLUDE'
              : 'RESET_UNFILED',
      oldStatus: item.filingStatus,
      newStatus: input.nextStatus,
      reason: input.reason?.trim() || null,
      actedByUserId: input.actedByUserId,
    },
    executor,
  );

  return { id: updated.id };
}

export async function markTaxItemReadyForFilingSvc(input: {
  id: string;
  filingPeriodId: string;
  actedByUserId: string;
}) {
  return transitionTaxItemStatus({
    id: input.id,
    nextStatus: TaxFilingStatus.READY_FOR_FILING,
    filingPeriodId: input.filingPeriodId,
    actedByUserId: input.actedByUserId,
  });
}

export async function markTaxItemFiledSvc(input: {
  id: string;
  filingPeriodId?: string | null;
  actedByUserId: string;
}) {
  return transitionTaxItemStatus({
    id: input.id,
    nextStatus: TaxFilingStatus.FILED,
    filingPeriodId: input.filingPeriodId ?? null,
    actedByUserId: input.actedByUserId,
  });
}

export async function excludeTaxItemSvc(input: {
  id: string;
  reason: string;
  actedByUserId: string;
}) {
  return transitionTaxItemStatus({
    id: input.id,
    nextStatus: TaxFilingStatus.EXCLUDED,
    reason: input.reason,
    actedByUserId: input.actedByUserId,
  });
}
