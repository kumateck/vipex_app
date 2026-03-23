import {
  pgTable,
  varchar,
  boolean,
  integer,
  bigint,
  timestamp,
  index,
  uniqueIndex,
  smallint,
  jsonb,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, branches, locations, users } from './core';
import {
  AccountClass,
  CashConfirmationStatus,
  ExpenseFundingSource,
  ExpenseRequestStatus,
  JournalSourceType,
  TaxFilingPeriodStatus,
  TaxFilingStatus,
} from './enums';

// Tax profiles remain DB-driven so the current Ghana tax engine can keep reading consistent rates.
export const taxProfiles = pgTable(
  'tax_profiles',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('tax_profiles_company_idx').on(t.companyId),
  }),
);

export const taxComponents = pgTable(
  'tax_components',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    profileId: varchar('profile_id', { length: 25 })
      .notNull()
      .references(() => taxProfiles.id),
    key: varchar('key', { length: 50 }).notNull(),
    numerator: bigint('numerator', { mode: 'number' }).notNull(),
    denominator: bigint('denominator', { mode: 'number' }).notNull(),
    inclusive: boolean('inclusive').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: false }).notNull().defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: false }),
    active: boolean('active').notNull().default(true),
  },
  (t) => ({
    byProfile: index('tax_components_profile_idx').on(t.profileId),
  }),
);

export const chartOfAccounts = pgTable(
  'chart_of_accounts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 30 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    accountClass: smallint('account_class').notNull().default(AccountClass.ASSET),
    parentAccountId: varchar('parent_account_id', { length: 25 }),
    isPostable: boolean('is_postable').notNull().default(true),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('chart_of_accounts_company_idx').on(t.companyId),
    byClass: index('chart_of_accounts_class_idx').on(t.companyId, t.accountClass),
    uqCompanyCode: uniqueIndex('chart_of_accounts_company_code_uq').on(t.companyId, t.code),
    uqCompanyLowerName: uniqueIndex('chart_of_accounts_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const companyBankAccounts = pgTable(
  'company_bank_accounts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    accountId: varchar('account_id', { length: 25 })
      .notNull()
      .references(() => chartOfAccounts.id),
    name: varchar('name', { length: 255 }).notNull(),
    bankName: varchar('bank_name', { length: 255 }),
    branchName: varchar('branch_name', { length: 255 }),
    accountNumberMasked: varchar('account_number_masked', { length: 100 }),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('company_bank_accounts_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('company_bank_accounts_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const expenseCategories = pgTable(
  'expense_categories',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 40 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    accountId: varchar('account_id', { length: 25 })
      .notNull()
      .references(() => chartOfAccounts.id),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('expense_categories_company_idx').on(t.companyId),
    uqCompanyCode: uniqueIndex('expense_categories_company_code_uq').on(t.companyId, t.code),
    uqCompanyLowerName: uniqueIndex('expense_categories_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const accountingApprovalPolicies = pgTable(
  'accounting_approval_policies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    policyCode: varchar('policy_code', { length: 60 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    amountLimitPsw: bigint('amount_limit_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    requiresHeadOfficeApproval: boolean('requires_head_office_approval').notNull().default(false),
    appliesToFundingSource: smallint('applies_to_funding_source'),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('accounting_approval_policies_company_idx').on(t.companyId),
    uqCompanyPolicyCode: uniqueIndex('accounting_approval_policies_company_code_uq').on(
      t.companyId,
      t.policyCode,
    ),
  }),
);

export const pettyCashFunds = pgTable(
  'petty_cash_funds',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    accountId: varchar('account_id', { length: 25 })
      .notNull()
      .references(() => chartOfAccounts.id),
    targetFloatPsw: bigint('target_float_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('petty_cash_funds_company_idx').on(t.companyId),
    uqBranchFund: uniqueIndex('petty_cash_funds_branch_uq').on(t.companyId, t.branchId),
  }),
);

export const journalBatches = pgTable(
  'journal_batches',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceType: smallint('source_type').notNull().default(JournalSourceType.MANUAL),
    sourceId: varchar('source_id', { length: 60 }),
    batchDate: timestamp('batch_date', { withTimezone: false }).notNull().defaultNow(),
    description: varchar('description', { length: 500 }),
    postedBy: varchar('posted_by', { length: 25 }).references(() => users.id),
    postedAt: timestamp('posted_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('journal_batches_company_idx').on(t.companyId),
    bySource: index('journal_batches_source_idx').on(t.companyId, t.sourceType, t.sourceId),
  }),
);

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    batchId: varchar('batch_id', { length: 25 })
      .notNull()
      .references(() => journalBatches.id),
    sourceType: smallint('source_type').notNull().default(JournalSourceType.MANUAL),
    sourceId: varchar('source_id', { length: 60 }),
    entryDate: timestamp('entry_date', { withTimezone: false }).notNull().defaultNow(),
    memo: varchar('memo', { length: 500 }),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 }).references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('journal_entries_company_idx').on(t.companyId),
    byBatch: index('journal_entries_batch_idx').on(t.batchId),
    byBranchDate: index('journal_entries_branch_date_idx').on(t.branchId, t.entryDate),
  }),
);

export const journalLines = pgTable(
  'journal_lines',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    entryId: varchar('entry_id', { length: 25 })
      .notNull()
      .references(() => journalEntries.id),
    accountId: varchar('account_id', { length: 25 })
      .notNull()
      .references(() => chartOfAccounts.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 }).references(() => users.id),
    debitPsw: bigint('debit_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    creditPsw: bigint('credit_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    description: varchar('description', { length: 500 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('journal_lines_company_idx').on(t.companyId),
    byEntry: index('journal_lines_entry_idx').on(t.entryId),
    byAccount: index('journal_lines_account_idx').on(t.accountId),
    byBranchAccount: index('journal_lines_branch_account_idx').on(t.branchId, t.accountId),
  }),
);

export const dailyCashConfirmations = pgTable(
  'daily_cash_confirmations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    cashierUserId: varchar('cashier_user_id', { length: 25 }).references(() => users.id),
    accountantUserId: varchar('accountant_user_id', { length: 25 }).references(() => users.id),
    confirmationDate: timestamp('confirmation_date', { withTimezone: false }).notNull(),
    expectedCashPsw: bigint('expected_cash_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    countedCashPsw: bigint('counted_cash_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    shortagePsw: bigint('shortage_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    overagePsw: bigint('overage_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    notes: varchar('notes', { length: 1000 }),
    status: smallint('status').notNull().default(CashConfirmationStatus.DRAFT),
    journalEntryId: varchar('journal_entry_id', { length: 25 }).references(() => journalEntries.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    postedAt: timestamp('posted_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('daily_cash_confirmations_company_idx').on(t.companyId),
    byBranchDate: index('daily_cash_confirmations_branch_date_idx').on(
      t.branchId,
      t.confirmationDate,
    ),
    uqDailyScope: uniqueIndex('daily_cash_confirmations_scope_uq').on(
      t.companyId,
      t.branchId,
      t.locationId,
      t.cashierUserId,
      t.confirmationDate,
    ),
  }),
);

export const expenseRequests = pgTable(
  'expense_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    expenseCategoryId: varchar('expense_category_id', { length: 25 })
      .notNull()
      .references(() => expenseCategories.id),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull(),
    fundingSource: smallint('funding_source').notNull().default(ExpenseFundingSource.PETTY_CASH),
    status: smallint('status').notNull().default(ExpenseRequestStatus.RECORDED),
    purpose: varchar('purpose', { length: 1000 }).notNull(),
    referenceNo: varchar('reference_no', { length: 100 }),
    requestedByUserId: varchar('requested_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    paidByUserId: varchar('paid_by_user_id', { length: 25 }).references(() => users.id),
    companyBankAccountId: varchar('company_bank_account_id', { length: 25 }).references(
      () => companyBankAccounts.id,
    ),
    journalEntryId: varchar('journal_entry_id', { length: 25 }).references(() => journalEntries.id),
    approvalReason: varchar('approval_reason', { length: 1000 }),
    rejectionReason: varchar('rejection_reason', { length: 1000 }),
    paidAt: timestamp('paid_at', { withTimezone: false }),
    postedAt: timestamp('posted_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('expense_requests_company_idx').on(t.companyId),
    byBranchStatus: index('expense_requests_branch_status_idx').on(t.branchId, t.status),
    byCategory: index('expense_requests_category_idx').on(t.expenseCategoryId),
  }),
);

export const pettyCashReplenishments = pgTable(
  'petty_cash_replenishments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    pettyCashFundId: varchar('petty_cash_fund_id', { length: 25 })
      .notNull()
      .references(() => pettyCashFunds.id),
    companyBankAccountId: varchar('company_bank_account_id', { length: 25 })
      .notNull()
      .references(() => companyBankAccounts.id),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull(),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 }).references(() => users.id),
    journalEntryId: varchar('journal_entry_id', { length: 25 }).references(() => journalEntries.id),
    referenceNo: varchar('reference_no', { length: 100 }),
    notes: varchar('notes', { length: 1000 }),
    replenishedAt: timestamp('replenished_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('petty_cash_replenishments_company_idx').on(t.companyId),
    byBranch: index('petty_cash_replenishments_branch_idx').on(t.branchId),
  }),
);

export const cashToBankTransfers = pgTable(
  'cash_to_bank_transfers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    companyBankAccountId: varchar('company_bank_account_id', { length: 25 })
      .notNull()
      .references(() => companyBankAccounts.id),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull(),
    referenceNo: varchar('reference_no', { length: 100 }),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 }).references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    journalEntryId: varchar('journal_entry_id', { length: 25 }).references(() => journalEntries.id),
    transferredAt: timestamp('transferred_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('cash_to_bank_transfers_company_idx').on(t.companyId),
    byBranch: index('cash_to_bank_transfers_branch_idx').on(t.branchId),
  }),
);

export const taxFilingPeriods = pgTable(
  'tax_filing_periods',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    dateFrom: timestamp('date_from', { withTimezone: false }).notNull(),
    dateTo: timestamp('date_to', { withTimezone: false }).notNull(),
    status: smallint('status').notNull().default(TaxFilingPeriodStatus.OPEN),
    notes: varchar('notes', { length: 1000 }),
    createdByUserId: varchar('created_by_user_id', { length: 25 }).references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: false }),
    closedAt: timestamp('closed_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('tax_filing_periods_company_idx').on(t.companyId),
    byStatus: index('tax_filing_periods_status_idx').on(t.companyId, t.status),
  }),
);

export const taxJournalItems = pgTable(
  'tax_journal_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    sourceType: smallint('source_type').notNull().default(JournalSourceType.TAX),
    sourceId: varchar('source_id', { length: 60 }),
    journalEntryId: varchar('journal_entry_id', { length: 25 }).references(() => journalEntries.id),
    taxProfileId: varchar('tax_profile_id', { length: 25 }).references(() => taxProfiles.id),
    postingDate: timestamp('posting_date', { withTimezone: false }).notNull().defaultNow(),
    taxBasePsw: bigint('tax_base_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    taxTotalPsw: bigint('tax_total_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    vatPsw: bigint('vat_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    getfundPsw: bigint('getfund_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    nhilPsw: bigint('nhil_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    covidPsw: bigint('covid_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    filingStatus: smallint('filing_status').notNull().default(TaxFilingStatus.UNFILED),
    filingPeriodId: varchar('filing_period_id', { length: 25 }).references(
      () => taxFilingPeriods.id,
    ),
    excludedReason: text('excluded_reason'),
    recordedByUserId: varchar('recorded_by_user_id', { length: 25 }).references(() => users.id),
    reviewedByUserId: varchar('reviewed_by_user_id', { length: 25 }).references(() => users.id),
    filedByUserId: varchar('filed_by_user_id', { length: 25 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: false }),
    filedAt: timestamp('filed_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('tax_journal_items_company_idx').on(t.companyId),
    byBranchDate: index('tax_journal_items_branch_date_idx').on(t.branchId, t.postingDate),
    byStatus: index('tax_journal_items_status_idx').on(t.companyId, t.filingStatus),
    bySource: index('tax_journal_items_source_idx').on(t.sourceType, t.sourceId),
  }),
);

export const taxFilingRuns = pgTable(
  'tax_filing_runs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    filingPeriodId: varchar('filing_period_id', { length: 25 })
      .notNull()
      .references(() => taxFilingPeriods.id),
    generatedByUserId: varchar('generated_by_user_id', { length: 25 }).references(() => users.id),
    reportSnapshotJson: jsonb('report_snapshot_json'),
    generatedAt: timestamp('generated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('tax_filing_runs_company_idx').on(t.companyId),
    byPeriod: index('tax_filing_runs_period_idx').on(t.filingPeriodId),
  }),
);

export const taxFilingAuditLogs = pgTable(
  'tax_filing_audit_logs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    taxJournalItemId: varchar('tax_journal_item_id', { length: 25 })
      .notNull()
      .references(() => taxJournalItems.id),
    action: varchar('action', { length: 80 }).notNull(),
    oldStatus: smallint('old_status'),
    newStatus: smallint('new_status'),
    reason: text('reason'),
    actedByUserId: varchar('acted_by_user_id', { length: 25 }).references(() => users.id),
    actedAt: timestamp('acted_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byItem: index('tax_filing_audit_logs_item_idx').on(t.taxJournalItemId),
  }),
);
