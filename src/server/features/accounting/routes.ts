import { Elysia, t } from 'elysia';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
  requireModuleEnabled,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { fromPesewas, toPesewas } from '@/server/utils/gh-money';
import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import {
  approveExpenseRequestCtrl,
  approveAndPostManualJournalEntryCtrl,
  closeTaxFilingPeriodCtrl,
  confirmDailyCashConfirmationCtrl,
  createAccountCtrl,
  createApprovalPolicyCtrl,
  createCompanyBankAccountCtrl,
  createDailyCashConfirmationCtrl,
  createExpenseCategoryCtrl,
  createExpenseRequestCtrl,
  createServiceChargeCtrl,
  createTaxComponentCtrl,
  createTaxProfileCtrl,
  createTaxFilingPeriodCtrl,
  deleteAccountCtrl,
  deleteApprovalPolicyCtrl,
  deleteCompanyBankAccountCtrl,
  deleteExpenseCategoryCtrl,
  deleteTaxComponentCtrl,
  deleteTaxProfileCtrl,
  excludeTaxItemCtrl,
  getDailyCashExpectedSummaryCtrl,
  getAccountStatementCtrl,
  getBalanceSheetCtrl,
  getCashFlowStatementCtrl,
  getManualJournalApprovalPolicyCtrl,
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
  listPendingManualJournalEntriesCtrl,
  listServiceChargesCtrl,
  listTaxComponentsCtrl,
  listTaxFilingPeriodsCtrl,
  listTaxJournalItemsCtrl,
  listTaxProfilesCtrl,
  markTaxFilingPeriodUnderReviewCtrl,
  markTaxItemFiledCtrl,
  markTaxItemReadyForFilingCtrl,
  payExpenseRequestCtrl,
  postManualJournalEntryCtrl,
  postDailyCashConfirmationCtrl,
  postExpenseRequestCtrl,
  rejectExpenseRequestCtrl,
  rejectManualJournalEntryCtrl,
  submitTaxFilingPeriodCtrl,
  submitExpenseRequestCtrl,
  updateAccountCtrl,
  updateApprovalPolicyCtrl,
  updateCompanyBankAccountCtrl,
  updateExpenseCategoryCtrl,
  updateServiceChargeCtrl,
  updateTaxComponentCtrl,
  updateTaxProfileCtrl,
} from './controller';
import { assertAccountingEnabledSvc } from './service';

function resolveCompanyId(user: AuthUser | null, fallback?: string) {
  return user?.companyId ?? fallback ?? '';
}

const canReadAccounting = [requirePermissions(PermissionKeys.CanReadAccounting)];
const canReadAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingAccounts,
    PermissionKeys.CanCreateAccountingAccounts,
    PermissionKeys.CanUpdateAccountingAccounts,
    PermissionKeys.CanDeleteAccountingAccounts,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingAccounts,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingAccounts,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingAccounts,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canReadExpenseCategoriesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingExpenseCategories,
    PermissionKeys.CanCreateAccountingExpenseCategories,
    PermissionKeys.CanUpdateAccountingExpenseCategories,
    PermissionKeys.CanDeleteAccountingExpenseCategories,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateExpenseCategoriesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingExpenseCategories,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateExpenseCategoriesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingExpenseCategories,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteExpenseCategoriesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingExpenseCategories,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canReadApprovalPoliciesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingApprovalPolicies,
    PermissionKeys.CanCreateAccountingApprovalPolicies,
    PermissionKeys.CanUpdateAccountingApprovalPolicies,
    PermissionKeys.CanDeleteAccountingApprovalPolicies,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateApprovalPoliciesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingApprovalPolicies,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateApprovalPoliciesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingApprovalPolicies,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteApprovalPoliciesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingApprovalPolicies,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canReadBankAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingBankAccounts,
    PermissionKeys.CanCreateAccountingBankAccounts,
    PermissionKeys.CanUpdateAccountingBankAccounts,
    PermissionKeys.CanDeleteAccountingBankAccounts,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateBankAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingBankAccounts,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateBankAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingBankAccounts,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteBankAccountsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingBankAccounts,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canReadTaxProfilesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingTaxProfiles,
    PermissionKeys.CanCreateAccountingTaxProfiles,
    PermissionKeys.CanUpdateAccountingTaxProfiles,
    PermissionKeys.CanDeleteAccountingTaxProfiles,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateTaxProfilesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingTaxProfiles,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateTaxProfilesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingTaxProfiles,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteTaxProfilesSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingTaxProfiles,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canReadTaxComponentsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanReadAccountingTaxComponents,
    PermissionKeys.CanCreateAccountingTaxComponents,
    PermissionKeys.CanUpdateAccountingTaxComponents,
    PermissionKeys.CanDeleteAccountingTaxComponents,
    PermissionKeys.CanReadAccountingSetup,
    PermissionKeys.CanCreateAccountingSetup,
    PermissionKeys.CanUpdateAccountingSetup,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateTaxComponentsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingTaxComponents,
    PermissionKeys.CanCreateAccountingSetup,
  ),
];
const canUpdateTaxComponentsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanUpdateAccountingTaxComponents,
    PermissionKeys.CanUpdateAccountingSetup,
  ),
];
const canDeleteTaxComponentsSetup = [
  requireAnyPermissions(
    PermissionKeys.CanDeleteAccountingTaxComponents,
    PermissionKeys.CanDeleteAccountingSetup,
  ),
];
const canCreateTaxFilingPeriod = [requirePermissions(PermissionKeys.CanCreateTaxFilingPeriod)];
const canMarkTaxFilingPeriodUnderReview = [
  requirePermissions(PermissionKeys.CanMarkTaxFilingPeriodUnderReview),
];
const canSubmitTaxFilingPeriod = [requirePermissions(PermissionKeys.CanSubmitTaxFilingPeriod)];
const canCloseTaxFilingPeriod = [requirePermissions(PermissionKeys.CanCloseTaxFilingPeriod)];
const canMarkTaxItemReadyForFiling = [
  requirePermissions(PermissionKeys.CanMarkTaxItemReadyForFiling),
];
const canMarkTaxItemFiled = [requirePermissions(PermissionKeys.CanMarkTaxItemFiled)];
const canExcludeTaxItemFromFiling = [
  requirePermissions(PermissionKeys.CanExcludeTaxItemFromFiling),
];
const canCreateDailyCashConfirmation = [
  requirePermissions(PermissionKeys.CanCreateDailyCashConfirmation),
];
const canConfirmDailyCashConfirmation = [
  requirePermissions(PermissionKeys.CanConfirmDailyCashConfirmation),
];
const canPostDailyCashConfirmation = [
  requirePermissions(PermissionKeys.CanPostDailyCashConfirmation),
];
const canCreateExpenseRequest = [requirePermissions(PermissionKeys.CanCreateExpenseRequest)];
const canSubmitExpenseRequest = [requirePermissions(PermissionKeys.CanSubmitExpenseRequest)];
const canApproveExpenseRequest = [requirePermissions(PermissionKeys.CanApproveExpenseRequest)];
const canRejectExpenseRequest = [requirePermissions(PermissionKeys.CanRejectExpenseRequest)];
const canPayExpenseRequest = [requirePermissions(PermissionKeys.CanPayExpenseRequest)];
const canPostExpenseRequest = [requirePermissions(PermissionKeys.CanPostExpenseRequest)];
const canCreateOrApproveAccountingManualEntries = [
  requireAnyPermissions(
    PermissionKeys.CanCreateAccountingManualEntries,
    PermissionKeys.CanApproveAccountingManualEntries,
  ),
];
const canApproveAccountingManualEntries = [
  requirePermissions(PermissionKeys.CanApproveAccountingManualEntries),
];

export const accountingRoutes = new Elysia({ name: 'accounting' })
  .use(authPlugin)
  .onBeforeHandle(({ user }) => requireAuth()({ user }))
  .onBeforeHandle(({ user }) =>
    requireModuleEnabled('accounting')({ user: user as AuthUser | null }),
  )
  .onBeforeHandle(async ({ user }) => {
    const authUser = user as AuthUser | null;
    await assertAccountingEnabledSvc(resolveCompanyId(authUser));
  })
  .get(
    '/accounts',
    async ({ query, user }) => {
      const companyId = resolveCompanyId(user as AuthUser | null, query.companyId);
      const active = query.active;
      try {
        return await listAccountsCtrl({
          companyId,
          active,
        });
      } catch (error) {
        console.error('[accounting/accounts] list failed', {
          companyId,
          active,
          userId: (user as AuthUser | null)?.sub ?? null,
          error,
        });
        throw error;
      }
    },
    {
      beforeHandle: canReadAccountsSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List chart of accounts for a company' },
    },
  )
  .post(
    '/accounts',
    async ({ body, user }) =>
      createAccountCtrl({
        ...(body as {
          companyId: string;
          code: string;
          name: string;
          label?: string | null;
          accountClass: number;
          parentAccountId?: string | null;
          isPostable?: boolean;
          active?: boolean;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateAccountsSetup,
      body: t.Object({
        companyId: t.String(),
        code: t.String(),
        name: t.String(),
        label: t.Optional(t.Union([t.String(), t.Null()])),
        accountClass: t.Number(),
        parentAccountId: t.Optional(t.Union([t.String(), t.Null()])),
        isPostable: t.Optional(t.Boolean()),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create chart of account item' },
    },
  )
  .patch(
    '/accounts/:id',
    async ({ params, body, user }) =>
      updateAccountCtrl({
        ...(body as {
          companyId: string;
          code?: string;
          name?: string;
          label?: string | null;
          accountClass?: number;
          parentAccountId?: string | null;
          isPostable?: boolean;
          active?: boolean;
          syncLinkedCategory?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateAccountsSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        code: t.Optional(t.String()),
        name: t.Optional(t.String()),
        label: t.Optional(t.Union([t.String(), t.Null()])),
        accountClass: t.Optional(t.Number()),
        parentAccountId: t.Optional(t.Union([t.String(), t.Null()])),
        isPostable: t.Optional(t.Boolean()),
        active: t.Optional(t.Boolean()),
        syncLinkedCategory: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update chart of account item' },
    },
  )
  .delete(
    '/accounts/:id',
    async ({ params, query, user }) =>
      deleteAccountCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        removeLinkedCategory: query.removeLinkedCategory,
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteAccountsSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String(), removeLinkedCategory: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'Delete chart of account item' },
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
      beforeHandle: canReadExpenseCategoriesSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List expense categories for a company' },
    },
  )
  .post(
    '/expense-categories',
    async ({ body, user }) =>
      createExpenseCategoryCtrl({
        ...(body as {
          companyId: string;
          code: string;
          name: string;
          accountId: string;
          active?: boolean;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateExpenseCategoriesSetup,
      body: t.Object({
        companyId: t.String(),
        code: t.String(),
        name: t.String(),
        accountId: t.String(),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create expense category' },
    },
  )
  .patch(
    '/expense-categories/:id',
    async ({ params, body, user }) =>
      updateExpenseCategoryCtrl({
        ...(body as {
          companyId: string;
          code?: string;
          name?: string;
          accountId?: string;
          active?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateExpenseCategoriesSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        code: t.Optional(t.String()),
        name: t.Optional(t.String()),
        accountId: t.Optional(t.String()),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update expense category' },
    },
  )
  .delete(
    '/expense-categories/:id',
    async ({ params, query, user }) =>
      deleteExpenseCategoryCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteExpenseCategoriesSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Delete expense category' },
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
      beforeHandle: canReadApprovalPoliciesSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List accounting approval policies for a company' },
    },
  )
  .post(
    '/approval-policies',
    async ({ body, user }) =>
      createApprovalPolicyCtrl({
        ...(body as {
          companyId: string;
          policyCode: string;
          name: string;
          amountLimitPsw?: number;
          autoAuthorizeBelowThreshold?: boolean;
          requiresHeadOfficeApproval?: boolean;
          appliesToFundingSource?: number | null;
          active?: boolean;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateApprovalPoliciesSetup,
      body: t.Object({
        companyId: t.String(),
        policyCode: t.String(),
        name: t.String(),
        amountLimitPsw: t.Optional(t.Number()),
        autoAuthorizeBelowThreshold: t.Optional(t.Boolean()),
        requiresHeadOfficeApproval: t.Optional(t.Boolean()),
        appliesToFundingSource: t.Optional(t.Union([t.Number(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create accounting approval policy' },
    },
  )
  .patch(
    '/approval-policies/:id',
    async ({ params, body, user }) =>
      updateApprovalPolicyCtrl({
        ...(body as {
          companyId: string;
          policyCode?: string;
          name?: string;
          amountLimitPsw?: number;
          autoAuthorizeBelowThreshold?: boolean;
          requiresHeadOfficeApproval?: boolean;
          appliesToFundingSource?: number | null;
          active?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateApprovalPoliciesSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        policyCode: t.Optional(t.String()),
        name: t.Optional(t.String()),
        amountLimitPsw: t.Optional(t.Number()),
        autoAuthorizeBelowThreshold: t.Optional(t.Boolean()),
        requiresHeadOfficeApproval: t.Optional(t.Boolean()),
        appliesToFundingSource: t.Optional(t.Union([t.Number(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update accounting approval policy' },
    },
  )
  .delete(
    '/approval-policies/:id',
    async ({ params, query, user }) =>
      deleteApprovalPolicyCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteApprovalPoliciesSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Delete accounting approval policy' },
    },
  )
  .get(
    '/service-charges',
    async ({ query, user }) =>
      listServiceChargesCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      beforeHandle: canReadBankAccountsSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List service charges for a company' },
    },
  )
  .post(
    '/service-charges',
    async ({ body, user }) =>
      createServiceChargeCtrl({
        ...(body as {
          companyId: string;
          code: string;
          name: string;
          description?: string | null;
          amountPsw: number;
          taxable?: boolean;
          active?: boolean;
          sortOrder?: number;
          payableAccountId?: string | null;
          effectiveFrom?: string | null;
          effectiveTo?: string | null;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateBankAccountsSetup,
      body: t.Object({
        companyId: t.String(),
        code: t.String(),
        name: t.String(),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        amountPsw: t.Number(),
        taxable: t.Optional(t.Boolean()),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
        payableAccountId: t.Optional(t.Union([t.String(), t.Null()])),
        effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
        effectiveTo: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Accounting'], summary: 'Create service charge' },
    },
  )
  .patch(
    '/service-charges/:id',
    async ({ params, body, user }) =>
      updateServiceChargeCtrl({
        ...(body as {
          companyId: string;
          code?: string;
          name?: string;
          description?: string | null;
          amountPsw?: number;
          taxable?: boolean;
          active?: boolean;
          sortOrder?: number;
          payableAccountId?: string | null;
          effectiveFrom?: string | null;
          effectiveTo?: string | null;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateBankAccountsSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        code: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        amountPsw: t.Optional(t.Number()),
        taxable: t.Optional(t.Boolean()),
        active: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
        payableAccountId: t.Optional(t.Union([t.String(), t.Null()])),
        effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
        effectiveTo: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Accounting'], summary: 'Update service charge' },
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
      beforeHandle: canReadBankAccountsSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List company bank accounts for a company' },
    },
  )
  .post(
    '/bank-accounts',
    async ({ body, user }) =>
      createCompanyBankAccountCtrl({
        ...(body as {
          companyId: string;
          accountId: string;
          name: string;
          bankName?: string | null;
          branchName?: string | null;
          accountNumberMasked?: string | null;
          active?: boolean;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        createdBy: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateBankAccountsSetup,
      body: t.Object({
        companyId: t.String(),
        accountId: t.String(),
        name: t.String(),
        bankName: t.Optional(t.Union([t.String(), t.Null()])),
        branchName: t.Optional(t.Union([t.String(), t.Null()])),
        accountNumberMasked: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create company bank account' },
    },
  )
  .patch(
    '/bank-accounts/:id',
    async ({ params, body, user }) =>
      updateCompanyBankAccountCtrl({
        ...(body as {
          companyId: string;
          accountId?: string;
          name?: string;
          bankName?: string | null;
          branchName?: string | null;
          accountNumberMasked?: string | null;
          active?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateBankAccountsSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        accountId: t.Optional(t.String()),
        name: t.Optional(t.String()),
        bankName: t.Optional(t.Union([t.String(), t.Null()])),
        branchName: t.Optional(t.Union([t.String(), t.Null()])),
        accountNumberMasked: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update company bank account' },
    },
  )
  .delete(
    '/bank-accounts/:id',
    async ({ params, query, user }) =>
      deleteCompanyBankAccountCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteBankAccountsSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Delete company bank account' },
    },
  )
  .get(
    '/tax-profiles',
    async ({ query, user }) =>
      listTaxProfilesCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        active: query.active,
      }),
    {
      beforeHandle: canReadTaxProfilesSetup,
      query: t.Object({ companyId: t.String(), active: t.Optional(t.Boolean()) }),
      detail: { tags: ['Accounting'], summary: 'List tax profiles for a company' },
    },
  )
  .get(
    '/tax-components',
    async ({ query, user }) =>
      listTaxComponentsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        profileId: query.profileId,
        active: query.active,
      }),
    {
      beforeHandle: canReadTaxComponentsSetup,
      query: t.Object({
        companyId: t.String(),
        profileId: t.Optional(t.String()),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'List tax components for a company' },
    },
  )
  .post(
    '/tax-profiles',
    async ({ body, user }) =>
      createTaxProfileCtrl({
        ...(body as {
          companyId: string;
          name: string;
          active?: boolean;
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateTaxProfilesSetup,
      body: t.Object({
        companyId: t.String(),
        name: t.String(),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create tax profile' },
    },
  )
  .patch(
    '/tax-profiles/:id',
    async ({ params, body, user }) =>
      updateTaxProfileCtrl({
        ...(body as {
          companyId: string;
          name?: string;
          active?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateTaxProfilesSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        name: t.Optional(t.String()),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update tax profile' },
    },
  )
  .delete(
    '/tax-profiles/:id',
    async ({ params, query, user }) =>
      deleteTaxProfileCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteTaxProfilesSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Delete tax profile' },
    },
  )
  .post(
    '/tax-components',
    async ({ body, user }) =>
      createTaxComponentCtrl({
        ...(body as {
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
        }),
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canCreateTaxComponentsSetup,
      body: t.Object({
        companyId: t.String(),
        profileId: t.String(),
        key: t.String(),
        numerator: t.Number(),
        denominator: t.Number(),
        inclusive: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
        startsAt: t.Optional(t.Union([t.String(), t.Null()])),
        endsAt: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Create tax component' },
    },
  )
  .patch(
    '/tax-components/:id',
    async ({ params, body, user }) =>
      updateTaxComponentCtrl({
        ...(body as {
          companyId: string;
          key?: string;
          numerator?: number;
          denominator?: number;
          inclusive?: boolean;
          sortOrder?: number;
          startsAt?: string | null;
          endsAt?: string | null;
          active?: boolean;
        }),
        id: params.id,
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canUpdateTaxComponentsSetup,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        key: t.Optional(t.String()),
        numerator: t.Optional(t.Number()),
        denominator: t.Optional(t.Number()),
        inclusive: t.Optional(t.Boolean()),
        sortOrder: t.Optional(t.Number()),
        startsAt: t.Optional(t.Union([t.String(), t.Null()])),
        endsAt: t.Optional(t.Union([t.String(), t.Null()])),
        active: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Accounting'], summary: 'Update tax component' },
    },
  )
  .delete(
    '/tax-components/:id',
    async ({ params, query, user }) =>
      deleteTaxComponentCtrl({
        id: params.id,
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
        actorUserId: (user as AuthUser).sub,
      }),
    {
      beforeHandle: canDeleteTaxComponentsSetup,
      params: t.Object({ id: t.String() }),
      query: t.Object({ companyId: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Delete tax component' },
    },
  )
  .get(
    '/manual-journal/policy',
    async ({ query }) =>
      getManualJournalApprovalPolicyCtrl({
        companyId: query.companyId,
      }),
    {
      beforeHandle: [
        requireAnyPermissions(
          PermissionKeys.CanReadAccountingManualEntries,
          PermissionKeys.CanCreateAccountingManualEntries,
          PermissionKeys.CanApproveAccountingManualEntries,
        ),
      ],
      query: t.Object({ companyId: t.String() }),
      detail: {
        tags: ['Accounting'],
        summary: 'Get manual journal auto-authorization threshold policy',
      },
    },
  )
  .post(
    '/manual-journal/post',
    async ({ body, user }) =>
      postManualJournalEntryCtrl({
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        actorUserId: (user as AuthUser).sub,
        branchId: (body as { branchId?: string | null }).branchId ?? null,
        locationId: (body as { locationId?: string | null }).locationId ?? null,
        memo: (body as { memo?: string | null }).memo ?? null,
        entryDate: (body as { entryDate?: string | null }).entryDate ?? null,
        lines: (
          body as {
            lines: Array<{
              accountId: string;
              debitPsw?: number;
              creditPsw?: number;
              branchId?: string | null;
              locationId?: string | null;
              description?: string | null;
            }>;
          }
        ).lines,
      }),
    {
      beforeHandle: canCreateOrApproveAccountingManualEntries,
      body: t.Object({
        companyId: t.String(),
        branchId: t.Optional(t.Union([t.String(), t.Null()])),
        locationId: t.Optional(t.Union([t.String(), t.Null()])),
        memo: t.Optional(t.Union([t.String(), t.Null()])),
        entryDate: t.Optional(t.Union([t.String(), t.Null()])),
        lines: t.Array(
          t.Object({
            accountId: t.String(),
            debitPsw: t.Optional(t.Number()),
            creditPsw: t.Optional(t.Number()),
            branchId: t.Optional(t.Union([t.String(), t.Null()])),
            locationId: t.Optional(t.Union([t.String(), t.Null()])),
            description: t.Optional(t.Union([t.String(), t.Null()])),
          }),
        ),
      }),
      detail: {
        tags: ['Accounting'],
        summary: 'Submit manual journal entry (auto-authorize below threshold or queue)',
      },
    },
  )
  .get(
    '/manual-journal/pending',
    async ({ query }) =>
      listPendingManualJournalEntriesCtrl({
        companyId: query.companyId,
      }),
    {
      beforeHandle: [
        requireAnyPermissions(
          PermissionKeys.CanReadAccountingManualEntries,
          PermissionKeys.CanCreateAccountingManualEntries,
          PermissionKeys.CanApproveAccountingManualEntries,
        ),
      ],
      query: t.Object({ companyId: t.String() }),
      detail: {
        tags: ['Accounting'],
        summary: 'List pending manual journal entries awaiting approval',
      },
    },
  )
  .post(
    '/manual-journal/:id/approve-and-post',
    async ({ params, body, user }) =>
      approveAndPostManualJournalEntryCtrl({
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        manualEntryId: params.id,
        actorUserId: (user as AuthUser).sub,
        approvalReason: (body as { approvalReason?: string | null }).approvalReason ?? null,
      }),
    {
      beforeHandle: canApproveAccountingManualEntries,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        approvalReason: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ['Accounting'],
        summary: 'Approve pending manual journal entry and post it to ledger',
      },
    },
  )
  .post(
    '/manual-journal/:id/reject',
    async ({ params, body, user }) =>
      rejectManualJournalEntryCtrl({
        companyId: resolveCompanyId(
          user as AuthUser | null,
          (body as { companyId: string }).companyId,
        ),
        manualEntryId: params.id,
        actorUserId: (user as AuthUser).sub,
        rejectionReason: (body as { rejectionReason: string }).rejectionReason,
      }),
    {
      beforeHandle: canApproveAccountingManualEntries,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        companyId: t.String(),
        rejectionReason: t.String(),
      }),
      detail: {
        tags: ['Accounting'],
        summary: 'Reject pending manual journal entry',
      },
    },
  )
  .get(
    '/tax-filing-periods',
    async ({ query, user }) =>
      listTaxFilingPeriodsCtrl({
        companyId: resolveCompanyId(user as AuthUser | null, query.companyId),
      }),
    {
      beforeHandle: canReadAccounting,
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
      beforeHandle: canCreateTaxFilingPeriod,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canMarkTaxFilingPeriodUnderReview,
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Mark tax filing period under review' },
    },
  )
  .post(
    '/tax-filing-periods/:id/submit',
    async ({ params }) => submitTaxFilingPeriodCtrl({ id: params.id }),
    {
      beforeHandle: canSubmitTaxFilingPeriod,
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Accounting'], summary: 'Submit tax filing period' },
    },
  )
  .post(
    '/tax-filing-periods/:id/close',
    async ({ params }) => closeTaxFilingPeriodCtrl({ id: params.id }),
    {
      beforeHandle: canCloseTaxFilingPeriod,
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
      beforeHandle: canMarkTaxItemReadyForFiling,
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
      beforeHandle: canMarkTaxItemFiled,
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
      beforeHandle: canExcludeTaxItemFromFiling,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
          expectedMtnCedis?: number | string;
          expectedTelecelCedis?: number | string;
          expectedAirtelCedis?: number | string;
          countedCashCedis: number | string;
          countedMtnCedis?: number | string;
          countedTelecelCedis?: number | string;
          countedAirtelCedis?: number | string;
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
        expectedMtnCedis?: number | string;
        expectedTelecelCedis?: number | string;
        expectedAirtelCedis?: number | string;
        countedCashCedis: number | string;
        countedMtnCedis?: number | string;
        countedTelecelCedis?: number | string;
        countedAirtelCedis?: number | string;
        notes?: string | null;
        createdBy: string;
      }),
    {
      beforeHandle: canCreateDailyCashConfirmation,
      body: t.Object({
        companyId: t.String(),
        branchId: t.String(),
        locationId: t.Optional(t.Union([t.String(), t.Null()])),
        cashierUserId: t.Optional(t.Union([t.String(), t.Null()])),
        accountantUserId: t.Optional(t.Union([t.String(), t.Null()])),
        confirmationDate: t.String({ format: 'date-time' }),
        expectedCashCedis: t.Union([t.Number(), t.String()]),
        expectedMtnCedis: t.Optional(t.Union([t.Number(), t.String()])),
        expectedTelecelCedis: t.Optional(t.Union([t.Number(), t.String()])),
        expectedAirtelCedis: t.Optional(t.Union([t.Number(), t.String()])),
        countedCashCedis: t.Union([t.Number(), t.String()]),
        countedMtnCedis: t.Optional(t.Union([t.Number(), t.String()])),
        countedTelecelCedis: t.Optional(t.Union([t.Number(), t.String()])),
        countedAirtelCedis: t.Optional(t.Union([t.Number(), t.String()])),
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
      beforeHandle: canConfirmDailyCashConfirmation,
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
      beforeHandle: canPostDailyCashConfirmation,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canCreateExpenseRequest,
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
      beforeHandle: canSubmitExpenseRequest,
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
      beforeHandle: canApproveExpenseRequest,
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
      beforeHandle: canRejectExpenseRequest,
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
      beforeHandle: canPayExpenseRequest,
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
      beforeHandle: canPostExpenseRequest,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: canReadAccounting,
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
      beforeHandle: [requirePermissions(PermissionKeys.CanComputeTaxes)],
      body: t.Object({ principalCedis: t.Union([t.Number(), t.String()]) }),
      detail: {
        tags: ['Accounting'],
        summary: 'Compute Ghana taxes on principal (inclusive), in cedis',
      },
    },
  );
