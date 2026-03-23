CREATE TABLE "chart_of_accounts" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(30) NOT NULL,
  "name" varchar(255) NOT NULL,
  "account_class" smallint NOT NULL DEFAULT 0,
  "parent_account_id" varchar(25),
  "is_postable" boolean NOT NULL DEFAULT true,
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "chart_of_accounts_company_code_uq" ON "chart_of_accounts" ("company_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "chart_of_accounts_company_lower_name_uq" ON "chart_of_accounts" ("company_id", lower("name"));
--> statement-breakpoint
CREATE INDEX "chart_of_accounts_company_idx" ON "chart_of_accounts" ("company_id");
--> statement-breakpoint
CREATE INDEX "chart_of_accounts_class_idx" ON "chart_of_accounts" ("company_id","account_class");
--> statement-breakpoint

CREATE TABLE "company_bank_accounts" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "account_id" varchar(25) NOT NULL REFERENCES "chart_of_accounts"("id"),
  "name" varchar(255) NOT NULL,
  "bank_name" varchar(255),
  "branch_name" varchar(255),
  "account_number_masked" varchar(100),
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "company_bank_accounts_company_lower_name_uq" ON "company_bank_accounts" ("company_id", lower("name"));
--> statement-breakpoint
CREATE INDEX "company_bank_accounts_company_idx" ON "company_bank_accounts" ("company_id");
--> statement-breakpoint

CREATE TABLE "expense_categories" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(40) NOT NULL,
  "name" varchar(255) NOT NULL,
  "account_id" varchar(25) NOT NULL REFERENCES "chart_of_accounts"("id"),
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_company_code_uq" ON "expense_categories" ("company_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_company_lower_name_uq" ON "expense_categories" ("company_id", lower("name"));
--> statement-breakpoint
CREATE INDEX "expense_categories_company_idx" ON "expense_categories" ("company_id");
--> statement-breakpoint

CREATE TABLE "accounting_approval_policies" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "policy_code" varchar(60) NOT NULL,
  "name" varchar(255) NOT NULL,
  "amount_limit_psw" bigint NOT NULL DEFAULT 0,
  "requires_head_office_approval" boolean NOT NULL DEFAULT false,
  "applies_to_funding_source" smallint,
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_approval_policies_company_code_uq" ON "accounting_approval_policies" ("company_id","policy_code");
--> statement-breakpoint
CREATE INDEX "accounting_approval_policies_company_idx" ON "accounting_approval_policies" ("company_id");
--> statement-breakpoint

CREATE TABLE "petty_cash_funds" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "account_id" varchar(25) NOT NULL REFERENCES "chart_of_accounts"("id"),
  "target_float_psw" bigint NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "petty_cash_funds_branch_uq" ON "petty_cash_funds" ("company_id","branch_id");
--> statement-breakpoint
CREATE INDEX "petty_cash_funds_company_idx" ON "petty_cash_funds" ("company_id");
--> statement-breakpoint

CREATE TABLE "journal_batches" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "source_type" smallint NOT NULL DEFAULT 0,
  "source_id" varchar(60),
  "batch_date" timestamp NOT NULL DEFAULT now(),
  "description" varchar(500),
  "posted_by" varchar(25),
  "posted_at" timestamp,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "journal_batches_company_idx" ON "journal_batches" ("company_id");
--> statement-breakpoint
CREATE INDEX "journal_batches_source_idx" ON "journal_batches" ("company_id","source_type","source_id");
--> statement-breakpoint

CREATE TABLE "journal_entries" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "batch_id" varchar(25) NOT NULL REFERENCES "journal_batches"("id"),
  "source_type" smallint NOT NULL DEFAULT 0,
  "source_id" varchar(60),
  "entry_date" timestamp NOT NULL DEFAULT now(),
  "memo" varchar(500),
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "recorded_by_user_id" varchar(25) REFERENCES "users"("id"),
  "approved_by_user_id" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "journal_entries_company_idx" ON "journal_entries" ("company_id");
--> statement-breakpoint
CREATE INDEX "journal_entries_batch_idx" ON "journal_entries" ("batch_id");
--> statement-breakpoint
CREATE INDEX "journal_entries_branch_date_idx" ON "journal_entries" ("branch_id","entry_date");
--> statement-breakpoint

CREATE TABLE "journal_lines" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "entry_id" varchar(25) NOT NULL REFERENCES "journal_entries"("id"),
  "account_id" varchar(25) NOT NULL REFERENCES "chart_of_accounts"("id"),
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "recorded_by_user_id" varchar(25) REFERENCES "users"("id"),
  "debit_psw" bigint NOT NULL DEFAULT 0,
  "credit_psw" bigint NOT NULL DEFAULT 0,
  "description" varchar(500),
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "journal_lines_company_idx" ON "journal_lines" ("company_id");
--> statement-breakpoint
CREATE INDEX "journal_lines_entry_idx" ON "journal_lines" ("entry_id");
--> statement-breakpoint
CREATE INDEX "journal_lines_account_idx" ON "journal_lines" ("account_id");
--> statement-breakpoint
CREATE INDEX "journal_lines_branch_account_idx" ON "journal_lines" ("branch_id","account_id");
--> statement-breakpoint

CREATE TABLE "daily_cash_confirmations" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "cashier_user_id" varchar(25) REFERENCES "users"("id"),
  "accountant_user_id" varchar(25) REFERENCES "users"("id"),
  "confirmation_date" timestamp NOT NULL,
  "expected_cash_psw" bigint NOT NULL DEFAULT 0,
  "counted_cash_psw" bigint NOT NULL DEFAULT 0,
  "shortage_psw" bigint NOT NULL DEFAULT 0,
  "overage_psw" bigint NOT NULL DEFAULT 0,
  "notes" varchar(1000),
  "status" smallint NOT NULL DEFAULT 0,
  "journal_entry_id" varchar(25) REFERENCES "journal_entries"("id"),
  "confirmed_at" timestamp,
  "posted_at" timestamp,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "daily_cash_confirmations_scope_uq" ON "daily_cash_confirmations" ("company_id","branch_id","location_id","cashier_user_id","confirmation_date");
--> statement-breakpoint
CREATE INDEX "daily_cash_confirmations_company_idx" ON "daily_cash_confirmations" ("company_id");
--> statement-breakpoint
CREATE INDEX "daily_cash_confirmations_branch_date_idx" ON "daily_cash_confirmations" ("branch_id","confirmation_date");
--> statement-breakpoint

CREATE TABLE "expense_requests" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "expense_category_id" varchar(25) NOT NULL REFERENCES "expense_categories"("id"),
  "amount_psw" bigint NOT NULL,
  "funding_source" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "purpose" varchar(1000) NOT NULL,
  "reference_no" varchar(100),
  "requested_by_user_id" varchar(25) NOT NULL REFERENCES "users"("id"),
  "recorded_by_user_id" varchar(25) NOT NULL REFERENCES "users"("id"),
  "approved_by_user_id" varchar(25) REFERENCES "users"("id"),
  "paid_by_user_id" varchar(25) REFERENCES "users"("id"),
  "company_bank_account_id" varchar(25) REFERENCES "company_bank_accounts"("id"),
  "journal_entry_id" varchar(25) REFERENCES "journal_entries"("id"),
  "approval_reason" varchar(1000),
  "rejection_reason" varchar(1000),
  "paid_at" timestamp,
  "posted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "expense_requests_company_idx" ON "expense_requests" ("company_id");
--> statement-breakpoint
CREATE INDEX "expense_requests_branch_status_idx" ON "expense_requests" ("branch_id","status");
--> statement-breakpoint
CREATE INDEX "expense_requests_category_idx" ON "expense_requests" ("expense_category_id");
--> statement-breakpoint

CREATE TABLE "petty_cash_replenishments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "petty_cash_fund_id" varchar(25) NOT NULL REFERENCES "petty_cash_funds"("id"),
  "company_bank_account_id" varchar(25) NOT NULL REFERENCES "company_bank_accounts"("id"),
  "amount_psw" bigint NOT NULL,
  "approved_by_user_id" varchar(25) REFERENCES "users"("id"),
  "recorded_by_user_id" varchar(25) REFERENCES "users"("id"),
  "journal_entry_id" varchar(25) REFERENCES "journal_entries"("id"),
  "reference_no" varchar(100),
  "notes" varchar(1000),
  "replenished_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "petty_cash_replenishments_company_idx" ON "petty_cash_replenishments" ("company_id");
--> statement-breakpoint
CREATE INDEX "petty_cash_replenishments_branch_idx" ON "petty_cash_replenishments" ("branch_id");
--> statement-breakpoint

CREATE TABLE "cash_to_bank_transfers" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "company_bank_account_id" varchar(25) NOT NULL REFERENCES "company_bank_accounts"("id"),
  "amount_psw" bigint NOT NULL,
  "reference_no" varchar(100),
  "recorded_by_user_id" varchar(25) REFERENCES "users"("id"),
  "approved_by_user_id" varchar(25) REFERENCES "users"("id"),
  "journal_entry_id" varchar(25) REFERENCES "journal_entries"("id"),
  "transferred_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "cash_to_bank_transfers_company_idx" ON "cash_to_bank_transfers" ("company_id");
--> statement-breakpoint
CREATE INDEX "cash_to_bank_transfers_branch_idx" ON "cash_to_bank_transfers" ("branch_id");
--> statement-breakpoint

CREATE TABLE "tax_filing_periods" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "date_from" timestamp NOT NULL,
  "date_to" timestamp NOT NULL,
  "status" smallint NOT NULL DEFAULT 0,
  "notes" varchar(1000),
  "created_by_user_id" varchar(25) REFERENCES "users"("id"),
  "submitted_at" timestamp,
  "closed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "tax_filing_periods_company_idx" ON "tax_filing_periods" ("company_id");
--> statement-breakpoint
CREATE INDEX "tax_filing_periods_status_idx" ON "tax_filing_periods" ("company_id","status");
--> statement-breakpoint

CREATE TABLE "tax_journal_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "source_type" smallint NOT NULL DEFAULT 5,
  "source_id" varchar(60),
  "journal_entry_id" varchar(25) REFERENCES "journal_entries"("id"),
  "tax_profile_id" varchar(25) REFERENCES "tax_profiles"("id"),
  "posting_date" timestamp NOT NULL DEFAULT now(),
  "tax_base_psw" bigint NOT NULL DEFAULT 0,
  "tax_total_psw" bigint NOT NULL DEFAULT 0,
  "vat_psw" bigint NOT NULL DEFAULT 0,
  "getfund_psw" bigint NOT NULL DEFAULT 0,
  "nhil_psw" bigint NOT NULL DEFAULT 0,
  "covid_psw" bigint NOT NULL DEFAULT 0,
  "filing_status" smallint NOT NULL DEFAULT 0,
  "filing_period_id" varchar(25) REFERENCES "tax_filing_periods"("id"),
  "excluded_reason" text,
  "recorded_by_user_id" varchar(25) REFERENCES "users"("id"),
  "reviewed_by_user_id" varchar(25) REFERENCES "users"("id"),
  "filed_by_user_id" varchar(25) REFERENCES "users"("id"),
  "reviewed_at" timestamp,
  "filed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "tax_journal_items_company_idx" ON "tax_journal_items" ("company_id");
--> statement-breakpoint
CREATE INDEX "tax_journal_items_branch_date_idx" ON "tax_journal_items" ("branch_id","posting_date");
--> statement-breakpoint
CREATE INDEX "tax_journal_items_status_idx" ON "tax_journal_items" ("company_id","filing_status");
--> statement-breakpoint
CREATE INDEX "tax_journal_items_source_idx" ON "tax_journal_items" ("source_type","source_id");
--> statement-breakpoint

CREATE TABLE "tax_filing_runs" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "filing_period_id" varchar(25) NOT NULL REFERENCES "tax_filing_periods"("id"),
  "generated_by_user_id" varchar(25) REFERENCES "users"("id"),
  "report_snapshot_json" jsonb,
  "generated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "tax_filing_runs_company_idx" ON "tax_filing_runs" ("company_id");
--> statement-breakpoint
CREATE INDEX "tax_filing_runs_period_idx" ON "tax_filing_runs" ("filing_period_id");
--> statement-breakpoint

CREATE TABLE "tax_filing_audit_logs" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "tax_journal_item_id" varchar(25) NOT NULL REFERENCES "tax_journal_items"("id"),
  "action" varchar(80) NOT NULL,
  "old_status" smallint,
  "new_status" smallint,
  "reason" text,
  "acted_by_user_id" varchar(25) REFERENCES "users"("id"),
  "acted_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "tax_filing_audit_logs_item_idx" ON "tax_filing_audit_logs" ("tax_journal_item_id");
