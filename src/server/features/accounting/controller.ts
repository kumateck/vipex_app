import {
  approveExpenseRequestSvc,
  closeTaxFilingPeriodSvc,
  confirmDailyCashConfirmationSvc,
  createDailyCashConfirmationSvc,
  createExpenseRequestSvc,
  createTaxFilingPeriodSvc,
  excludeTaxItemSvc,
  getDailyCashExpectedSummarySvc,
  getAccountStatementSvc,
  getBalanceSheetSvc,
  getCashFlowStatementSvc,
  getIncomeStatementSvc,
  getMonthlyBranchSummarySvc,
  getTrialBalanceSvc,
  listAccountsSvc,
  listApprovalPoliciesSvc,
  listCompanyBankAccountsSvc,
  listDailyCashConfirmationsSvc,
  listExpenseCategoriesSvc,
  listExpenseRequestsSvc,
  listTaxFilingPeriodsSvc,
  listTaxJournalItemsSvc,
  markTaxFilingPeriodUnderReviewSvc,
  markTaxItemFiledSvc,
  markTaxItemReadyForFilingSvc,
  payExpenseRequestSvc,
  postDailyCashConfirmationSvc,
  postExpenseRequestSvc,
  rejectExpenseRequestSvc,
  submitTaxFilingPeriodSvc,
  submitExpenseRequestSvc,
} from './service';

function toIsoRows<T extends { createdAt?: Date; updatedAt?: Date }>(rows: T[]) {
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
  }));
}

export async function listAccountsCtrl(input: { companyId: string; active?: boolean | null }) {
  return toIsoRows(await listAccountsSvc(input));
}

export async function listExpenseCategoriesCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listExpenseCategoriesSvc(input));
}

export async function listApprovalPoliciesCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listApprovalPoliciesSvc(input));
}

export async function listCompanyBankAccountsCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listCompanyBankAccountsSvc(input));
}

export async function listDailyCashConfirmationsCtrl(input: {
  companyId: string;
  branchId?: string | null;
}) {
  return (await listDailyCashConfirmationsSvc(input)).map((row) => ({
    ...row,
    confirmationDate: row.confirmationDate.toISOString(),
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    postedAt: row.postedAt ? row.postedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export const createDailyCashConfirmationCtrl = createDailyCashConfirmationSvc;
export const confirmDailyCashConfirmationCtrl = confirmDailyCashConfirmationSvc;
export const postDailyCashConfirmationCtrl = postDailyCashConfirmationSvc;
export const getDailyCashExpectedSummaryCtrl = getDailyCashExpectedSummarySvc;

export async function listExpenseRequestsCtrl(input: {
  companyId: string;
  branchId?: string | null;
}) {
  return (await listExpenseRequestsSvc(input)).map((row) => ({
    ...row,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    postedAt: row.postedAt ? row.postedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export const createExpenseRequestCtrl = createExpenseRequestSvc;
export const submitExpenseRequestCtrl = submitExpenseRequestSvc;
export const approveExpenseRequestCtrl = approveExpenseRequestSvc;
export const rejectExpenseRequestCtrl = rejectExpenseRequestSvc;
export const payExpenseRequestCtrl = payExpenseRequestSvc;
export const postExpenseRequestCtrl = postExpenseRequestSvc;

export async function listTaxFilingPeriodsCtrl(input: { companyId: string }) {
  return (await listTaxFilingPeriodsSvc(input)).map((row) => ({
    ...row,
    dateFrom: row.dateFrom.toISOString(),
    dateTo: row.dateTo.toISOString(),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export const createTaxFilingPeriodCtrl = createTaxFilingPeriodSvc;
export const markTaxFilingPeriodUnderReviewCtrl = markTaxFilingPeriodUnderReviewSvc;
export const submitTaxFilingPeriodCtrl = submitTaxFilingPeriodSvc;
export const closeTaxFilingPeriodCtrl = closeTaxFilingPeriodSvc;

export async function listTaxJournalItemsCtrl(input: {
  companyId: string;
  branchId?: string | null;
  filingStatus?: number | null;
  filingPeriodId?: string | null;
}) {
  return (await listTaxJournalItemsSvc(input)).map((row) => ({
    ...row,
    postingDate: row.postingDate.toISOString(),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    filedAt: row.filedAt ? row.filedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export const markTaxItemReadyForFilingCtrl = markTaxItemReadyForFilingSvc;
export const markTaxItemFiledCtrl = markTaxItemFiledSvc;
export const excludeTaxItemCtrl = excludeTaxItemSvc;

export const getTrialBalanceCtrl = getTrialBalanceSvc;
export const getAccountStatementCtrl = getAccountStatementSvc;
export const getIncomeStatementCtrl = getIncomeStatementSvc;
export const getProfitAndLossCtrl = getIncomeStatementSvc;
export const getBalanceSheetCtrl = getBalanceSheetSvc;
export const getCashFlowStatementCtrl = getCashFlowStatementSvc;
export const getMonthlyBranchSummaryCtrl = getMonthlyBranchSummarySvc;
