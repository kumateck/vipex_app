import { Elysia, t } from 'elysia';
import { authPlugin, type AuthUser, requireAuth } from '@/server/plugins/auth';
import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  approveExpenseRequestCtrl,
  closeTaxFilingPeriodCtrl,
  confirmDailyCashConfirmationCtrl,
  createDailyCashConfirmationCtrl,
  createExpenseRequestCtrl,
  createTaxFilingPeriodCtrl,
  excludeTaxItemCtrl,
  getDailyCashExpectedSummaryCtrl,
  getAccountStatementCtrl,
  getBalanceSheetCtrl,
  getCashFlowStatementCtrl,
  getIncomeStatementCtrl,
  getMonthlyBranchSummaryCtrl,
  getProfitAndLossCtrl,
  getTrialBalanceCtrl,
  listAccountsCtrl,
  listApprovalPoliciesCtrl,
  listCompanyBankAccountsCtrl,
  listDailyCashConfirmationsCtrl,
  listExpenseCategoriesCtrl,
  listExpenseRequestsCtrl,
  listTaxFilingPeriodsCtrl,
  listTaxJournalItemsCtrl,
  markTaxFilingPeriodUnderReviewCtrl,
  markTaxItemFiledCtrl,
  markTaxItemReadyForFilingCtrl,
  payExpenseRequestCtrl,
  postDailyCashConfirmationCtrl,
  postExpenseRequestCtrl,
  rejectExpenseRequestCtrl,
  submitTaxFilingPeriodCtrl,
  submitExpenseRequestCtrl,
} from './controller';
import { assertAccountingEnabledSvc } from './service';

function resolveCompanyId(user: AuthUser | null, fallback?: string) {
  return user?.companyId ?? fallback ?? '';
}

export const accountingRoutes = new Elysia({ name: 'accounting' })
  .use(authPlugin)
  .onBeforeHandle(({ user }) => requireAuth()({ user }))
  .onBeforeHandle(async ({ user }) => {
    const authUser = user as AuthUser | null;
    await assertAccountingEnabledSvc(resolveCompanyId(authUser));
  })
  .get(
    '/accounts',
    async ({ query, user }) =>
      listAccountsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List chart of accounts for a company' },
    },
  )
  .get(
    '/expense-categories',
    async ({ query, user }) =>
      listExpenseCategoriesCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List expense categories for a company' },
    },
  )
  .get(
    '/approval-policies',
    async ({ query, user }) =>
      listApprovalPoliciesCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List accounting approval policies for a company' },
    },
  )
  .get(
    '/bank-accounts',
    async ({ query, user }) =>
      listCompanyBankAccountsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List company bank accounts for a company' },
    },
  )
  .get(
    '/tax-filing-periods',
    async ({ query, user }) =>
      listTaxFilingPeriodsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
      }),
    {
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'List tax filing periods' },
    },
  )
  .post(
    '/tax-filing-periods',
    async ({ body, user }) =>
      createTaxFilingPeriodCtrl({
        ...(body as {
          companyId: string;
          name: string;
          dateFrom: string;
          dateTo: string;
          notes?: string | null;
          createdByUserId: string;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdByUserId: (user as AuthUser).sub,
      } as {
        companyId: string;
        name: string;
        dateFrom: string;
        dateTo: string;
        notes?: string | null;
        createdByUserId: string;
      }),
    {
      body: t.Object({
        companyId: t.String(),
        name: t.String(),
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        createdByUserId: t.String(),
      }),
      detail: { tags: ['Accounting'], summary: 'Create tax filing period' },
    },
  )
  .get(
    '/tax-journal-items',
    async ({ query, user }) =>
      listTaxJournalItemsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        filingStatus: query.filingStatus ?? null,
        filingPeriodId: query.filingPeriodId ?? null,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        filingStatus: t.Optional(t.Number()),
        filingPeriodId: t.Optional(t.String()),
      }),
      detail: { tags: ['Accounting'], summary: 'List tax journal items' },
    },
  )
  .post(
    '/tax-filing-periods/:id/review',
    async ({ params }) => markTaxFilingPeriodUnderReviewCtrl({ id: params.id }),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Mark tax filing period under review' },
    },
  )
  .post(
    '/tax-filing-periods/:id/submit',
    async ({ params }) => submitTaxFilingPeriodCtrl({ id: params.id }),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Submit tax filing period' },
    },
  )
  .post(
    '/tax-filing-periods/:id/close',
    async ({ params }) => closeTaxFilingPeriodCtrl({ id: params.id }),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Close tax filing period' },
    },
  )
  .post(
    '/tax-journal-items/:id/ready',
    async ({ params, body, user }) =>
      markTaxItemReadyForFilingCtrl({
        id: params.id,
        filingPeriodId: (body as { filingPeriodId: string }).filingPeriodId,
        actedByUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ filingPeriodId: t.String(), actedByUserId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Mark tax item ready for filing' },
    },
  )
  .post(
    '/tax-journal-items/:id/file',
    async ({ params, body, user }) =>
      markTaxItemFiledCtrl({
        id: params.id,
        filingPeriodId: (body as { filingPeriodId?: string | null }).filingPeriodId ?? null,
        actedByUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        filingPeriodId: t.Optional(t.Union([t.String(), t.Null()])),
        actedByUserId: t.String(),
      }),
      detail: { tags: ['Accounting'], summary: 'Mark tax item as filed' },
    },
  )
  .post(
    '/tax-journal-items/:id/exclude',
    async ({ params, body, user }) =>
      excludeTaxItemCtrl({
        id: params.id,
        reason: (body as { reason: string }).reason,
        actedByUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ reason: t.String(), actedByUserId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Exclude tax item from filing with reason' },
    },
  )
  .get(
    '/daily-cash-expected',
    async ({ query, user }) =>
      getDailyCashExpectedSummaryCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId,
        confirmationDate: query.confirmationDate,
        locationId: query.locationId ?? null,
        cashierUserId: query.cashierUserId ?? null,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.String(),
        confirmationDate: t.String({ format: 'date' }),
        locationId: t.Optional(t.String()),
        cashierUserId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['Accounting'],
        summary: 'Get expected daily cash summary from recorded payments',
      },
    },
  )
  .get(
    '/daily-cash-confirmations',
    async ({ query, user }) =>
      listDailyCashConfirmationsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
      }),
    {
      query: t.Object({ companyId: t.String(), branchId: t.Optional(t.String()) }),
      detail: { tags: ['Accounting'], summary: 'List daily cash confirmations' },
    },
  )
  .post(
    '/daily-cash-confirmations',
    async ({ body, user }) =>
      createDailyCashConfirmationCtrl({
        ...(body as {
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
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      } as {
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
      }),
    {
      body: t.Object({
        companyId: t.String(),
        branchId: t.String(),
        locationId: t.Optional(t.Union([t.String(), t.Null()])),
        cashierUserId: t.Optional(t.Union([t.String(), t.Null()])),
        accountantUserId: t.Optional(t.Union([t.String(), t.Null()])),
        confirmationDate: t.String({ format: 'date-time' }),
        expectedCashCedis: t.Union([t.Number(), t.String()]),
        countedCashCedis: t.Union([t.Number(), t.String()]),
        notes: t.Optional(t.Union([t.String(), t.Null()])),
        createdBy: t.String(),
      }),
      detail: { tags: ['Accounting'], summary: 'Create daily cash confirmation' },
    },
  )
  .post(
    '/daily-cash-confirmations/:id/confirm',
    async ({ params, user }) =>
      confirmDailyCashConfirmationCtrl({
        id: params.id,
        accountantUserId: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ accountantUserId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Confirm daily cash confirmation' },
    },
  )
  .post(
    '/daily-cash-confirmations/:id/post',
    async ({ params, user }) =>
      postDailyCashConfirmationCtrl({
        id: params.id,
        postedBy: (user as AuthUser).sub,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ postedBy: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Post daily cash confirmation to ledger' },
    },
  )
  .get(
    '/expense-requests',
    async ({ query, user }) =>
      listExpenseRequestsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
      }),
    {
      query: t.Object({ companyId: t.String(), branchId: t.Optional(t.String()) }),
      detail: { tags: ['Accounting'], summary: 'List expense requests' },
    },
  )
  .post(
    '/expense-requests',
    async ({ body, user }) =>
      createExpenseRequestCtrl({
        ...(body as {
          companyId: string;
          branchId: string;
          locationId?: string | null;
          expenseCategoryId: string;
          amountCedis: number | string;
          fundingSource: number;
          purpose: string;
          referenceNo?: string | null;
          requestedByUserId: string;
          recordedByUserId: string;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        requestedByUserId: (user as AuthUser).sub,
        recordedByUserId: (user as AuthUser).sub,
      } as {
        companyId: string;
        branchId: string;
        locationId?: string | null;
        expenseCategoryId: string;
        amountCedis: number | string;
        fundingSource: number;
        purpose: string;
        referenceNo?: string | null;
        requestedByUserId: string;
        recordedByUserId: string;
      }),
    {
      body: t.Object({
        companyId: t.String(),
        branchId: t.String(),
        locationId: t.Optional(t.Union([t.String(), t.Null()])),
        expenseCategoryId: t.String(),
        amountCedis: t.Union([t.Number(), t.String()]),
        fundingSource: t.Number(),
        purpose: t.String(),
        referenceNo: t.Optional(t.Union([t.String(), t.Null()])),
        requestedByUserId: t.String(),
        recordedByUserId: t.String(),
      }),
      detail: { tags: ['Accounting'], summary: 'Create expense request' },
    },
  )
  .post(
    '/expense-requests/:id/submit',
    async ({ params }) => submitExpenseRequestCtrl({ id: params.id }),
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Submit expense request for approval' },
    },
  )
  .post(
    '/expense-requests/:id/approve',
    async ({ params, body, user }) =>
      approveExpenseRequestCtrl({
        id: params.id,
        approvedByUserId: (user as AuthUser).sub,
        approvalReason: (body as { approvalReason?: string | null }).approvalReason ?? null,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        approvedByUserId: t.String(),
        approvalReason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Accounting'], summary: 'Approve expense request' },
    },
  )
  .post(
    '/expense-requests/:id/reject',
    async ({ params, body, user }) =>
      rejectExpenseRequestCtrl({
        id: params.id,
        approvedByUserId: (user as AuthUser).sub,
        rejectionReason: (body as { rejectionReason: string }).rejectionReason,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ approvedByUserId: t.String(), rejectionReason: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Reject expense request' },
    },
  )
  .post(
    '/expense-requests/:id/pay',
    async ({ params, body, user }) =>
      payExpenseRequestCtrl({
        id: params.id,
        paidByUserId: (user as AuthUser).sub,
        companyBankAccountId:
          (body as { companyBankAccountId?: string | null }).companyBankAccountId ?? null,
      }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        paidByUserId: t.String(),
        companyBankAccountId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Accounting'], summary: 'Mark expense request as paid' },
    },
  )
  .post(
    '/expense-requests/:id/post',
    async ({ params, user }) =>
      postExpenseRequestCtrl({ id: params.id, postedBy: (user as AuthUser).sub }),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ postedBy: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Post expense request to ledger' },
    },
  )
  .get(
    '/reports/trial-balance',
    async ({ query, user }) =>
      getTrialBalanceCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.Optional(t.String({ format: 'date' })),
        dateTo: t.Optional(t.String({ format: 'date' })),
      }),
      detail: { tags: ['Accounting'], summary: 'Trial balance report from journal lines' },
    },
  )
  .get(
    '/reports/account-statement',
    async ({ query, user }) =>
      getAccountStatementCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        accountId: query.accountId,
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        accountId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.Optional(t.String({ format: 'date' })),
        dateTo: t.Optional(t.String({ format: 'date' })),
      }),
      detail: { tags: ['Accounting'], summary: 'Account statement ledger report' },
    },
  )
  .get(
    '/reports/income-statement',
    async ({ query, user }) =>
      getIncomeStatementCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
      }),
      detail: { tags: ['Accounting'], summary: 'Income statement report' },
    },
  )
  .get(
    '/reports/profit-loss',
    async ({ query, user }) =>
      getProfitAndLossCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
      }),
      detail: { tags: ['Accounting'], summary: 'Profit and loss report' },
    },
  )
  .get(
    '/reports/balance-sheet',
    async ({ query, user }) =>
      getBalanceSheetCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateTo: query.dateTo,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateTo: t.String({ format: 'date' }),
      }),
      detail: { tags: ['Accounting'], summary: 'Balance sheet report' },
    },
  )
  .get(
    '/reports/monthly-branch-summary',
    async ({ query, user }) =>
      getMonthlyBranchSummaryCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
      }),
      detail: {
        tags: ['Accounting'],
        summary: 'Monthly branch comparison summary by income and expense account',
      },
    },
  )
  .get(
    '/reports/cash-flow',
    async ({ query, user }) =>
      getCashFlowStatementCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        branchId: query.branchId ?? null,
        locationId: query.locationId ?? null,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      }),
    {
      query: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.String()),
        locationId: t.Optional(t.String()),
        dateFrom: t.String({ format: 'date' }),
        dateTo: t.String({ format: 'date' }),
      }),
      detail: { tags: ['Accounting'], summary: 'Cash flow statement report' },
    },
  )
  .post(
    '/taxes/compute',
    async ({ body }) => {
      const psw = toPesewas((body as { principalCedis: number | string }).principalCedis);
      const b = computeGhanaTaxesFromPesewas(psw);
      return {
        principalCedis: fromPesewas(b.principal),
        netCedis: fromPesewas(b.net),
        vatCedis: fromPesewas(b.vat),
        getfundCedis: fromPesewas(b.getfund),
        nhilCedis: fromPesewas(b.nhil),
        covidCedis: fromPesewas(b.covid),
        taxTotalCedis: fromPesewas(b.totalTax),
        residualCedis: fromPesewas(b.residual),
      };
    },
    {
      body: t.Object({ principalCedis: t.Union([t.Number(), t.String()]) }),
      detail: {
        tags: ['Accounting'],
        summary: 'Compute Ghana taxes on principal (inclusive), in cedis',
      },
    },
  );
