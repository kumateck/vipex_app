import {
  approveExpenseRequestSvc,
  closeTaxFilingPeriodSvc,
  confirmDailyCashConfirmationSvc,
  createAccountSvc,
  createApprovalPolicySvc,
  createCompanyBankAccountSvc,
  createDailyCashConfirmationSvc,
  createExpenseCategorySvc,
  createExpenseRequestSvc,
  createTaxComponentSvc,
  createTaxProfileSvc,
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
  listTaxComponentsSvc,
  listTaxFilingPeriodsSvc,
  listTaxJournalItemsSvc,
  listTaxProfilesSvc,
  markTaxFilingPeriodUnderReviewSvc,
  markTaxItemFiledSvc,
  markTaxItemReadyForFilingSvc,
  payExpenseRequestSvc,
  postDailyCashConfirmationSvc,
  postExpenseRequestSvc,
  rejectExpenseRequestSvc,
  submitTaxFilingPeriodSvc,
  submitExpenseRequestSvc,
  updateAccountSvc,
  updateApprovalPolicySvc,
  updateCompanyBankAccountSvc,
  updateExpenseCategorySvc,
  updateTaxComponentSvc,
  updateTaxProfileSvc,
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

export const createAccountCtrl = createAccountSvc;
export const updateAccountCtrl = updateAccountSvc;

export async function listExpenseCategoriesCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listExpenseCategoriesSvc(input));
}

export const createExpenseCategoryCtrl = createExpenseCategorySvc;
export const updateExpenseCategoryCtrl = updateExpenseCategorySvc;

export async function listApprovalPoliciesCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listApprovalPoliciesSvc(input));
}

export const createApprovalPolicyCtrl = createApprovalPolicySvc;
export const updateApprovalPolicyCtrl = updateApprovalPolicySvc;

export async function listCompanyBankAccountsCtrl(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return toIsoRows(await listCompanyBankAccountsSvc(input));
}

export const createCompanyBankAccountCtrl = createCompanyBankAccountSvc;
export const updateCompanyBankAccountCtrl = updateCompanyBankAccountSvc;

export async function listTaxProfilesCtrl(input: { companyId: string; active?: boolean | null }) {
  return toIsoRows(await listTaxProfilesSvc(input));
}

export const createTaxProfileCtrl = createTaxProfileSvc;
export const updateTaxProfileCtrl = updateTaxProfileSvc;

export async function listTaxComponentsCtrl(input: {
  companyId: string;
  profileId?: string | null;
  active?: boolean | null;
}) {
  return (await listTaxComponentsSvc(input)).map((row) => ({
    ...row,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
  }));
}

export const createTaxComponentCtrl = createTaxComponentSvc;
export const updateTaxComponentCtrl = updateTaxComponentSvc;

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
