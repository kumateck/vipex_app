import { and, asc, desc, eq, gte, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  accountingApprovalPolicies,
  chartOfAccounts,
  cashierSessions,
  companies,
  companyModules,
  dailyCashConfirmations,
  branches,
  companyBankAccounts,
  cashToBankTransfers,
  expenseCategories,
  expenseRequests,
  journalBatches,
  journalEntries,
  journalLines,
  manualJournalEntries,
  manualJournalEntryLines,
  locations,
  serviceCharges,
  pettyCashReplenishments,
  pettyCashFunds,
  payments,
  employeeCompensation,
  taxComponents,
  taxFilingAuditLogs,
  taxFilingPeriods,
  taxJournalItems,
  taxProfiles,
  users,
} from '@/db/schemas';
import type { SQL } from 'drizzle-orm';
import { ApprovalStatus, CashierType, PaymentComponent, PaymentMethod } from '@/db/schemas/enums';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

function toDateOnlyParam(value: Date | string) {
  if (typeof value === 'string') return value.length > 10 ? value.slice(0, 10) : value;
  return value.toISOString().slice(0, 10);
}

export async function listAccountsRepo(input: { companyId: string; active?: boolean | null }) {
  const where = [eq(chartOfAccounts.companyId, input.companyId)];
  if (input.active != null) where.push(eq(chartOfAccounts.active, input.active));

  return db
    .select({
      id: chartOfAccounts.id,
      companyId: chartOfAccounts.companyId,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      label: chartOfAccounts.label,
      accountClass: chartOfAccounts.accountClass,
      parentAccountId: chartOfAccounts.parentAccountId,
      isPostable: chartOfAccounts.isPostable,
      active: chartOfAccounts.active,
      createdAt: chartOfAccounts.createdAt,
      updatedAt: chartOfAccounts.updatedAt,
    })
    .from(chartOfAccounts)
    .where(and(...where))
    .orderBy(asc(chartOfAccounts.code), asc(chartOfAccounts.name));
}

export async function listExpenseCategoriesRepo(input: {
  companyId: string;
  active?: boolean | null;
}) {
  const where = [eq(expenseCategories.companyId, input.companyId)];
  if (input.active != null) where.push(eq(expenseCategories.active, input.active));

  return db
    .select({
      id: expenseCategories.id,
      companyId: expenseCategories.companyId,
      code: expenseCategories.code,
      name: expenseCategories.name,
      accountId: expenseCategories.accountId,
      active: expenseCategories.active,
      createdAt: expenseCategories.createdAt,
      updatedAt: expenseCategories.updatedAt,
    })
    .from(expenseCategories)
    .where(and(...where))
    .orderBy(asc(expenseCategories.name));
}

export async function listApprovalPoliciesRepo(input: {
  companyId: string;
  active?: boolean | null;
}) {
  const where = [eq(accountingApprovalPolicies.companyId, input.companyId)];
  if (input.active != null) where.push(eq(accountingApprovalPolicies.active, input.active));

  return db
    .select({
      id: accountingApprovalPolicies.id,
      companyId: accountingApprovalPolicies.companyId,
      policyCode: accountingApprovalPolicies.policyCode,
      name: accountingApprovalPolicies.name,
      amountLimitPsw: accountingApprovalPolicies.amountLimitPsw,
      autoAuthorizeBelowThreshold: accountingApprovalPolicies.autoAuthorizeBelowThreshold,
      requiresHeadOfficeApproval: accountingApprovalPolicies.requiresHeadOfficeApproval,
      appliesToFundingSource: accountingApprovalPolicies.appliesToFundingSource,
      active: accountingApprovalPolicies.active,
      createdAt: accountingApprovalPolicies.createdAt,
      updatedAt: accountingApprovalPolicies.updatedAt,
    })
    .from(accountingApprovalPolicies)
    .where(and(...where))
    .orderBy(asc(accountingApprovalPolicies.policyCode));
}

export async function listServiceChargesRepo(input: {
  companyId: string;
  active?: boolean | null;
}) {
  const where = [eq(serviceCharges.companyId, input.companyId)];
  if (input.active != null) where.push(eq(serviceCharges.active, input.active));

  return db
    .select({
      id: serviceCharges.id,
      companyId: serviceCharges.companyId,
      code: serviceCharges.code,
      name: serviceCharges.name,
      description: serviceCharges.description,
      amountPsw: serviceCharges.amountPsw,
      taxable: serviceCharges.taxable,
      active: serviceCharges.active,
      sortOrder: serviceCharges.sortOrder,
      payableAccountId: serviceCharges.payableAccountId,
      effectiveFrom: serviceCharges.effectiveFrom,
      effectiveTo: serviceCharges.effectiveTo,
      createdAt: serviceCharges.createdAt,
      updatedAt: serviceCharges.updatedAt,
    })
    .from(serviceCharges)
    .where(and(...where))
    .orderBy(asc(serviceCharges.sortOrder), asc(serviceCharges.code), asc(serviceCharges.name));
}

export async function listCompanyBankAccountsRepo(input: {
  companyId: string;
  active?: boolean | null;
}) {
  const where = [eq(companyBankAccounts.companyId, input.companyId)];
  if (input.active != null) where.push(eq(companyBankAccounts.active, input.active));

  return db
    .select({
      id: companyBankAccounts.id,
      companyId: companyBankAccounts.companyId,
      accountId: companyBankAccounts.accountId,
      name: companyBankAccounts.name,
      bankName: companyBankAccounts.bankName,
      branchName: companyBankAccounts.branchName,
      accountNumberMasked: companyBankAccounts.accountNumberMasked,
      active: companyBankAccounts.active,
      createdAt: companyBankAccounts.createdAt,
      updatedAt: companyBankAccounts.updatedAt,
    })
    .from(companyBankAccounts)
    .where(and(...where))
    .orderBy(asc(companyBankAccounts.name));
}

export async function listTaxProfilesRepo(input: { companyId: string; active?: boolean | null }) {
  const where = [eq(taxProfiles.companyId, input.companyId)];
  if (input.active != null) where.push(eq(taxProfiles.active, input.active));

  return db
    .select({
      id: taxProfiles.id,
      companyId: taxProfiles.companyId,
      name: taxProfiles.name,
      active: taxProfiles.active,
      createdAt: taxProfiles.createdAt,
      updatedAt: taxProfiles.updatedAt,
    })
    .from(taxProfiles)
    .where(and(...where))
    .orderBy(asc(taxProfiles.name));
}

export async function listTaxComponentsRepo(input: {
  companyId: string;
  profileId?: string | null;
  active?: boolean | null;
}) {
  const where: SQL[] = [eq(taxProfiles.companyId, input.companyId)];
  if (input.profileId != null) where.push(eq(taxComponents.profileId, input.profileId));
  if (input.active != null) where.push(eq(taxComponents.active, input.active));

  return db
    .select({
      id: taxComponents.id,
      profileId: taxComponents.profileId,
      key: taxComponents.key,
      numerator: taxComponents.numerator,
      denominator: taxComponents.denominator,
      inclusive: taxComponents.inclusive,
      sortOrder: taxComponents.sortOrder,
      startsAt: taxComponents.startsAt,
      endsAt: taxComponents.endsAt,
      active: taxComponents.active,
    })
    .from(taxComponents)
    .innerJoin(taxProfiles, eq(taxProfiles.id, taxComponents.profileId))
    .where(and(...where))
    .orderBy(asc(taxComponents.profileId), asc(taxComponents.sortOrder), asc(taxComponents.key));
}

export async function getActiveTaxProfileWithComponentsRepo(
  input: { companyId: string; at?: Date },
  executor: DbExecutor = db,
) {
  const at = input.at ?? new Date();

  const [profile] = await executor
    .select({
      id: taxProfiles.id,
      name: taxProfiles.name,
    })
    .from(taxProfiles)
    .where(and(eq(taxProfiles.companyId, input.companyId), eq(taxProfiles.active, true)))
    .orderBy(desc(taxProfiles.updatedAt), asc(taxProfiles.name))
    .limit(1);

  if (!profile) return null;

  const components = await executor
    .select({
      key: taxComponents.key,
      numerator: taxComponents.numerator,
      denominator: taxComponents.denominator,
      inclusive: taxComponents.inclusive,
      sortOrder: taxComponents.sortOrder,
    })
    .from(taxComponents)
    .where(
      and(
        eq(taxComponents.profileId, profile.id),
        eq(taxComponents.active, true),
        lte(taxComponents.startsAt, at),
        or(isNull(taxComponents.endsAt), gte(taxComponents.endsAt, at)),
      ),
    )
    .orderBy(asc(taxComponents.sortOrder), asc(taxComponents.key));

  return {
    profileId: profile.id,
    profileName: profile.name,
    components,
  };
}

export async function listActiveServiceChargesRepo(
  input: { companyId: string; at?: Date },
  executor: DbExecutor = db,
) {
  const at = input.at ?? new Date();
  return executor
    .select({
      id: serviceCharges.id,
      code: serviceCharges.code,
      name: serviceCharges.name,
      amountPsw: serviceCharges.amountPsw,
      taxable: serviceCharges.taxable,
      sortOrder: serviceCharges.sortOrder,
      payableAccountId: serviceCharges.payableAccountId,
    })
    .from(serviceCharges)
    .where(
      and(
        eq(serviceCharges.companyId, input.companyId),
        eq(serviceCharges.active, true),
        lte(serviceCharges.effectiveFrom, at),
        or(isNull(serviceCharges.effectiveTo), gte(serviceCharges.effectiveTo, at)),
      ),
    )
    .orderBy(asc(serviceCharges.sortOrder), asc(serviceCharges.code), asc(serviceCharges.name));
}

export async function getCompanyAccountingSettingsRepo(
  companyId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: companies.id,
      useAccounting: companies.useAccounting,
      moduleAccountingEnabled: companyModules.isEnabled,
    })
    .from(companies)
    .leftJoin(
      companyModules,
      and(eq(companyModules.companyId, companies.id), eq(companyModules.moduleCode, 'accounting')),
    )
    .where(eq(companies.id, companyId))
    .limit(1);

  return row ?? null;
}

export async function getAccountByCodeRepo(
  companyId: string,
  code: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: chartOfAccounts.id,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      label: chartOfAccounts.label,
      accountClass: chartOfAccounts.accountClass,
      isPostable: chartOfAccounts.isPostable,
      active: chartOfAccounts.active,
    })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.code, code)))
    .limit(1);
  return row ?? null;
}

export async function getAccountRepo(
  companyId: string,
  accountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: chartOfAccounts.id,
      companyId: chartOfAccounts.companyId,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      label: chartOfAccounts.label,
      accountClass: chartOfAccounts.accountClass,
      parentAccountId: chartOfAccounts.parentAccountId,
      isPostable: chartOfAccounts.isPostable,
      active: chartOfAccounts.active,
    })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.id, accountId)))
    .limit(1);
  return row ?? null;
}

export async function getExpenseCategoryRepo(
  companyId: string,
  expenseCategoryId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: expenseCategories.id,
      companyId: expenseCategories.companyId,
      code: expenseCategories.code,
      name: expenseCategories.name,
      accountId: expenseCategories.accountId,
      active: expenseCategories.active,
    })
    .from(expenseCategories)
    .where(
      and(eq(expenseCategories.companyId, companyId), eq(expenseCategories.id, expenseCategoryId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getExpenseCategoryByAccountRepo(
  companyId: string,
  accountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: expenseCategories.id,
      companyId: expenseCategories.companyId,
      code: expenseCategories.code,
      name: expenseCategories.name,
      accountId: expenseCategories.accountId,
      active: expenseCategories.active,
    })
    .from(expenseCategories)
    .where(
      and(eq(expenseCategories.companyId, companyId), eq(expenseCategories.accountId, accountId)),
    )
    .orderBy(asc(expenseCategories.createdAt))
    .limit(1);
  return row ?? null;
}

export async function listExpenseCategoriesByAccountRepo(
  companyId: string,
  accountId: string,
  executor: DbExecutor = db,
) {
  return executor
    .select({
      id: expenseCategories.id,
      companyId: expenseCategories.companyId,
      code: expenseCategories.code,
      name: expenseCategories.name,
      accountId: expenseCategories.accountId,
      active: expenseCategories.active,
    })
    .from(expenseCategories)
    .where(
      and(eq(expenseCategories.companyId, companyId), eq(expenseCategories.accountId, accountId)),
    )
    .orderBy(asc(expenseCategories.createdAt));
}

export async function getApprovalPolicyRepo(
  companyId: string,
  approvalPolicyId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: accountingApprovalPolicies.id,
      companyId: accountingApprovalPolicies.companyId,
      policyCode: accountingApprovalPolicies.policyCode,
      name: accountingApprovalPolicies.name,
      amountLimitPsw: accountingApprovalPolicies.amountLimitPsw,
      autoAuthorizeBelowThreshold: accountingApprovalPolicies.autoAuthorizeBelowThreshold,
      requiresHeadOfficeApproval: accountingApprovalPolicies.requiresHeadOfficeApproval,
      appliesToFundingSource: accountingApprovalPolicies.appliesToFundingSource,
      active: accountingApprovalPolicies.active,
    })
    .from(accountingApprovalPolicies)
    .where(
      and(
        eq(accountingApprovalPolicies.companyId, companyId),
        eq(accountingApprovalPolicies.id, approvalPolicyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getServiceChargeRepo(
  companyId: string,
  serviceChargeId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: serviceCharges.id,
      companyId: serviceCharges.companyId,
      code: serviceCharges.code,
      name: serviceCharges.name,
      description: serviceCharges.description,
      amountPsw: serviceCharges.amountPsw,
      taxable: serviceCharges.taxable,
      active: serviceCharges.active,
      sortOrder: serviceCharges.sortOrder,
      payableAccountId: serviceCharges.payableAccountId,
      effectiveFrom: serviceCharges.effectiveFrom,
      effectiveTo: serviceCharges.effectiveTo,
      createdAt: serviceCharges.createdAt,
      updatedAt: serviceCharges.updatedAt,
    })
    .from(serviceCharges)
    .where(and(eq(serviceCharges.companyId, companyId), eq(serviceCharges.id, serviceChargeId)))
    .limit(1);

  return row ?? null;
}

export async function getCompanyBankAccountRepoById(
  companyId: string,
  bankAccountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: companyBankAccounts.id,
      companyId: companyBankAccounts.companyId,
      accountId: companyBankAccounts.accountId,
      name: companyBankAccounts.name,
      bankName: companyBankAccounts.bankName,
      branchName: companyBankAccounts.branchName,
      accountNumberMasked: companyBankAccounts.accountNumberMasked,
      active: companyBankAccounts.active,
    })
    .from(companyBankAccounts)
    .where(
      and(eq(companyBankAccounts.companyId, companyId), eq(companyBankAccounts.id, bankAccountId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getTaxProfileRepo(
  companyId: string,
  taxProfileId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: taxProfiles.id,
      companyId: taxProfiles.companyId,
      name: taxProfiles.name,
      active: taxProfiles.active,
    })
    .from(taxProfiles)
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxProfiles.id, taxProfileId)))
    .limit(1);
  return row ?? null;
}

export async function getTaxComponentRepo(
  companyId: string,
  taxComponentId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: taxComponents.id,
      profileId: taxComponents.profileId,
      key: taxComponents.key,
      numerator: taxComponents.numerator,
      denominator: taxComponents.denominator,
      inclusive: taxComponents.inclusive,
      sortOrder: taxComponents.sortOrder,
      startsAt: taxComponents.startsAt,
      endsAt: taxComponents.endsAt,
      active: taxComponents.active,
    })
    .from(taxComponents)
    .innerJoin(taxProfiles, eq(taxProfiles.id, taxComponents.profileId))
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxComponents.id, taxComponentId)))
    .limit(1);
  return row ?? null;
}

export async function getAccountUsageSummaryRepo(
  companyId: string,
  accountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      journalLineCount: sql<number>`count(distinct ${journalLines.id})`,
      expenseCategoryCount: sql<number>`count(distinct ${expenseCategories.id})`,
      bankAccountCount: sql<number>`count(distinct ${companyBankAccounts.id})`,
      pettyCashFundCount: sql<number>`count(distinct ${pettyCashFunds.id})`,
    })
    .from(chartOfAccounts)
    .leftJoin(journalLines, eq(journalLines.accountId, chartOfAccounts.id))
    .leftJoin(expenseCategories, eq(expenseCategories.accountId, chartOfAccounts.id))
    .leftJoin(companyBankAccounts, eq(companyBankAccounts.accountId, chartOfAccounts.id))
    .leftJoin(pettyCashFunds, eq(pettyCashFunds.accountId, chartOfAccounts.id))
    .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.id, accountId)))
    .groupBy(chartOfAccounts.id);
  const [childAccountRow] = await executor
    .select({
      childAccountCount: sql<number>`count(*)`,
    })
    .from(chartOfAccounts)
    .where(
      and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.parentAccountId, accountId)),
    );
  return row
    ? {
        ...row,
        childAccountCount: Number(childAccountRow?.childAccountCount ?? 0),
      }
    : {
        journalLineCount: 0,
        expenseCategoryCount: 0,
        bankAccountCount: 0,
        pettyCashFundCount: 0,
        childAccountCount: Number(childAccountRow?.childAccountCount ?? 0),
      };
}

export async function getExpenseCategoryUsageSummaryRepo(
  companyId: string,
  expenseCategoryId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      totalRequestCount: sql<number>`count(*)`,
      openRequestCount: sql<number>`count(*) filter (where ${expenseRequests.status} not in (3, 5))`,
      postedRequestCount: sql<number>`count(*) filter (where ${expenseRequests.status} = 5)`,
    })
    .from(expenseRequests)
    .where(
      and(
        eq(expenseRequests.companyId, companyId),
        eq(expenseRequests.expenseCategoryId, expenseCategoryId),
      ),
    );
  return row ?? { totalRequestCount: 0, openRequestCount: 0, postedRequestCount: 0 };
}

export async function getCompanyBankAccountUsageSummaryRepo(
  companyId: string,
  bankAccountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      totalRequestCount: sql<number>`count(*)`,
      openRequestCount: sql<number>`count(*) filter (where ${expenseRequests.status} not in (3, 5))`,
      postedRequestCount: sql<number>`count(*) filter (where ${expenseRequests.status} = 5)`,
    })
    .from(expenseRequests)
    .where(
      and(
        eq(expenseRequests.companyId, companyId),
        eq(expenseRequests.companyBankAccountId, bankAccountId),
      ),
    );
  const [transferRow] = await executor
    .select({
      cashToBankTransferCount: sql<number>`count(*)`,
      pettyCashReplenishmentCount: sql<number>`count(*)`,
    })
    .from(companyBankAccounts)
    .leftJoin(
      cashToBankTransfers,
      eq(cashToBankTransfers.companyBankAccountId, companyBankAccounts.id),
    )
    .leftJoin(
      pettyCashReplenishments,
      eq(pettyCashReplenishments.companyBankAccountId, companyBankAccounts.id),
    )
    .where(
      and(eq(companyBankAccounts.companyId, companyId), eq(companyBankAccounts.id, bankAccountId)),
    )
    .groupBy(companyBankAccounts.id);

  return {
    totalRequestCount: Number(row?.totalRequestCount ?? 0),
    openRequestCount: Number(row?.openRequestCount ?? 0),
    postedRequestCount: Number(row?.postedRequestCount ?? 0),
    cashToBankTransferCount: Number(transferRow?.cashToBankTransferCount ?? 0),
    pettyCashReplenishmentCount: Number(transferRow?.pettyCashReplenishmentCount ?? 0),
  };
}

export async function getTaxProfileUsageSummaryRepo(companyId: string, taxProfileId: string) {
  const [row] = await db
    .select({
      compensationCount: sql<number>`count(distinct ${employeeCompensation.id})`,
      taxJournalItemCount: sql<number>`count(distinct ${taxJournalItems.id})`,
      taxComponentCount: sql<number>`count(distinct ${taxComponents.id})`,
    })
    .from(taxProfiles)
    .leftJoin(employeeCompensation, eq(employeeCompensation.taxProfileId, taxProfiles.id))
    .leftJoin(taxJournalItems, eq(taxJournalItems.taxProfileId, taxProfiles.id))
    .leftJoin(taxComponents, eq(taxComponents.profileId, taxProfiles.id))
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxProfiles.id, taxProfileId)))
    .groupBy(taxProfiles.id);
  return row ?? { compensationCount: 0, taxJournalItemCount: 0, taxComponentCount: 0 };
}

export async function getTaxComponentUsageSummaryRepo(
  companyId: string,
  taxComponentId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      taxProfileCount: sql<number>`count(distinct ${taxProfiles.id})`,
    })
    .from(taxComponents)
    .innerJoin(taxProfiles, eq(taxProfiles.id, taxComponents.profileId))
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxComponents.id, taxComponentId)));

  return { taxProfileCount: Number(row?.taxProfileCount ?? 0) };
}

export async function createAccountRepo(
  values: typeof chartOfAccounts.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(chartOfAccounts)
    .values(values)
    .returning({ id: chartOfAccounts.id });
  return row ?? null;
}

export async function updateAccountRepo(
  accountId: string,
  patch: Partial<typeof chartOfAccounts.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(chartOfAccounts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(chartOfAccounts.id, accountId))
    .returning({ id: chartOfAccounts.id });
  return row ?? null;
}

export async function deleteAccountRepo(
  companyId: string,
  accountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(chartOfAccounts)
    .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.id, accountId)))
    .returning({ id: chartOfAccounts.id });
  return row ?? null;
}

export async function createExpenseCategoryRepo(
  values: typeof expenseCategories.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(expenseCategories)
    .values(values)
    .returning({ id: expenseCategories.id });
  return row ?? null;
}

export async function createApprovalPolicyRepo(
  values: typeof accountingApprovalPolicies.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(accountingApprovalPolicies)
    .values(values)
    .returning({ id: accountingApprovalPolicies.id });
  return row ?? null;
}

export async function createServiceChargeRepo(
  values: typeof serviceCharges.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(serviceCharges)
    .values(values)
    .returning({ id: serviceCharges.id });
  return row ?? null;
}

export async function updateApprovalPolicyRepo(
  approvalPolicyId: string,
  patch: Partial<typeof accountingApprovalPolicies.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(accountingApprovalPolicies)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(accountingApprovalPolicies.id, approvalPolicyId))
    .returning({ id: accountingApprovalPolicies.id });
  return row ?? null;
}

export async function updateServiceChargeRepo(
  serviceChargeId: string,
  patch: Partial<typeof serviceCharges.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(serviceCharges)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(serviceCharges.id, serviceChargeId))
    .returning({ id: serviceCharges.id });
  return row ?? null;
}

export async function createCompanyBankAccountRepo(
  values: typeof companyBankAccounts.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(companyBankAccounts)
    .values(values)
    .returning({ id: companyBankAccounts.id });
  return row ?? null;
}

export async function updateCompanyBankAccountRepo(
  bankAccountId: string,
  patch: Partial<typeof companyBankAccounts.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(companyBankAccounts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(companyBankAccounts.id, bankAccountId))
    .returning({ id: companyBankAccounts.id });
  return row ?? null;
}

export async function createTaxProfileRepo(
  values: typeof taxProfiles.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor.insert(taxProfiles).values(values).returning({ id: taxProfiles.id });
  return row ?? null;
}

export async function createTaxComponentRepo(
  values: typeof taxComponents.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(taxComponents)
    .values(values)
    .returning({ id: taxComponents.id });
  return row ?? null;
}

export async function updateTaxProfileRepo(
  taxProfileId: string,
  patch: Partial<typeof taxProfiles.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(taxProfiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(taxProfiles.id, taxProfileId))
    .returning({ id: taxProfiles.id });
  return row ?? null;
}

export async function updateTaxComponentRepo(
  taxComponentId: string,
  patch: Partial<typeof taxComponents.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(taxComponents)
    .set({ ...patch })
    .where(eq(taxComponents.id, taxComponentId))
    .returning({ id: taxComponents.id });
  return row ?? null;
}

export async function updateExpenseCategoryRepo(
  expenseCategoryId: string,
  patch: Partial<typeof expenseCategories.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(expenseCategories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(expenseCategories.id, expenseCategoryId))
    .returning({ id: expenseCategories.id });
  return row ?? null;
}

export async function deleteExpenseCategoryRepo(
  companyId: string,
  expenseCategoryId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(expenseCategories)
    .where(
      and(eq(expenseCategories.companyId, companyId), eq(expenseCategories.id, expenseCategoryId)),
    )
    .returning({ id: expenseCategories.id });
  return row ?? null;
}

export async function deleteApprovalPolicyRepo(
  companyId: string,
  approvalPolicyId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(accountingApprovalPolicies)
    .where(
      and(
        eq(accountingApprovalPolicies.companyId, companyId),
        eq(accountingApprovalPolicies.id, approvalPolicyId),
      ),
    )
    .returning({ id: accountingApprovalPolicies.id });
  return row ?? null;
}

export async function deleteCompanyBankAccountRepo(
  companyId: string,
  bankAccountId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(companyBankAccounts)
    .where(
      and(eq(companyBankAccounts.companyId, companyId), eq(companyBankAccounts.id, bankAccountId)),
    )
    .returning({ id: companyBankAccounts.id });
  return row ?? null;
}

export async function deleteTaxProfileRepo(
  companyId: string,
  taxProfileId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(taxProfiles)
    .where(and(eq(taxProfiles.companyId, companyId), eq(taxProfiles.id, taxProfileId)))
    .returning({ id: taxProfiles.id });
  return row ?? null;
}

export async function deleteTaxComponentRepo(
  _companyId: string,
  taxComponentId: string,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .delete(taxComponents)
    .where(eq(taxComponents.id, taxComponentId))
    .returning({ id: taxComponents.id });
  return row ?? null;
}

export async function createJournalBatchRepo(
  values: typeof journalBatches.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(journalBatches)
    .values(values)
    .returning({ id: journalBatches.id });
  return row ?? null;
}

export async function createJournalEntryRepo(
  values: typeof journalEntries.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(journalEntries)
    .values(values)
    .returning({ id: journalEntries.id });
  return row ?? null;
}

export async function createJournalLinesRepo(
  values: Array<typeof journalLines.$inferInsert>,
  executor: DbExecutor = db,
) {
  return executor.insert(journalLines).values(values).returning({ id: journalLines.id });
}

export async function createManualJournalEntryRepo(
  values: typeof manualJournalEntries.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(manualJournalEntries)
    .values(values)
    .returning({ id: manualJournalEntries.id });
  return row ?? null;
}

export async function createManualJournalEntryLinesRepo(
  values: Array<typeof manualJournalEntryLines.$inferInsert>,
  executor: DbExecutor = db,
) {
  return executor
    .insert(manualJournalEntryLines)
    .values(values)
    .returning({ id: manualJournalEntryLines.id });
}

export async function listPendingManualJournalEntriesRepo(
  input: { companyId: string },
  executor: DbExecutor = db,
) {
  return executor
    .select({
      id: manualJournalEntries.id,
      companyId: manualJournalEntries.companyId,
      policyCode: manualJournalEntries.policyCode,
      thresholdPsw: manualJournalEntries.thresholdPsw,
      totalDebitPsw: manualJournalEntries.totalDebitPsw,
      totalCreditPsw: manualJournalEntries.totalCreditPsw,
      status: manualJournalEntries.status,
      branchId: manualJournalEntries.branchId,
      locationId: manualJournalEntries.locationId,
      memo: manualJournalEntries.memo,
      entryDate: manualJournalEntries.entryDate,
      recordedByUserId: manualJournalEntries.recordedByUserId,
      approvedByUserId: manualJournalEntries.approvedByUserId,
      approvalReason: manualJournalEntries.approvalReason,
      rejectionReason: manualJournalEntries.rejectionReason,
      postedBatchId: manualJournalEntries.postedBatchId,
      postedEntryId: manualJournalEntries.postedEntryId,
      createdAt: manualJournalEntries.createdAt,
      updatedAt: manualJournalEntries.updatedAt,
    })
    .from(manualJournalEntries)
    .where(
      and(
        eq(manualJournalEntries.companyId, input.companyId),
        eq(manualJournalEntries.status, ApprovalStatus.PENDING),
      ),
    )
    .orderBy(desc(manualJournalEntries.createdAt));
}

export async function getManualJournalEntryRepo(
  input: { companyId: string; id: string },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      id: manualJournalEntries.id,
      companyId: manualJournalEntries.companyId,
      policyCode: manualJournalEntries.policyCode,
      thresholdPsw: manualJournalEntries.thresholdPsw,
      totalDebitPsw: manualJournalEntries.totalDebitPsw,
      totalCreditPsw: manualJournalEntries.totalCreditPsw,
      status: manualJournalEntries.status,
      branchId: manualJournalEntries.branchId,
      locationId: manualJournalEntries.locationId,
      memo: manualJournalEntries.memo,
      entryDate: manualJournalEntries.entryDate,
      recordedByUserId: manualJournalEntries.recordedByUserId,
      approvedByUserId: manualJournalEntries.approvedByUserId,
      approvalReason: manualJournalEntries.approvalReason,
      rejectionReason: manualJournalEntries.rejectionReason,
      postedBatchId: manualJournalEntries.postedBatchId,
      postedEntryId: manualJournalEntries.postedEntryId,
      createdAt: manualJournalEntries.createdAt,
      updatedAt: manualJournalEntries.updatedAt,
    })
    .from(manualJournalEntries)
    .where(
      and(
        eq(manualJournalEntries.companyId, input.companyId),
        eq(manualJournalEntries.id, input.id),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listManualJournalEntryLinesRepo(
  input: { companyId: string; manualEntryId: string },
  executor: DbExecutor = db,
) {
  return executor
    .select({
      id: manualJournalEntryLines.id,
      companyId: manualJournalEntryLines.companyId,
      manualEntryId: manualJournalEntryLines.manualEntryId,
      accountId: manualJournalEntryLines.accountId,
      branchId: manualJournalEntryLines.branchId,
      locationId: manualJournalEntryLines.locationId,
      debitPsw: manualJournalEntryLines.debitPsw,
      creditPsw: manualJournalEntryLines.creditPsw,
      description: manualJournalEntryLines.description,
      sortOrder: manualJournalEntryLines.sortOrder,
      createdAt: manualJournalEntryLines.createdAt,
    })
    .from(manualJournalEntryLines)
    .where(
      and(
        eq(manualJournalEntryLines.companyId, input.companyId),
        eq(manualJournalEntryLines.manualEntryId, input.manualEntryId),
      ),
    )
    .orderBy(asc(manualJournalEntryLines.sortOrder), asc(manualJournalEntryLines.createdAt));
}

export async function updateManualJournalEntryRepo(
  input: {
    id: string;
    patch: Partial<typeof manualJournalEntries.$inferInsert>;
  },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(manualJournalEntries)
    .set({ ...input.patch, updatedAt: new Date() })
    .where(eq(manualJournalEntries.id, input.id))
    .returning({ id: manualJournalEntries.id });
  return row ?? null;
}

export async function listJournalLinesByBatchRepo(batchId: string, executor: DbExecutor = db) {
  return executor
    .select({
      entryId: journalEntries.id,
      branchId: journalLines.branchId,
      locationId: journalLines.locationId,
      recordedByUserId: journalLines.recordedByUserId,
      accountId: journalLines.accountId,
      debitPsw: journalLines.debitPsw,
      creditPsw: journalLines.creditPsw,
      description: journalLines.description,
      metadata: journalLines.metadata,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalLines.entryId))
    .where(eq(journalEntries.batchId, batchId))
    .orderBy(asc(journalLines.createdAt), asc(journalLines.id));
}

export async function createTaxJournalItemRepo(
  values: typeof taxJournalItems.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(taxJournalItems)
    .values(values)
    .returning({ id: taxJournalItems.id });
  return row ?? null;
}

export async function createTaxFilingAuditLogRepo(
  values: typeof taxFilingAuditLogs.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(taxFilingAuditLogs)
    .values(values)
    .returning({ id: taxFilingAuditLogs.id });
  return row ?? null;
}

export async function createDailyCashConfirmationRepo(
  values: typeof dailyCashConfirmations.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(dailyCashConfirmations)
    .values(values)
    .returning({ id: dailyCashConfirmations.id });
  return row ?? null;
}

export async function getDailyCashConfirmationRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(dailyCashConfirmations)
    .where(eq(dailyCashConfirmations.id, id))
    .limit(1);
  return row ?? null;
}

export async function listDailyCashConfirmationsRepo(
  input: { companyId: string; branchId?: string | null },
  executor: DbExecutor = db,
) {
  const where: SQL<unknown>[] = [eq(dailyCashConfirmations.companyId, input.companyId)];
  if (input.branchId) where.push(eq(dailyCashConfirmations.branchId, input.branchId));
  return executor
    .select()
    .from(dailyCashConfirmations)
    .where(and(...where))
    .orderBy(asc(dailyCashConfirmations.confirmationDate), asc(dailyCashConfirmations.id));
}

export async function getDailyCashExpectedSummaryRepo(
  input: {
    companyId: string;
    branchId: string;
    dateFrom: Date;
    dateToExclusive: Date;
    locationId?: string | null;
    cashierUserId?: string | null;
  },
  executor: DbExecutor = db,
) {
  const where: SQL<unknown>[] = [
    eq(payments.companyId, input.companyId),
    eq(payments.branchId, input.branchId),
    gte(payments.receivedAt, input.dateFrom),
    lt(payments.receivedAt, input.dateToExclusive),
    sql`${payments.voidedAt} is null`,
  ];
  if (input.cashierUserId) where.push(eq(payments.cashierUserId, input.cashierUserId));
  if (input.locationId) where.push(eq(users.locationId, input.locationId));

  const [row] = await executor
    .select({
      cashSalesPsw: sql<number>`coalesce(sum(case when ${payments.method} = ${PaymentMethod.CASH} then ${payments.grossAmountPsw} else 0 end), 0)`,
      nonCashSalesPsw: sql<number>`coalesce(sum(case when ${payments.method} <> ${PaymentMethod.CASH} then ${payments.grossAmountPsw} else 0 end), 0)`,
      totalSalesPsw: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
      senderSalesPsw: sql<number>`coalesce(sum(case when ${payments.cashierType} = ${CashierType.SENDING} then ${payments.grossAmountPsw} else 0 end), 0)`,
      receiverSalesPsw: sql<number>`coalesce(sum(case when ${payments.cashierType} = ${CashierType.TOBEPAID} then ${payments.grossAmountPsw} else 0 end), 0)`,
      deliverySalesPsw: sql<number>`coalesce(sum(case when ${payments.cashierType} = ${CashierType.DELIVERY} then ${payments.grossAmountPsw} else 0 end), 0)`,
      principalCashSalesPsw: sql<number>`coalesce(sum(case when ${payments.method} = ${PaymentMethod.CASH} and ${payments.component} = ${PaymentComponent.PRINCIPAL} then ${payments.grossAmountPsw} else 0 end), 0)`,
      deliveryCashSalesPsw: sql<number>`coalesce(sum(case when ${payments.method} = ${PaymentMethod.CASH} and ${payments.component} = ${PaymentComponent.DELIVERY_FEE} then ${payments.grossAmountPsw} else 0 end), 0)`,
      transactionCount: sql<number>`count(${payments.id})`,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.cashierUserId))
    .where(and(...where))
    .limit(1);

  return {
    cashSalesPsw: Number(row?.cashSalesPsw ?? 0),
    nonCashSalesPsw: Number(row?.nonCashSalesPsw ?? 0),
    totalSalesPsw: Number(row?.totalSalesPsw ?? 0),
    senderSalesPsw: Number(row?.senderSalesPsw ?? 0),
    receiverSalesPsw: Number(row?.receiverSalesPsw ?? 0),
    deliverySalesPsw: Number(row?.deliverySalesPsw ?? 0),
    principalCashSalesPsw: Number(row?.principalCashSalesPsw ?? 0),
    deliveryCashSalesPsw: Number(row?.deliveryCashSalesPsw ?? 0),
    transactionCount: Number(row?.transactionCount ?? 0),
  };
}

export async function getDailyCashSessionSummaryRepo(
  input: {
    branchId: string;
    cashierUserId: string;
    dateFrom: Date;
    dateToExclusive: Date;
  },
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .select({
      sessionId: cashierSessions.id,
      status: cashierSessions.status,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      expectedClosingBalancePsw: cashierSessions.expectedClosingBalancePsw,
      variancePsw: cashierSessions.variancePsw,
      totalTransactions: cashierSessions.totalTransactions,
      cashTransactions: cashierSessions.cashTransactions,
      mobileMoneyTransactions: cashierSessions.mobileMoneyTransactions,
      cardTransactions: cashierSessions.cardTransactions,
      customerCount: cashierSessions.customerCount,
      parcelsProcessed: cashierSessions.parcelsProcessed,
    })
    .from(cashierSessions)
    .where(
      and(
        eq(cashierSessions.branchId, input.branchId),
        eq(cashierSessions.cashierId, input.cashierUserId),
        gte(cashierSessions.scheduledStartTime, input.dateFrom),
        lt(cashierSessions.scheduledStartTime, input.dateToExclusive),
      ),
    )
    .orderBy(sql`${cashierSessions.scheduledStartTime} desc`, sql`${cashierSessions.id} desc`)
    .limit(1);

  return row ?? null;
}

export async function updateDailyCashConfirmationRepo(
  id: string,
  patch: Partial<typeof dailyCashConfirmations.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(dailyCashConfirmations)
    .set(patch)
    .where(eq(dailyCashConfirmations.id, id))
    .returning();
  return row ?? null;
}

export async function createExpenseRequestRepo(
  values: typeof expenseRequests.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(expenseRequests)
    .values(values)
    .returning({ id: expenseRequests.id });
  return row ?? null;
}

export async function getExpenseRequestRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(expenseRequests)
    .where(eq(expenseRequests.id, id))
    .limit(1);
  return row ?? null;
}

export async function listExpenseRequestsRepo(
  input: { companyId: string; branchId?: string | null },
  executor: DbExecutor = db,
) {
  const where: SQL<unknown>[] = [eq(expenseRequests.companyId, input.companyId)];
  if (input.branchId) where.push(eq(expenseRequests.branchId, input.branchId));
  return executor
    .select()
    .from(expenseRequests)
    .where(and(...where))
    .orderBy(asc(expenseRequests.createdAt), asc(expenseRequests.id));
}

export async function updateExpenseRequestRepo(
  id: string,
  patch: Partial<typeof expenseRequests.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(expenseRequests)
    .set(patch)
    .where(eq(expenseRequests.id, id))
    .returning();
  return row ?? null;
}

export async function getCompanyBankAccountRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(companyBankAccounts)
    .where(eq(companyBankAccounts.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPettyCashFundByBranchRepo(
  companyId: string,
  branchId: string,
  executor: DbExecutor = db,
) {
  const [fund] = await executor
    .select()
    .from(pettyCashFunds)
    .where(and(eq(pettyCashFunds.companyId, companyId), eq(pettyCashFunds.branchId, branchId)))
    .limit(1);
  return fund ?? null;
}

export async function listJournalLinesForReportingRepo(
  input: {
    companyId: string;
    branchId?: string | null;
    locationId?: string | null;
    dateFrom?: Date | string | null;
    dateTo?: Date | string | null;
    accountId?: string | null;
  },
  executor: DbExecutor = db,
) {
  const where: SQL<unknown>[] = [eq(journalLines.companyId, input.companyId)];
  if (input.branchId) where.push(eq(journalLines.branchId, input.branchId));
  if (input.locationId) where.push(eq(journalLines.locationId, input.locationId));
  if (input.accountId) where.push(eq(journalLines.accountId, input.accountId));
  if (input.dateFrom)
    where.push(sql`${journalEntries.entryDate} >= ${toDateOnlyParam(input.dateFrom)}`);
  if (input.dateTo)
    where.push(sql`${journalEntries.entryDate} <= ${toDateOnlyParam(input.dateTo)}`);

  return executor
    .select({
      lineId: journalLines.id,
      entryId: journalEntries.id,
      batchId: journalEntries.batchId,
      entryDate: journalEntries.entryDate,
      memo: journalEntries.memo,
      sourceType: journalEntries.sourceType,
      sourceId: journalEntries.sourceId,
      lineDescription: journalLines.description,
      accountId: chartOfAccounts.id,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      accountClass: chartOfAccounts.accountClass,
      branchId: journalLines.branchId,
      branchName: branches.name,
      locationId: journalLines.locationId,
      locationName: locations.name,
      debitPsw: journalLines.debitPsw,
      creditPsw: journalLines.creditPsw,
      metadata: journalLines.metadata,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalEntries.id, journalLines.entryId))
    .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalLines.accountId))
    .leftJoin(branches, eq(branches.id, journalLines.branchId))
    .leftJoin(locations, eq(locations.id, journalLines.locationId))
    .where(and(...where))
    .orderBy(asc(journalEntries.entryDate), asc(journalEntries.id), asc(journalLines.id));
}

export async function createTaxFilingPeriodRepo(
  values: typeof taxFilingPeriods.$inferInsert,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .insert(taxFilingPeriods)
    .values(values)
    .returning({ id: taxFilingPeriods.id });
  return row ?? null;
}

export async function listTaxFilingPeriodsRepo(
  input: { companyId: string },
  executor: DbExecutor = db,
) {
  return executor
    .select()
    .from(taxFilingPeriods)
    .where(eq(taxFilingPeriods.companyId, input.companyId))
    .orderBy(asc(taxFilingPeriods.dateFrom), asc(taxFilingPeriods.id));
}

export async function getTaxFilingPeriodRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(taxFilingPeriods)
    .where(eq(taxFilingPeriods.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateTaxFilingPeriodRepo(
  id: string,
  patch: Partial<typeof taxFilingPeriods.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(taxFilingPeriods)
    .set(patch)
    .where(eq(taxFilingPeriods.id, id))
    .returning();
  return row ?? null;
}

export async function listTaxJournalItemsRepo(
  input: {
    companyId: string;
    branchId?: string | null;
    filingStatus?: number | null;
    filingPeriodId?: string | null;
  },
  executor: DbExecutor = db,
) {
  const where: SQL<unknown>[] = [eq(taxJournalItems.companyId, input.companyId)];
  if (input.branchId) where.push(eq(taxJournalItems.branchId, input.branchId));
  if (input.filingStatus != null) where.push(eq(taxJournalItems.filingStatus, input.filingStatus));
  if (input.filingPeriodId) where.push(eq(taxJournalItems.filingPeriodId, input.filingPeriodId));

  return executor
    .select()
    .from(taxJournalItems)
    .where(and(...where))
    .orderBy(asc(taxJournalItems.postingDate), asc(taxJournalItems.id));
}

export async function getTaxJournalItemRepo(id: string, executor: DbExecutor = db) {
  const [row] = await executor
    .select()
    .from(taxJournalItems)
    .where(eq(taxJournalItems.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateTaxJournalItemRepo(
  id: string,
  patch: Partial<typeof taxJournalItems.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [row] = await executor
    .update(taxJournalItems)
    .set(patch)
    .where(eq(taxJournalItems.id, id))
    .returning();
  return row ?? null;
}
