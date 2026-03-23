import { api } from '@/services/api';

export interface AccountRow {
  id: string;
  companyId: string;
  code: string;
  name: string;
  accountClass: number;
  parentAccountId?: string | null;
  isPostable: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCategoryRow {
  id: string;
  companyId: string;
  code: string;
  name: string;
  accountId: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountMutationInput {
  companyId: string;
  code: string;
  name: string;
  accountClass: number;
  parentAccountId?: string | null;
  isPostable?: boolean;
  active?: boolean;
}

export interface ExpenseCategoryMutationInput {
  companyId: string;
  code: string;
  name: string;
  accountId: string;
  active?: boolean;
}

export interface ApprovalPolicyRow {
  id: string;
  companyId: string;
  policyCode: string;
  name: string;
  amountLimitPsw: number;
  requiresHeadOfficeApproval: boolean;
  appliesToFundingSource?: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalPolicyMutationInput {
  companyId: string;
  policyCode: string;
  name: string;
  amountLimitPsw?: number;
  requiresHeadOfficeApproval?: boolean;
  appliesToFundingSource?: number | null;
  active?: boolean;
}

export interface CompanyBankAccountRow {
  id: string;
  companyId: string;
  accountId: string;
  name: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNumberMasked?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyBankAccountMutationInput {
  companyId: string;
  accountId: string;
  name: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNumberMasked?: string | null;
  active?: boolean;
}

export interface TaxProfileRow {
  id: string;
  companyId: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxProfileMutationInput {
  companyId: string;
  name: string;
  active?: boolean;
}

export interface TaxComponentRow {
  id: string;
  profileId: string;
  key: string;
  numerator: number;
  denominator: number;
  inclusive: boolean;
  sortOrder: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
}

export interface TaxComponentMutationInput {
  companyId: string;
  profileId: string;
  key: string;
  numerator: number;
  denominator: number;
  inclusive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}

export interface DailyCashConfirmationRow {
  id: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  cashierUserId?: string | null;
  accountantUserId?: string | null;
  confirmationDate: string;
  expectedCashPsw: number;
  countedCashPsw: number;
  shortagePsw: number;
  overagePsw: number;
  notes?: string | null;
  status: number;
  journalEntryId?: string | null;
  confirmedAt?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCashExpectedSummary {
  cashSalesPsw: number;
  nonCashSalesPsw: number;
  totalSalesPsw: number;
  senderSalesPsw: number;
  receiverSalesPsw: number;
  deliverySalesPsw: number;
  principalCashSalesPsw: number;
  deliveryCashSalesPsw: number;
  transactionCount: number;
  session: {
    sessionId: string;
    status: string;
    scheduledStartTime: string;
    actualEndTime?: string | null;
    openingBalancePsw: number;
    closingBalancePsw?: number | null;
    expectedClosingBalancePsw?: number | null;
    variancePsw: number;
    totalTransactions: number;
    cashTransactions: number;
    mobileMoneyTransactions: number;
    cardTransactions: number;
    customerCount: number;
    parcelsProcessed: number;
  } | null;
}

export interface ExpenseRequestRow {
  id: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  expenseCategoryId: string;
  amountPsw: number;
  fundingSource: number;
  status: number;
  purpose: string;
  referenceNo?: string | null;
  requestedByUserId: string;
  recordedByUserId: string;
  approvedByUserId?: string | null;
  paidByUserId?: string | null;
  companyBankAccountId?: string | null;
  journalEntryId?: string | null;
  approvalReason?: string | null;
  rejectionReason?: string | null;
  paidAt?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxFilingPeriodRow {
  id: string;
  companyId: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  status: number;
  notes?: string | null;
  createdByUserId?: string | null;
  submittedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaxJournalItemRow {
  id: string;
  companyId: string;
  branchId: string;
  locationId?: string | null;
  sourceType: number;
  sourceId?: string | null;
  journalEntryId?: string | null;
  taxProfileId?: string | null;
  postingDate: string;
  taxBasePsw: number;
  taxTotalPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  filingStatus: number;
  filingPeriodId?: string | null;
  excludedReason?: string | null;
  recordedByUserId?: string | null;
  reviewedByUserId?: string | null;
  filedByUserId?: string | null;
  reviewedAt?: string | null;
  filedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrialBalanceReport {
  filters: Record<string, unknown>;
  rows: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountClass: number;
    debitPsw: number;
    creditPsw: number;
  }>;
  totals: { debitPsw: number; creditPsw: number };
}

export interface AccountStatementReport {
  account: { id: string; code: string; name: string; accountClass: number } | null;
  rows: Array<{
    lineId: string;
    entryId: string;
    entryDate: string;
    memo?: string | null;
    accountCode: string;
    accountName: string;
    branchName?: string | null;
    locationName?: string | null;
    debitPsw: number;
    creditPsw: number;
    runningBalancePsw: number;
  }>;
  closingBalancePsw: number;
}

export interface IncomeStatementReport {
  income: Array<{ accountId: string; accountCode: string; accountName: string; amountPsw: number }>;
  expenses: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    amountPsw: number;
  }>;
  totals: { totalIncomePsw: number; totalExpensePsw: number; netProfitPsw: number };
}

export interface BalanceSheetReport {
  assets: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  liabilities: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  equity: Array<{ accountCode: string; accountName: string; amountPsw: number }>;
  totals: { assetsPsw: number; liabilitiesPsw: number; equityPsw: number };
}

export interface CashFlowReport {
  operating: { inflowsPsw: number; outflowsPsw: number; netPsw: number };
  investing: { netPsw: number };
  financing: { netPsw: number };
  totals: { netChangeInCashPsw: number };
}

export interface MonthlyBranchSummaryReport {
  filters: Record<string, unknown>;
  branches: Array<{ branchId: string; branchName: string }>;
  incomeRows: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    branchAmounts: Record<string, number>;
    totalPsw: number;
  }>;
  expenseRows: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    branchAmounts: Record<string, number>;
    totalPsw: number;
  }>;
  totals: {
    incomeByBranch: Record<string, number>;
    expenseByBranch: Record<string, number>;
    netByBranch: Record<string, number>;
    totalIncomePsw: number;
    totalExpensePsw: number;
  };
}

export const accountingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAccounts: builder.query<AccountRow[], { companyId: string; active?: boolean }>({
      query: (params) => ({ url: '/accounting/accounts', params }),
      providesTags: [{ type: 'Accounting', id: 'ACCOUNTS' }],
    }),
    createAccount: builder.mutation<{ id: string }, AccountMutationInput>({
      query: (body) => ({ url: '/accounting/accounts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'ACCOUNTS' }],
    }),
    updateAccount: builder.mutation<
      { id: string },
      { id: string; body: Partial<AccountMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'ACCOUNTS' }],
    }),
    listExpenseCategories: builder.query<
      ExpenseCategoryRow[],
      { companyId: string; active?: boolean }
    >({
      query: (params) => ({ url: '/accounting/expense-categories', params }),
      providesTags: [{ type: 'Accounting', id: 'EXPENSE_CATEGORIES' }],
    }),
    createExpenseCategory: builder.mutation<{ id: string }, ExpenseCategoryMutationInput>({
      query: (body) => ({ url: '/accounting/expense-categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_CATEGORIES' }],
    }),
    updateExpenseCategory: builder.mutation<
      { id: string },
      { id: string; body: Partial<ExpenseCategoryMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/expense-categories/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_CATEGORIES' }],
    }),
    listApprovalPolicies: builder.query<
      ApprovalPolicyRow[],
      { companyId: string; active?: boolean }
    >({
      query: (params) => ({ url: '/accounting/approval-policies', params }),
      providesTags: [{ type: 'Accounting', id: 'APPROVAL_POLICIES' }],
    }),
    createApprovalPolicy: builder.mutation<{ id: string }, ApprovalPolicyMutationInput>({
      query: (body) => ({ url: '/accounting/approval-policies', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'APPROVAL_POLICIES' }],
    }),
    updateApprovalPolicy: builder.mutation<
      { id: string },
      { id: string; body: Partial<ApprovalPolicyMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/approval-policies/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'APPROVAL_POLICIES' }],
    }),
    listCompanyBankAccounts: builder.query<
      CompanyBankAccountRow[],
      { companyId: string; active?: boolean }
    >({
      query: (params) => ({ url: '/accounting/bank-accounts', params }),
      providesTags: [{ type: 'Accounting', id: 'BANK_ACCOUNTS' }],
    }),
    createCompanyBankAccount: builder.mutation<{ id: string }, CompanyBankAccountMutationInput>({
      query: (body) => ({ url: '/accounting/bank-accounts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'BANK_ACCOUNTS' }],
    }),
    updateCompanyBankAccount: builder.mutation<
      { id: string },
      { id: string; body: Partial<CompanyBankAccountMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/bank-accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'BANK_ACCOUNTS' }],
    }),
    listTaxProfiles: builder.query<TaxProfileRow[], { companyId: string; active?: boolean }>({
      query: (params) => ({ url: '/accounting/tax-profiles', params }),
      providesTags: [{ type: 'Accounting', id: 'TAX_PROFILES' }],
    }),
    listTaxComponents: builder.query<
      TaxComponentRow[],
      { companyId: string; profileId?: string; active?: boolean }
    >({
      query: (params) => ({ url: '/accounting/tax-components', params }),
      providesTags: [{ type: 'Accounting', id: 'TAX_COMPONENTS' }],
    }),
    createTaxProfile: builder.mutation<{ id: string }, TaxProfileMutationInput>({
      query: (body) => ({ url: '/accounting/tax-profiles', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PROFILES' }],
    }),
    updateTaxProfile: builder.mutation<
      { id: string },
      { id: string; body: Partial<TaxProfileMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/tax-profiles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PROFILES' }],
    }),
    createTaxComponent: builder.mutation<{ id: string }, TaxComponentMutationInput>({
      query: (body) => ({ url: '/accounting/tax-components', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Accounting', id: 'TAX_COMPONENTS' },
        { type: 'Accounting', id: 'TAX_PROFILES' },
      ],
    }),
    updateTaxComponent: builder.mutation<
      { id: string },
      { id: string; body: Partial<TaxComponentMutationInput> & { companyId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/accounting/tax-components/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Accounting', id: 'TAX_COMPONENTS' },
        { type: 'Accounting', id: 'TAX_PROFILES' },
      ],
    }),
    listDailyCashConfirmations: builder.query<
      DailyCashConfirmationRow[],
      { companyId: string; branchId?: string }
    >({
      query: (params) => ({ url: '/accounting/daily-cash-confirmations', params }),
      providesTags: [{ type: 'Accounting', id: 'DAILY_CASH' }],
    }),
    getDailyCashExpectedSummary: builder.query<
      DailyCashExpectedSummary,
      {
        companyId: string;
        branchId: string;
        confirmationDate: string;
        locationId?: string;
        cashierUserId?: string;
      }
    >({
      query: (params) => ({ url: '/accounting/daily-cash-expected', params }),
      providesTags: [{ type: 'Accounting', id: 'DAILY_CASH_EXPECTED' }],
    }),
    createDailyCashConfirmation: builder.mutation<{ id: string }, Record<string, unknown>>({
      query: (body) => ({ url: '/accounting/daily-cash-confirmations', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'DAILY_CASH' }],
    }),
    confirmDailyCashConfirmation: builder.mutation<
      { id: string },
      { id: string; accountantUserId: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/daily-cash-confirmations/${id}/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Accounting', id: 'DAILY_CASH' },
        { type: 'Accounting', id: 'REPORTS' },
      ],
    }),
    postDailyCashConfirmation: builder.mutation<
      { id: string; journalEntryId: string },
      { id: string; postedBy: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/daily-cash-confirmations/${id}/post`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Accounting', id: 'DAILY_CASH' },
        { type: 'Accounting', id: 'REPORTS' },
      ],
    }),
    listExpenseRequests: builder.query<
      ExpenseRequestRow[],
      { companyId: string; branchId?: string }
    >({
      query: (params) => ({ url: '/accounting/expense-requests', params }),
      providesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    createExpenseRequest: builder.mutation<{ id: string }, Record<string, unknown>>({
      query: (body) => ({ url: '/accounting/expense-requests', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    submitExpenseRequest: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/accounting/expense-requests/${id}/submit`, method: 'POST' }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    approveExpenseRequest: builder.mutation<
      { id: string },
      { id: string; approvedByUserId: string; approvalReason?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/expense-requests/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    rejectExpenseRequest: builder.mutation<
      { id: string },
      { id: string; approvedByUserId: string; rejectionReason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/expense-requests/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    payExpenseRequest: builder.mutation<
      { id: string },
      { id: string; paidByUserId: string; companyBankAccountId?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/expense-requests/${id}/pay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'EXPENSE_REQUESTS' }],
    }),
    postExpenseRequest: builder.mutation<
      { id: string; journalEntryId: string },
      { id: string; postedBy: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/expense-requests/${id}/post`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Accounting', id: 'EXPENSE_REQUESTS' },
        { type: 'Accounting', id: 'REPORTS' },
      ],
    }),
    listTaxFilingPeriods: builder.query<TaxFilingPeriodRow[], { companyId: string }>({
      query: (params) => ({ url: '/accounting/tax-filing-periods', params }),
      providesTags: [{ type: 'Accounting', id: 'TAX_PERIODS' }],
    }),
    createTaxFilingPeriod: builder.mutation<{ id: string }, Record<string, unknown>>({
      query: (body) => ({ url: '/accounting/tax-filing-periods', method: 'POST', body }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PERIODS' }],
    }),
    markTaxFilingPeriodUnderReview: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/accounting/tax-filing-periods/${id}/review`, method: 'POST' }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PERIODS' }],
    }),
    submitTaxFilingPeriod: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/accounting/tax-filing-periods/${id}/submit`, method: 'POST' }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PERIODS' }],
    }),
    closeTaxFilingPeriod: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/accounting/tax-filing-periods/${id}/close`, method: 'POST' }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_PERIODS' }],
    }),
    listTaxJournalItems: builder.query<
      TaxJournalItemRow[],
      { companyId: string; branchId?: string; filingStatus?: number; filingPeriodId?: string }
    >({
      query: (params) => ({ url: '/accounting/tax-journal-items', params }),
      providesTags: [{ type: 'Accounting', id: 'TAX_ITEMS' }],
    }),
    markTaxItemReady: builder.mutation<
      { id: string },
      { id: string; filingPeriodId: string; actedByUserId: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/tax-journal-items/${id}/ready`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_ITEMS' }],
    }),
    markTaxItemFiled: builder.mutation<
      { id: string },
      { id: string; filingPeriodId?: string | null; actedByUserId: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/tax-journal-items/${id}/file`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_ITEMS' }],
    }),
    excludeTaxItem: builder.mutation<
      { id: string },
      { id: string; reason: string; actedByUserId: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounting/tax-journal-items/${id}/exclude`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Accounting', id: 'TAX_ITEMS' }],
    }),
    getTrialBalanceReport: builder.query<TrialBalanceReport, Record<string, string | undefined>>({
      query: (params) => ({ url: '/accounting/reports/trial-balance', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getAccountStatementReport: builder.query<
      AccountStatementReport,
      Record<string, string | undefined>
    >({
      query: (params) => ({ url: '/accounting/reports/account-statement', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getIncomeStatementReport: builder.query<
      IncomeStatementReport,
      Record<string, string | undefined>
    >({
      query: (params) => ({ url: '/accounting/reports/income-statement', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getProfitLossReport: builder.query<IncomeStatementReport, Record<string, string | undefined>>({
      query: (params) => ({ url: '/accounting/reports/profit-loss', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getBalanceSheetReport: builder.query<BalanceSheetReport, Record<string, string | undefined>>({
      query: (params) => ({ url: '/accounting/reports/balance-sheet', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getCashFlowReport: builder.query<CashFlowReport, Record<string, string | undefined>>({
      query: (params) => ({ url: '/accounting/reports/cash-flow', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
    getMonthlyBranchSummaryReport: builder.query<
      MonthlyBranchSummaryReport,
      Record<string, string | undefined>
    >({
      query: (params) => ({ url: '/accounting/reports/monthly-branch-summary', params }),
      providesTags: [{ type: 'Accounting', id: 'REPORTS' }],
    }),
  }),
});

export const {
  useListAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useListExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useListApprovalPoliciesQuery,
  useCreateApprovalPolicyMutation,
  useUpdateApprovalPolicyMutation,
  useListCompanyBankAccountsQuery,
  useCreateCompanyBankAccountMutation,
  useUpdateCompanyBankAccountMutation,
  useListTaxProfilesQuery,
  useListTaxComponentsQuery,
  useCreateTaxProfileMutation,
  useUpdateTaxProfileMutation,
  useCreateTaxComponentMutation,
  useUpdateTaxComponentMutation,
  useListDailyCashConfirmationsQuery,
  useGetDailyCashExpectedSummaryQuery,
  useCreateDailyCashConfirmationMutation,
  useConfirmDailyCashConfirmationMutation,
  usePostDailyCashConfirmationMutation,
  useListExpenseRequestsQuery,
  useCreateExpenseRequestMutation,
  useSubmitExpenseRequestMutation,
  useApproveExpenseRequestMutation,
  useRejectExpenseRequestMutation,
  usePayExpenseRequestMutation,
  usePostExpenseRequestMutation,
  useListTaxFilingPeriodsQuery,
  useCreateTaxFilingPeriodMutation,
  useMarkTaxFilingPeriodUnderReviewMutation,
  useSubmitTaxFilingPeriodMutation,
  useCloseTaxFilingPeriodMutation,
  useListTaxJournalItemsQuery,
  useMarkTaxItemReadyMutation,
  useMarkTaxItemFiledMutation,
  useExcludeTaxItemMutation,
  useGetTrialBalanceReportQuery,
  useGetAccountStatementReportQuery,
  useGetIncomeStatementReportQuery,
  useGetProfitLossReportQuery,
  useGetBalanceSheetReportQuery,
  useGetCashFlowReportQuery,
  useGetMonthlyBranchSummaryReportQuery,
} = accountingApi;
