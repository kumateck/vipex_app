import { db } from '@/db/config';
import {
  ApprovalStatus,
  AccountClass,
  CashConfirmationStatus,
  ExpenseFundingSource,
  ExpenseRequestStatus,
  JournalSourceType,
  TaxFilingPeriodStatus,
  TaxFilingStatus,
} from '@/db/schemas/enums';
import { BadRequest, Conflict, Forbidden, NotFound } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';
import { recordAuditLog } from '../audit/logger';
import {
  createAccountRepo,
  createApprovalPolicyRepo,
  createCompanyBankAccountRepo,
  createDailyCashConfirmationRepo,
  createExpenseCategoryRepo,
  createExpenseRequestRepo,
  createManualJournalEntryLinesRepo,
  createManualJournalEntryRepo,
  createServiceChargeRepo,
  createTaxComponentRepo,
  createTaxProfileRepo,
  createTaxFilingAuditLogRepo,
  createTaxFilingPeriodRepo,
  createTaxJournalItemRepo,
  deleteAccountRepo,
  deleteApprovalPolicyRepo,
  deleteCompanyBankAccountRepo,
  deleteExpenseCategoryRepo,
  deleteTaxComponentRepo,
  deleteTaxProfileRepo,
  getAccountByCodeRepo,
  getAccountRepo,
  getAccountUsageSummaryRepo,
  getApprovalPolicyRepo,
  getCompanyAccountingSettingsRepo,
  getCompanyBankAccountRepo,
  getCompanyBankAccountRepoById,
  getCompanyBankAccountUsageSummaryRepo,
  getDailyCashConfirmationRepo,
  getDailyCashExpectedSummaryRepo,
  getDailyCashSessionSummaryRepo,
  getExpenseCategoryRepo,
  getExpenseCategoryByAccountRepo,
  getExpenseCategoryUsageSummaryRepo,
  getExpenseRequestRepo,
  getManualJournalEntryRepo,
  getServiceChargeRepo,
  getPettyCashFundByBranchRepo,
  getTaxComponentRepo,
  getTaxComponentUsageSummaryRepo,
  getTaxFilingPeriodRepo,
  getTaxJournalItemRepo,
  getTaxProfileRepo,
  getTaxProfileUsageSummaryRepo,
  listAccountsRepo,
  listApprovalPoliciesRepo,
  listCompanyBankAccountsRepo,
  listDailyCashConfirmationsRepo,
  listExpenseCategoriesByAccountRepo,
  listExpenseCategoriesRepo,
  listExpenseRequestsRepo,
  listManualJournalEntryLinesRepo,
  listPendingManualJournalEntriesRepo,
  listServiceChargesRepo,
  listJournalLinesForReportingRepo,
  listTaxComponentsRepo,
  listTaxFilingPeriodsRepo,
  listTaxJournalItemsRepo,
  listTaxProfilesRepo,
  updateApprovalPolicyRepo,
  updateServiceChargeRepo,
  updateTaxFilingPeriodRepo,
  updateTaxJournalItemRepo,
  updateAccountRepo,
  updateCompanyBankAccountRepo,
  updateTaxComponentRepo,
  updateDailyCashConfirmationRepo,
  updateExpenseCategoryRepo,
  updateExpenseRequestRepo,
  updateManualJournalEntryRepo,
  updateTaxProfileRepo,
} from './repository';
import { type JournalLineInput, postJournalEntrySvc } from './posting.service';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function readErrorCode(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== 'object' || depth > 6) return null;
  const obj = value as { code?: unknown; cause?: unknown };
  if (typeof obj.code === 'string' && obj.code.length > 0) return obj.code;
  return readErrorCode(obj.cause, depth + 1);
}

function isMissingSchemaError(error: unknown) {
  const code = readErrorCode(error);
  return code === '42P01' || code === '42703';
}

function toPsw(value: number | string) {
  return Number(toPesewas(value));
}

function buildAccountAuditPayload(row: {
  id: string;
  companyId: string;
  code: string;
  name: string;
  label?: string | null;
  accountClass: number;
  parentAccountId?: string | null;
  isPostable: boolean;
  active: boolean;
}) {
  return {
    id: row.id,
    companyId: row.companyId,
    code: row.code,
    name: row.name,
    label: row.label ?? null,
    accountClass: row.accountClass,
    parentAccountId: row.parentAccountId ?? null,
    isPostable: row.isPostable,
    active: row.active,
  };
}

function resolveAccountLabel(label: string | null | undefined, name: string) {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : name;
}

function supportsLinkedExpenseCategory(accountClass: number, isPostable: boolean) {
  return accountClass === AccountClass.EXPENSE && isPostable;
}

async function syncLinkedExpenseCategoryForAccount(input: {
  companyId: string;
  account: {
    id: string;
    code: string;
    name: string;
    label?: string | null;
    accountClass: number;
    isPostable: boolean;
    active: boolean;
  };
  actorUserId?: string | null;
  executor: DbExecutor;
}) {
  if (!supportsLinkedExpenseCategory(input.account.accountClass, input.account.isPostable)) {
    return;
  }

  const code = input.account.code.trim();
  const name = resolveAccountLabel(input.account.label, input.account.name);
  const existing = await getExpenseCategoryByAccountRepo(
    input.companyId,
    input.account.id,
    input.executor,
  );

  if (existing) {
    await updateExpenseCategoryRepo(
      existing.id,
      {
        code,
        name,
        accountId: input.account.id,
        active: input.account.active,
      },
      input.executor,
    );
    return;
  }

  await createExpenseCategoryRepo(
    {
      companyId: input.companyId,
      code,
      name,
      accountId: input.account.id,
      active: input.account.active,
      createdBy: input.actorUserId ?? null,
    },
    input.executor,
  );
}

export async function isAccountingEnabledForCompanySvc(
  companyId: string,
  executor: DbExecutor = db,
) {
  try {
    const company = await getCompanyAccountingSettingsRepo(companyId, executor);
    return Boolean(company?.useAccounting);
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    // Backward compatibility for databases that do not yet have the module-flag column/table shape.
    return true;
  }
}

export async function assertAccountingEnabledSvc(companyId: string, executor: DbExecutor = db) {
  if (!(await isAccountingEnabledForCompanySvc(companyId, executor))) {
    throw Forbidden('Accounting module is disabled for this company');
  }
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

export async function createAccountSvc(input: {
  companyId: string;
  code: string;
  name: string;
  label?: string | null;
  accountClass: number;
  parentAccountId?: string | null;
  isPostable?: boolean;
  active?: boolean;
  createdBy?: string | null;
}) {
  const code = input.code.trim();
  const name = input.name.trim();
  const label = input.label?.trim() || null;
  if (!code || !name) throw BadRequest('Account code and name are required');

  if (input.parentAccountId) {
    const parent = await getAccountRepo(input.companyId, input.parentAccountId);
    if (!parent) throw NotFound('Parent account not found');
  }

  const created = await db.transaction(async (tx) => {
    const inserted = await createAccountRepo(
      {
        companyId: input.companyId,
        code,
        name,
        label,
        accountClass: input.accountClass,
        parentAccountId: input.parentAccountId ?? null,
        isPostable: input.isPostable ?? true,
        active: input.active ?? true,
        createdBy: input.createdBy ?? null,
      },
      tx,
    );
    if (!inserted) return null;

    const createdAccount = await getAccountRepo(input.companyId, inserted.id, tx);
    if (!createdAccount) return null;

    await syncLinkedExpenseCategoryForAccount({
      companyId: input.companyId,
      account: createdAccount,
      actorUserId: input.createdBy ?? null,
      executor: tx,
    });

    return inserted;
  });

  if (!created) throw NotFound('Failed to create account');
  const after = await getAccountRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy ?? null,
    entityType: 'accounting_account',
    entityId: created.id,
    action: 'ACCOUNTING_ACCOUNT_CREATED',
    message: 'Accounting account created',
    metadata: {
      after: after ? buildAccountAuditPayload(after) : null,
    },
  });
  return { id: created.id };
}

function describeAccountUsage(usage: {
  journalLineCount: number;
  expenseCategoryCount: number;
  bankAccountCount: number;
  pettyCashFundCount: number;
  childAccountCount: number;
}) {
  const parts: string[] = [];
  if (usage.journalLineCount > 0) parts.push(`${usage.journalLineCount} journal entries`);
  if (usage.expenseCategoryCount > 0)
    parts.push(`${usage.expenseCategoryCount} expense categories`);
  if (usage.bankAccountCount > 0) parts.push(`${usage.bankAccountCount} bank accounts`);
  if (usage.pettyCashFundCount > 0) parts.push(`${usage.pettyCashFundCount} petty cash funds`);
  if (usage.childAccountCount > 0) parts.push(`${usage.childAccountCount} child accounts`);
  return parts.join(', ');
}

export async function updateAccountSvc(input: {
  companyId: string;
  id: string;
  code?: string;
  name?: string;
  label?: string | null;
  accountClass?: number;
  parentAccountId?: string | null;
  isPostable?: boolean;
  active?: boolean;
  syncLinkedCategory?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getAccountRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Account not found');
  if (input.code !== undefined && !input.code.trim()) throw BadRequest('Account code is required');
  if (input.name !== undefined && !input.name.trim()) throw BadRequest('Account name is required');

  if (input.parentAccountId) {
    if (input.parentAccountId === input.id) {
      throw Conflict('An account cannot be its own parent');
    }
    const parent = await getAccountRepo(input.companyId, input.parentAccountId);
    if (!parent) throw NotFound('Parent account not found');
  }

  const usage = await getAccountUsageSummaryRepo(input.companyId, input.id);
  const usageText = describeAccountUsage(usage);
  if (input.active === false && usageText) {
    throw Conflict(`Account cannot be deactivated because it is in use by ${usageText}`);
  }
  if (
    input.accountClass !== undefined &&
    input.accountClass !== existing.accountClass &&
    usage.journalLineCount > 0
  ) {
    throw Conflict('Account class cannot be changed after the account has journal activity');
  }
  if (
    input.isPostable === false &&
    (usage.journalLineCount > 0 ||
      usage.expenseCategoryCount > 0 ||
      usage.bankAccountCount > 0 ||
      usage.pettyCashFundCount > 0)
  ) {
    throw Conflict('Account cannot be converted to summary while it is actively referenced');
  }

  const nextAccount = {
    code: input.code?.trim() || existing.code,
    name: input.name?.trim() || existing.name,
    label: input.label !== undefined ? input.label?.trim() || null : (existing.label ?? null),
    accountClass: input.accountClass ?? existing.accountClass,
    parentAccountId:
      input.parentAccountId !== undefined ? input.parentAccountId : existing.parentAccountId,
    isPostable: input.isPostable ?? existing.isPostable,
    active: input.active ?? existing.active,
  };

  const updated = await db.transaction(async (tx) => {
    const row = await updateAccountRepo(input.id, nextAccount, tx);
    if (!row) return null;

    if (input.syncLinkedCategory) {
      await syncLinkedExpenseCategoryForAccount({
        companyId: input.companyId,
        account: { id: input.id, ...nextAccount },
        actorUserId: input.actorUserId ?? null,
        executor: tx,
      });
    }

    return row;
  });

  if (!updated) throw NotFound('Account not found');
  const after = await getAccountRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'accounting_account',
    entityId: input.id,
    action: 'ACCOUNTING_ACCOUNT_UPDATED',
    message: 'Accounting account updated',
    metadata: {
      before: buildAccountAuditPayload(existing),
      patch: {
        code: input.code,
        name: input.name,
        label: input.label,
        accountClass: input.accountClass,
        parentAccountId: input.parentAccountId,
        isPostable: input.isPostable,
        active: input.active,
        syncLinkedCategory: input.syncLinkedCategory,
      },
      after: after ? buildAccountAuditPayload(after) : null,
    },
  });
  return { id: updated.id };
}

export async function deleteAccountSvc(input: {
  companyId: string;
  id: string;
  removeLinkedCategory?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getAccountRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Account not found');

  const deleted = await db.transaction(async (tx) => {
    if (input.removeLinkedCategory) {
      const linkedCategories = await listExpenseCategoriesByAccountRepo(
        input.companyId,
        input.id,
        tx,
      );
      for (const linkedCategory of linkedCategories) {
        const categoryUsage = await getExpenseCategoryUsageSummaryRepo(
          input.companyId,
          linkedCategory.id,
          tx,
        );
        if (categoryUsage.totalRequestCount > 0) {
          throw Conflict(
            'Linked expense category cannot be deleted because it is already used by expense requests',
          );
        }

        const removed = await deleteExpenseCategoryRepo(input.companyId, linkedCategory.id, tx);
        if (!removed) {
          throw Conflict('Failed to delete linked expense category');
        }
      }
    }

    const usage = await getAccountUsageSummaryRepo(input.companyId, input.id, tx);
    const usageText = describeAccountUsage(usage);
    if (usageText) {
      throw Conflict(`Account cannot be deleted because it is in use by ${usageText}`);
    }

    const row = await deleteAccountRepo(input.companyId, input.id, tx);
    if (!row) throw NotFound('Account not found');
    return row;
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'accounting_account',
    entityId: input.id,
    action: 'ACCOUNTING_ACCOUNT_DELETED',
    message: 'Accounting account deleted',
    metadata: {
      before: buildAccountAuditPayload(existing),
      removeLinkedCategory: Boolean(input.removeLinkedCategory),
    },
  });

  return { id: deleted.id };
}

export async function listExpenseCategoriesSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listExpenseCategoriesRepo(input);
}

export async function createExpenseCategorySvc(input: {
  companyId: string;
  code: string;
  name: string;
  accountId: string;
  active?: boolean;
  createdBy?: string | null;
}) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code || !name || !input.accountId) {
    throw BadRequest('Expense category code, name, and account are required');
  }

  const account = await getAccountRepo(input.companyId, input.accountId);
  if (!account) throw NotFound('Mapped account not found');

  const created = await createExpenseCategoryRepo({
    companyId: input.companyId,
    code,
    name,
    accountId: input.accountId,
    active: input.active ?? true,
    createdBy: input.createdBy ?? null,
  });

  if (!created) throw NotFound('Failed to create expense category');
  const after = await getExpenseCategoryRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy ?? null,
    entityType: 'expense_category',
    entityId: created.id,
    action: 'EXPENSE_CATEGORY_CREATED',
    message: 'Expense category created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateExpenseCategorySvc(input: {
  companyId: string;
  id: string;
  code?: string;
  name?: string;
  accountId?: string;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getExpenseCategoryRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Expense category not found');
  if (input.code !== undefined && !input.code.trim()) {
    throw BadRequest('Expense category code is required');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw BadRequest('Expense category name is required');
  }

  const nextAccountId = input.accountId ?? existing.accountId;
  const account = await getAccountRepo(input.companyId, nextAccountId);
  if (!account) throw NotFound('Mapped account not found');
  const usage = await getExpenseCategoryUsageSummaryRepo(input.companyId, input.id);
  if (input.active === false && usage.openRequestCount > 0) {
    throw Conflict('Expense category cannot be deactivated while requests are still open');
  }
  if (
    input.accountId !== undefined &&
    input.accountId !== existing.accountId &&
    usage.postedRequestCount > 0
  ) {
    throw Conflict('Mapped account cannot be changed after posted expense requests exist');
  }

  const updated = await updateExpenseCategoryRepo(input.id, {
    code: input.code !== undefined ? input.code.trim() : undefined,
    name: input.name?.trim() || existing.name,
    accountId: nextAccountId,
    active: input.active ?? existing.active,
  });

  if (!updated) throw NotFound('Expense category not found');
  const after = await getExpenseCategoryRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'expense_category',
    entityId: input.id,
    action: 'EXPENSE_CATEGORY_UPDATED',
    message: 'Expense category updated',
    metadata: {
      before: existing,
      patch: {
        code: input.code,
        name: input.name,
        accountId: input.accountId,
        active: input.active,
      },
      after,
    },
  });
  return { id: updated.id };
}

export async function deleteExpenseCategorySvc(input: {
  companyId: string;
  id: string;
  actorUserId?: string | null;
}) {
  const existing = await getExpenseCategoryRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Expense category not found');

  const usage = await getExpenseCategoryUsageSummaryRepo(input.companyId, input.id);
  if (usage.totalRequestCount > 0) {
    throw Conflict(
      'Expense category cannot be deleted because it is already used by expense requests',
    );
  }

  const deleted = await deleteExpenseCategoryRepo(input.companyId, input.id);
  if (!deleted) throw NotFound('Expense category not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'expense_category',
    entityId: input.id,
    action: 'EXPENSE_CATEGORY_DELETED',
    message: 'Expense category deleted',
    metadata: { before: existing },
  });

  return { id: deleted.id };
}

export async function listApprovalPoliciesSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listApprovalPoliciesRepo(input);
}

const MANUAL_ENTRY_POLICY_CODES = new Set([
  'MANUAL_JOURNAL',
  'MANUAL_JOURNAL_ENTRY',
  'MANUAL_ENTRY',
]);

function isManualJournalPolicyCode(policyCode: string) {
  return MANUAL_ENTRY_POLICY_CODES.has(policyCode.trim().toUpperCase());
}

export type ManualJournalApprovalPolicy = {
  policyCode: string | null;
  amountLimitPsw: number;
  requiresApprovalAboveThreshold: boolean;
  autoAuthorizeBelowThreshold: boolean;
  configured: boolean;
};

export async function getManualJournalApprovalPolicySvc(input: { companyId: string }) {
  const policies = await listApprovalPoliciesRepo({ companyId: input.companyId, active: true });
  const matched = policies.find((policy) =>
    MANUAL_ENTRY_POLICY_CODES.has(policy.policyCode.trim().toUpperCase()),
  );
  if (!matched) {
    return {
      policyCode: null,
      amountLimitPsw: Number.MAX_SAFE_INTEGER,
      requiresApprovalAboveThreshold: false,
      autoAuthorizeBelowThreshold: true,
      configured: false,
    } satisfies ManualJournalApprovalPolicy;
  }

  return {
    policyCode: matched.policyCode,
    amountLimitPsw: Number(matched.amountLimitPsw ?? 0),
    requiresApprovalAboveThreshold: Boolean(matched.requiresHeadOfficeApproval),
    autoAuthorizeBelowThreshold: Boolean(matched.autoAuthorizeBelowThreshold ?? true),
    configured: true,
  } satisfies ManualJournalApprovalPolicy;
}

export async function postManualJournalEntrySvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  locationId?: string | null;
  memo?: string | null;
  entryDate?: string | null;
  lines: JournalLineInput[];
}) {
  const totalDebitPsw = input.lines.reduce((sum, line) => sum + Number(line.debitPsw ?? 0), 0);
  const totalCreditPsw = input.lines.reduce((sum, line) => sum + Number(line.creditPsw ?? 0), 0);
  const policy = await getManualJournalApprovalPolicySvc({ companyId: input.companyId });
  const exceedsThreshold = totalDebitPsw > policy.amountLimitPsw;
  const shouldQueue = exceedsThreshold || !policy.autoAuthorizeBelowThreshold;

  if (shouldQueue) {
    const created = await db.transaction(async (tx) => {
      const manualEntry = await createManualJournalEntryRepo(
        {
          companyId: input.companyId,
          policyCode: policy.policyCode,
          thresholdPsw: policy.amountLimitPsw,
          totalDebitPsw,
          totalCreditPsw,
          status: ApprovalStatus.PENDING,
          branchId: input.branchId ?? null,
          locationId: input.locationId ?? null,
          memo: input.memo ?? null,
          entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
          recordedByUserId: input.actorUserId,
        },
        tx,
      );
      if (!manualEntry) throw NotFound('Failed to queue manual journal entry for approval');

      await createManualJournalEntryLinesRepo(
        input.lines.map((line, index) => ({
          companyId: input.companyId,
          manualEntryId: manualEntry.id,
          accountId: line.accountId,
          branchId: line.branchId ?? input.branchId ?? null,
          locationId: line.locationId ?? input.locationId ?? null,
          debitPsw: Number(line.debitPsw ?? 0),
          creditPsw: Number(line.creditPsw ?? 0),
          description: line.description ?? null,
          sortOrder: index,
        })),
        tx,
      );
      return manualEntry;
    });

    await recordAuditLog({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      entityType: 'manual_journal_entry',
      entityId: created.id,
      action: exceedsThreshold
        ? 'MANUAL_JOURNAL_ENTRY_QUEUED_OVER_THRESHOLD'
        : 'MANUAL_JOURNAL_ENTRY_QUEUED_AUTO_AUTHORIZE_DISABLED',
      message: exceedsThreshold
        ? 'Manual journal entry queued because it exceeded threshold'
        : 'Manual journal entry queued because auto-authorize is disabled',
      metadata: {
        totalDebitPsw,
        totalCreditPsw,
        threshold: {
          policyCode: policy.policyCode,
          amountLimitPsw: policy.amountLimitPsw,
          requiresApprovalAboveThreshold: policy.requiresApprovalAboveThreshold,
          autoAuthorizeBelowThreshold: policy.autoAuthorizeBelowThreshold,
          configured: policy.configured,
        },
        lineCount: input.lines.length,
      },
    });

    return {
      batchId: null,
      entryId: null,
      manualEntryId: created.id,
      approvalMode: 'pending_approval',
      thresholdPsw: policy.amountLimitPsw,
      policyConfigured: policy.configured,
      policyCode: policy.policyCode,
    } as const;
  }

  const posted = await postJournalEntrySvc({
    companyId: input.companyId,
    sourceType: JournalSourceType.MANUAL,
    sourceId: null,
    entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
    memo: input.memo ?? null,
    branchId: input.branchId ?? null,
    locationId: input.locationId ?? null,
    recordedByUserId: input.actorUserId,
    approvedByUserId: input.actorUserId,
    postedBy: input.actorUserId,
    lines: input.lines,
  });

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'manual_journal_entry',
    entityId: posted.entryId,
    action: 'MANUAL_JOURNAL_ENTRY_AUTO_AUTHORIZED_AND_POSTED',
    message: 'Manual journal entry auto-authorized and posted',
    metadata: {
      batchId: posted.batchId,
      entryId: posted.entryId,
      totalDebitPsw,
      totalCreditPsw,
      threshold: {
        policyCode: policy.policyCode,
        amountLimitPsw: policy.amountLimitPsw,
        requiresApprovalAboveThreshold: policy.requiresApprovalAboveThreshold,
        autoAuthorizeBelowThreshold: policy.autoAuthorizeBelowThreshold,
        configured: policy.configured,
      },
      lineCount: input.lines.length,
    },
  });

  return {
    ...posted,
    manualEntryId: null,
    approvalMode: 'auto_authorized',
    thresholdPsw: policy.amountLimitPsw,
    policyConfigured: policy.configured,
    policyCode: policy.policyCode,
  } as const;
}

export async function listPendingManualJournalEntriesSvc(input: { companyId: string }) {
  return listPendingManualJournalEntriesRepo({ companyId: input.companyId });
}

export async function approveAndPostManualJournalEntrySvc(input: {
  companyId: string;
  manualEntryId: string;
  actorUserId: string;
  approvalReason?: string | null;
}) {
  const manualEntry = await getManualJournalEntryRepo({
    companyId: input.companyId,
    id: input.manualEntryId,
  });
  if (!manualEntry) throw NotFound('Manual journal entry not found');
  if (manualEntry.status !== ApprovalStatus.PENDING) {
    throw Conflict('Manual journal entry is not pending approval');
  }

  const lines = await listManualJournalEntryLinesRepo({
    companyId: input.companyId,
    manualEntryId: input.manualEntryId,
  });
  if (lines.length < 2) throw BadRequest('Pending manual journal entry has no valid lines');

  const posted = await postJournalEntrySvc({
    companyId: input.companyId,
    sourceType: JournalSourceType.MANUAL,
    sourceId: manualEntry.id,
    entryDate: manualEntry.entryDate ?? new Date(),
    memo: manualEntry.memo ?? null,
    branchId: manualEntry.branchId ?? null,
    locationId: manualEntry.locationId ?? null,
    recordedByUserId: manualEntry.recordedByUserId ?? null,
    approvedByUserId: input.actorUserId,
    postedBy: input.actorUserId,
    lines: lines.map((line) => ({
      accountId: line.accountId,
      debitPsw: Number(line.debitPsw ?? 0),
      creditPsw: Number(line.creditPsw ?? 0),
      branchId: line.branchId ?? null,
      locationId: line.locationId ?? null,
      description: line.description ?? null,
      metadata: { queuedManualEntryId: manualEntry.id },
    })),
  });

  const updated = await updateManualJournalEntryRepo({
    id: manualEntry.id,
    patch: {
      status: ApprovalStatus.APPROVED,
      approvedByUserId: input.actorUserId,
      approvalReason: input.approvalReason?.trim() || null,
      postedBatchId: posted.batchId,
      postedEntryId: posted.entryId,
      rejectionReason: null,
    },
  });
  if (!updated) throw NotFound('Manual journal entry not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'manual_journal_entry',
    entityId: manualEntry.id,
    action: 'MANUAL_JOURNAL_ENTRY_APPROVED_AND_POSTED',
    message: 'Manual journal entry approved and posted from approval queue',
    metadata: {
      postedBatchId: posted.batchId,
      postedEntryId: posted.entryId,
      approvalReason: input.approvalReason?.trim() || null,
      totalDebitPsw: Number(manualEntry.totalDebitPsw ?? 0),
      totalCreditPsw: Number(manualEntry.totalCreditPsw ?? 0),
      policyCode: manualEntry.policyCode,
      thresholdPsw: Number(manualEntry.thresholdPsw ?? 0),
    },
  });

  return {
    id: manualEntry.id,
    status: ApprovalStatus.APPROVED,
    postedBatchId: posted.batchId,
    postedEntryId: posted.entryId,
  };
}

export async function rejectManualJournalEntrySvc(input: {
  companyId: string;
  manualEntryId: string;
  actorUserId: string;
  rejectionReason: string;
}) {
  const manualEntry = await getManualJournalEntryRepo({
    companyId: input.companyId,
    id: input.manualEntryId,
  });
  if (!manualEntry) throw NotFound('Manual journal entry not found');
  if (manualEntry.status !== ApprovalStatus.PENDING) {
    throw Conflict('Manual journal entry is not pending approval');
  }

  const rejectionReason = input.rejectionReason.trim();
  if (!rejectionReason) throw BadRequest('Rejection reason is required');

  const updated = await updateManualJournalEntryRepo({
    id: manualEntry.id,
    patch: {
      status: ApprovalStatus.REJECTED,
      approvedByUserId: input.actorUserId,
      rejectionReason,
      approvalReason: null,
    },
  });
  if (!updated) throw NotFound('Manual journal entry not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'manual_journal_entry',
    entityId: manualEntry.id,
    action: 'MANUAL_JOURNAL_ENTRY_REJECTED',
    message: 'Manual journal entry rejected from approval queue',
    metadata: {
      rejectionReason,
      totalDebitPsw: Number(manualEntry.totalDebitPsw ?? 0),
      totalCreditPsw: Number(manualEntry.totalCreditPsw ?? 0),
      policyCode: manualEntry.policyCode,
      thresholdPsw: Number(manualEntry.thresholdPsw ?? 0),
    },
  });

  return { id: manualEntry.id, status: ApprovalStatus.REJECTED };
}

export async function listServiceChargesSvc(input: { companyId: string; active?: boolean | null }) {
  return listServiceChargesRepo(input);
}

export async function createServiceChargeSvc(input: {
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
  createdBy?: string | null;
}) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code || !name) throw BadRequest('Service charge code and name are required');
  if (!Number.isFinite(input.amountPsw) || input.amountPsw < 0) {
    throw BadRequest('Service charge amount must be a non-negative number');
  }
  if (input.payableAccountId) {
    const account = await getAccountRepo(input.companyId, input.payableAccountId);
    if (!account) throw NotFound('Linked payable account not found');
  }

  const created = await createServiceChargeRepo({
    companyId: input.companyId,
    code,
    name,
    description: input.description?.trim() || null,
    amountPsw: Math.round(input.amountPsw),
    taxable: input.taxable ?? false,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    payableAccountId: input.payableAccountId ?? null,
    effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
    effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
    createdBy: input.createdBy ?? null,
  });

  if (!created) throw NotFound('Failed to create service charge');
  const after = await getServiceChargeRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy ?? null,
    entityType: 'service_charge',
    entityId: created.id,
    action: 'SERVICE_CHARGE_CREATED',
    message: 'Service charge created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateServiceChargeSvc(input: {
  companyId: string;
  id: string;
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
  actorUserId?: string | null;
}) {
  const existing = await getServiceChargeRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Service charge not found');
  if (input.code !== undefined && !input.code.trim()) {
    throw BadRequest('Service charge code is required');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw BadRequest('Service charge name is required');
  }
  if (
    input.amountPsw !== undefined &&
    (!Number.isFinite(input.amountPsw) || Number(input.amountPsw) < 0)
  ) {
    throw BadRequest('Service charge amount must be a non-negative number');
  }

  const nextPayableAccountId =
    input.payableAccountId !== undefined ? input.payableAccountId : existing.payableAccountId;
  if (nextPayableAccountId) {
    const account = await getAccountRepo(input.companyId, nextPayableAccountId);
    if (!account) throw NotFound('Linked payable account not found');
  }

  const updated = await updateServiceChargeRepo(input.id, {
    code: input.code?.trim() || existing.code,
    name: input.name?.trim() || existing.name,
    description:
      input.description !== undefined ? input.description?.trim() || null : existing.description,
    amountPsw:
      input.amountPsw !== undefined ? Math.round(input.amountPsw) : Number(existing.amountPsw),
    taxable: input.taxable ?? existing.taxable,
    active: input.active ?? existing.active,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    payableAccountId: nextPayableAccountId ?? null,
    effectiveFrom:
      input.effectiveFrom !== undefined
        ? input.effectiveFrom
          ? new Date(input.effectiveFrom)
          : existing.effectiveFrom
        : existing.effectiveFrom,
    effectiveTo:
      input.effectiveTo !== undefined
        ? input.effectiveTo
          ? new Date(input.effectiveTo)
          : null
        : existing.effectiveTo,
  });
  if (!updated) throw NotFound('Service charge not found');
  const after = await getServiceChargeRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'service_charge',
    entityId: input.id,
    action: 'SERVICE_CHARGE_UPDATED',
    message: 'Service charge updated',
    metadata: {
      before: existing,
      patch: {
        code: input.code,
        name: input.name,
        description: input.description,
        amountPsw: input.amountPsw,
        taxable: input.taxable,
        active: input.active,
        sortOrder: input.sortOrder,
        payableAccountId: input.payableAccountId,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
      },
      after,
    },
  });
  return { id: updated.id };
}

export async function createApprovalPolicySvc(input: {
  companyId: string;
  policyCode: string;
  name: string;
  amountLimitPsw?: number;
  autoAuthorizeBelowThreshold?: boolean;
  requiresHeadOfficeApproval?: boolean;
  appliesToFundingSource?: number | null;
  active?: boolean;
  createdBy?: string | null;
}) {
  const policyCode = input.policyCode.trim();
  const name = input.name.trim();
  if (!policyCode || !name) throw BadRequest('Policy code and name are required');
  const isManualPolicy = isManualJournalPolicyCode(policyCode);

  const created = await createApprovalPolicyRepo({
    companyId: input.companyId,
    policyCode,
    name,
    amountLimitPsw: Number(input.amountLimitPsw ?? 0),
    autoAuthorizeBelowThreshold: input.autoAuthorizeBelowThreshold ?? true,
    requiresHeadOfficeApproval: input.requiresHeadOfficeApproval ?? false,
    appliesToFundingSource: isManualPolicy ? null : (input.appliesToFundingSource ?? null),
    active: input.active ?? true,
    createdBy: input.createdBy ?? null,
  });

  if (!created) throw NotFound('Failed to create approval policy');
  const after = await getApprovalPolicyRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy ?? null,
    entityType: 'accounting_approval_policy',
    entityId: created.id,
    action: 'ACCOUNTING_APPROVAL_POLICY_CREATED',
    message: 'Accounting approval policy created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateApprovalPolicySvc(input: {
  companyId: string;
  id: string;
  policyCode?: string;
  name?: string;
  amountLimitPsw?: number;
  autoAuthorizeBelowThreshold?: boolean;
  requiresHeadOfficeApproval?: boolean;
  appliesToFundingSource?: number | null;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getApprovalPolicyRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Approval policy not found');
  if (input.policyCode !== undefined && !input.policyCode.trim()) {
    throw BadRequest('Policy code is required');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw BadRequest('Policy name is required');
  }
  const nextPolicyCode = input.policyCode?.trim() || existing.policyCode;
  const isManualPolicy = isManualJournalPolicyCode(nextPolicyCode);

  const updated = await updateApprovalPolicyRepo(input.id, {
    policyCode: nextPolicyCode,
    name: input.name?.trim() || existing.name,
    amountLimitPsw: Number(input.amountLimitPsw ?? existing.amountLimitPsw),
    autoAuthorizeBelowThreshold:
      input.autoAuthorizeBelowThreshold ?? existing.autoAuthorizeBelowThreshold,
    requiresHeadOfficeApproval:
      input.requiresHeadOfficeApproval ?? existing.requiresHeadOfficeApproval,
    appliesToFundingSource: isManualPolicy
      ? null
      : input.appliesToFundingSource !== undefined
        ? input.appliesToFundingSource
        : existing.appliesToFundingSource,
    active: input.active ?? existing.active,
  });

  if (!updated) throw NotFound('Approval policy not found');
  const after = await getApprovalPolicyRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'accounting_approval_policy',
    entityId: input.id,
    action: 'ACCOUNTING_APPROVAL_POLICY_UPDATED',
    message: 'Accounting approval policy updated',
    metadata: {
      before: existing,
      patch: {
        policyCode: input.policyCode,
        name: input.name,
        amountLimitPsw: input.amountLimitPsw,
        autoAuthorizeBelowThreshold: input.autoAuthorizeBelowThreshold,
        requiresHeadOfficeApproval: input.requiresHeadOfficeApproval,
        appliesToFundingSource: input.appliesToFundingSource,
        active: input.active,
      },
      after,
    },
  });
  return { id: updated.id };
}

export async function deleteApprovalPolicySvc(input: {
  companyId: string;
  id: string;
  actorUserId?: string | null;
}) {
  const existing = await getApprovalPolicyRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Approval policy not found');

  const deleted = await deleteApprovalPolicyRepo(input.companyId, input.id);
  if (!deleted) throw NotFound('Approval policy not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'accounting_approval_policy',
    entityId: input.id,
    action: 'ACCOUNTING_APPROVAL_POLICY_DELETED',
    message: 'Accounting approval policy deleted',
    metadata: { before: existing },
  });

  return { id: deleted.id };
}

export async function listCompanyBankAccountsSvc(input: {
  companyId: string;
  active?: boolean | null;
}) {
  return listCompanyBankAccountsRepo(input);
}

export async function createCompanyBankAccountSvc(input: {
  companyId: string;
  accountId: string;
  name: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNumberMasked?: string | null;
  active?: boolean;
  createdBy?: string | null;
}) {
  const name = input.name.trim();
  if (!name || !input.accountId)
    throw BadRequest('Bank account name and mapped account are required');

  const account = await getAccountRepo(input.companyId, input.accountId);
  if (!account) throw NotFound('Mapped bank ledger account not found');

  const created = await createCompanyBankAccountRepo({
    companyId: input.companyId,
    accountId: input.accountId,
    name,
    bankName: input.bankName?.trim() || null,
    branchName: input.branchName?.trim() || null,
    accountNumberMasked: input.accountNumberMasked?.trim() || null,
    active: input.active ?? true,
    createdBy: input.createdBy ?? null,
  });

  if (!created) throw NotFound('Failed to create company bank account');
  const after = await getCompanyBankAccountRepoById(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy ?? null,
    entityType: 'company_bank_account',
    entityId: created.id,
    action: 'COMPANY_BANK_ACCOUNT_CREATED',
    message: 'Company bank account created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateCompanyBankAccountSvc(input: {
  companyId: string;
  id: string;
  accountId?: string;
  name?: string;
  bankName?: string | null;
  branchName?: string | null;
  accountNumberMasked?: string | null;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getCompanyBankAccountRepoById(input.companyId, input.id);
  if (!existing) throw NotFound('Company bank account not found');
  if (input.name !== undefined && !input.name.trim()) {
    throw BadRequest('Bank account name is required');
  }

  const nextAccountId = input.accountId ?? existing.accountId;
  const account = await getAccountRepo(input.companyId, nextAccountId);
  if (!account) throw NotFound('Mapped bank ledger account not found');
  const usage = await getCompanyBankAccountUsageSummaryRepo(input.companyId, input.id);
  if (input.active === false && usage.openRequestCount > 0) {
    throw Conflict(
      'Company bank account cannot be deactivated while linked expense requests are still open',
    );
  }
  if (
    input.accountId !== undefined &&
    input.accountId !== existing.accountId &&
    usage.postedRequestCount > 0
  ) {
    throw Conflict('Mapped ledger account cannot be changed after posted expense requests exist');
  }

  const updated = await updateCompanyBankAccountRepo(input.id, {
    accountId: nextAccountId,
    name: input.name?.trim() || existing.name,
    bankName: input.bankName !== undefined ? input.bankName?.trim() || null : existing.bankName,
    branchName:
      input.branchName !== undefined ? input.branchName?.trim() || null : existing.branchName,
    accountNumberMasked:
      input.accountNumberMasked !== undefined
        ? input.accountNumberMasked?.trim() || null
        : existing.accountNumberMasked,
    active: input.active ?? existing.active,
  });

  if (!updated) throw NotFound('Company bank account not found');
  const after = await getCompanyBankAccountRepoById(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'company_bank_account',
    entityId: input.id,
    action: 'COMPANY_BANK_ACCOUNT_UPDATED',
    message: 'Company bank account updated',
    metadata: {
      before: existing,
      patch: {
        accountId: input.accountId,
        name: input.name,
        bankName: input.bankName,
        branchName: input.branchName,
        accountNumberMasked: input.accountNumberMasked,
        active: input.active,
      },
      after,
    },
  });
  return { id: updated.id };
}

function describeBankAccountUsage(usage: {
  totalRequestCount: number;
  cashToBankTransferCount: number;
  pettyCashReplenishmentCount: number;
}) {
  const parts: string[] = [];
  if (usage.totalRequestCount > 0) parts.push(`${usage.totalRequestCount} expense requests`);
  if (usage.cashToBankTransferCount > 0)
    parts.push(`${usage.cashToBankTransferCount} cash-to-bank transfers`);
  if (usage.pettyCashReplenishmentCount > 0)
    parts.push(`${usage.pettyCashReplenishmentCount} petty cash replenishments`);
  return parts.join(', ');
}

export async function deleteCompanyBankAccountSvc(input: {
  companyId: string;
  id: string;
  actorUserId?: string | null;
}) {
  const existing = await getCompanyBankAccountRepoById(input.companyId, input.id);
  if (!existing) throw NotFound('Company bank account not found');

  const usage = await getCompanyBankAccountUsageSummaryRepo(input.companyId, input.id);
  const usageText = describeBankAccountUsage(usage);
  if (usageText) {
    throw Conflict(`Company bank account cannot be deleted because it is in use by ${usageText}`);
  }

  const deleted = await deleteCompanyBankAccountRepo(input.companyId, input.id);
  if (!deleted) throw NotFound('Company bank account not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'company_bank_account',
    entityId: input.id,
    action: 'COMPANY_BANK_ACCOUNT_DELETED',
    message: 'Company bank account deleted',
    metadata: { before: existing },
  });

  return { id: deleted.id };
}

export async function listTaxProfilesSvc(input: { companyId: string; active?: boolean | null }) {
  return listTaxProfilesRepo(input);
}

export async function listTaxComponentsSvc(input: {
  companyId: string;
  profileId?: string | null;
  active?: boolean | null;
}) {
  return listTaxComponentsRepo(input);
}

export async function createTaxProfileSvc(input: {
  companyId: string;
  name: string;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw BadRequest('Tax profile name is required');

  const created = await createTaxProfileRepo({
    companyId: input.companyId,
    name,
    active: input.active ?? true,
  });

  if (!created) throw NotFound('Failed to create tax profile');
  const after = await getTaxProfileRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_profile',
    entityId: created.id,
    action: 'TAX_PROFILE_CREATED',
    message: 'Tax profile created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateTaxProfileSvc(input: {
  companyId: string;
  id: string;
  name?: string;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getTaxProfileRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Tax profile not found');
  if (input.name !== undefined && !input.name.trim()) {
    throw BadRequest('Tax profile name is required');
  }

  const usage = await getTaxProfileUsageSummaryRepo(input.companyId, input.id);
  if (
    input.active === false &&
    (usage.compensationCount > 0 || usage.taxJournalItemCount > 0 || usage.taxComponentCount > 0)
  ) {
    throw Conflict(
      'Tax profile cannot be deactivated while it is still referenced by payroll, tax journals, or tax components',
    );
  }

  const updated = await updateTaxProfileRepo(input.id, {
    name: input.name?.trim() || existing.name,
    active: input.active ?? existing.active,
  });

  if (!updated) throw NotFound('Tax profile not found');
  const after = await getTaxProfileRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_profile',
    entityId: input.id,
    action: 'TAX_PROFILE_UPDATED',
    message: 'Tax profile updated',
    metadata: {
      before: existing,
      patch: {
        name: input.name,
        active: input.active,
      },
      after,
    },
  });
  return { id: updated.id };
}

export async function deleteTaxProfileSvc(input: {
  companyId: string;
  id: string;
  actorUserId?: string | null;
}) {
  const existing = await getTaxProfileRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Tax profile not found');

  const usage = await getTaxProfileUsageSummaryRepo(input.companyId, input.id);
  if (usage.compensationCount > 0 || usage.taxJournalItemCount > 0 || usage.taxComponentCount > 0) {
    throw Conflict(
      'Tax profile cannot be deleted while it is still referenced by payroll, tax journals, or tax components',
    );
  }

  const deleted = await deleteTaxProfileRepo(input.companyId, input.id);
  if (!deleted) throw NotFound('Tax profile not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_profile',
    entityId: input.id,
    action: 'TAX_PROFILE_DELETED',
    message: 'Tax profile deleted',
    metadata: { before: existing },
  });

  return { id: deleted.id };
}

export async function createTaxComponentSvc(input: {
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
  actorUserId?: string | null;
}) {
  const key = input.key.trim();
  if (!key) throw BadRequest('Tax component key is required');
  if (!Number.isFinite(input.numerator) || input.numerator < 0) {
    throw BadRequest('Tax component numerator must be a non-negative number');
  }
  if (!Number.isFinite(input.denominator) || input.denominator <= 0) {
    throw BadRequest('Tax component denominator must be greater than zero');
  }
  const profile = await getTaxProfileRepo(input.companyId, input.profileId);
  if (!profile) throw NotFound('Tax profile not found');

  const created = await createTaxComponentRepo({
    profileId: input.profileId,
    key,
    numerator: Number(input.numerator),
    denominator: Number(input.denominator),
    inclusive: input.inclusive ?? true,
    sortOrder: input.sortOrder ?? 0,
    startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    active: input.active ?? true,
  });
  if (!created) throw NotFound('Failed to create tax component');
  const after = await getTaxComponentRepo(input.companyId, created.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_component',
    entityId: created.id,
    action: 'TAX_COMPONENT_CREATED',
    message: 'Tax component created',
    metadata: { after },
  });
  return { id: created.id };
}

export async function updateTaxComponentSvc(input: {
  companyId: string;
  id: string;
  key?: string;
  numerator?: number;
  denominator?: number;
  inclusive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  actorUserId?: string | null;
}) {
  const existing = await getTaxComponentRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Tax component not found');
  if (input.key !== undefined && !input.key.trim()) {
    throw BadRequest('Tax component key is required');
  }
  if (input.numerator !== undefined && (!Number.isFinite(input.numerator) || input.numerator < 0)) {
    throw BadRequest('Tax component numerator must be a non-negative number');
  }
  if (
    input.denominator !== undefined &&
    (!Number.isFinite(input.denominator) || input.denominator <= 0)
  ) {
    throw BadRequest('Tax component denominator must be greater than zero');
  }

  const updated = await updateTaxComponentRepo(input.id, {
    key: input.key?.trim() || existing.key,
    numerator: input.numerator ?? existing.numerator,
    denominator: input.denominator ?? existing.denominator,
    inclusive: input.inclusive ?? existing.inclusive,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    startsAt:
      input.startsAt !== undefined
        ? input.startsAt
          ? new Date(input.startsAt)
          : existing.startsAt
        : existing.startsAt,
    endsAt:
      input.endsAt !== undefined ? (input.endsAt ? new Date(input.endsAt) : null) : existing.endsAt,
    active: input.active ?? existing.active,
  });
  if (!updated) throw NotFound('Tax component not found');
  const after = await getTaxComponentRepo(input.companyId, input.id);
  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_component',
    entityId: input.id,
    action: 'TAX_COMPONENT_UPDATED',
    message: 'Tax component updated',
    metadata: {
      before: existing,
      patch: {
        key: input.key,
        numerator: input.numerator,
        denominator: input.denominator,
        inclusive: input.inclusive,
        sortOrder: input.sortOrder,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        active: input.active,
      },
      after,
    },
  });
  return { id: updated.id };
}

export async function deleteTaxComponentSvc(input: {
  companyId: string;
  id: string;
  actorUserId?: string | null;
}) {
  const existing = await getTaxComponentRepo(input.companyId, input.id);
  if (!existing) throw NotFound('Tax component not found');

  const usage = await getTaxComponentUsageSummaryRepo(input.companyId, input.id);
  if (usage.taxProfileCount === 0) throw NotFound('Tax component not found');

  const deleted = await deleteTaxComponentRepo(input.companyId, input.id);
  if (!deleted) throw NotFound('Tax component not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId ?? null,
    entityType: 'tax_component',
    entityId: input.id,
    action: 'TAX_COMPONENT_DELETED',
    message: 'Tax component deleted',
    metadata: { before: existing },
  });

  return { id: deleted.id };
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
  if (!(await isAccountingEnabledForCompanySvc(input.companyId, executor))) return null;

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
