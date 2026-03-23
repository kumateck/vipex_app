CREATE TABLE "module_catalog" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_core" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "module_catalog_lower_code_uq"
  ON "module_catalog" USING btree (lower("code"));

CREATE TABLE "company_modules" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "module_code" varchar(50) NOT NULL,
  "is_enabled" boolean DEFAULT false NOT NULL,
  "enabled_at" timestamp,
  "disabled_at" timestamp,
  "configured_by" varchar(25) REFERENCES "users"("id"),
  "settings" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "company_modules_company_idx"
  ON "company_modules" USING btree ("company_id");
CREATE INDEX "company_modules_company_enabled_idx"
  ON "company_modules" USING btree ("company_id", "is_enabled");
CREATE UNIQUE INDEX "company_modules_company_module_code_uq"
  ON "company_modules" USING btree ("company_id", "module_code");

CREATE TABLE "departments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(50),
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "departments_company_idx"
  ON "departments" USING btree ("company_id");
CREATE UNIQUE INDEX "departments_company_lower_name_uq"
  ON "departments" USING btree ("company_id", lower("name"));
CREATE UNIQUE INDEX "departments_company_code_uq"
  ON "departments" USING btree ("company_id", "code");

CREATE TABLE "job_titles" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(50),
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "job_titles_company_idx"
  ON "job_titles" USING btree ("company_id");
CREATE UNIQUE INDEX "job_titles_company_lower_name_uq"
  ON "job_titles" USING btree ("company_id", lower("name"));
CREATE UNIQUE INDEX "job_titles_company_code_uq"
  ON "job_titles" USING btree ("company_id", "code");

CREATE TABLE "employees" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_number" varchar(50) NOT NULL,
  "first_name" varchar(100) NOT NULL,
  "middle_name" varchar(100),
  "last_name" varchar(100) NOT NULL,
  "display_name" varchar(255) NOT NULL,
  "email" varchar(255),
  "telephone" varchar(30) NOT NULL,
  "alternate_phone" varchar(30),
  "date_of_birth" timestamp,
  "gender" smallint DEFAULT 3,
  "marital_status" varchar(50),
  "national_id_type" smallint,
  "national_id_number" varchar(100),
  "tax_id" varchar(100),
  "ssnit_number" varchar(100),
  "address" varchar(255),
  "city" varchar(100),
  "country" varchar(100),
  "emergency_contact_name" varchar(255),
  "emergency_contact_phone" varchar(30),
  "employment_status" smallint DEFAULT 0 NOT NULL,
  "employment_type" smallint DEFAULT 0 NOT NULL,
  "hire_date" timestamp NOT NULL,
  "confirmation_date" timestamp,
  "termination_date" timestamp,
  "termination_reason" text,
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "department_id" varchar(25) REFERENCES "departments"("id"),
  "job_title_id" varchar(25) REFERENCES "job_titles"("id"),
  "manager_employee_id" varchar(25),
  "has_user_account" boolean DEFAULT false NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "employees_company_idx"
  ON "employees" USING btree ("company_id");
CREATE INDEX "employees_company_status_idx"
  ON "employees" USING btree ("company_id", "employment_status");
CREATE INDEX "employees_company_branch_idx"
  ON "employees" USING btree ("company_id", "branch_id");
CREATE INDEX "employees_company_department_idx"
  ON "employees" USING btree ("company_id", "department_id");
CREATE INDEX "employees_manager_idx"
  ON "employees" USING btree ("manager_employee_id");
CREATE UNIQUE INDEX "employees_company_employee_number_uq"
  ON "employees" USING btree ("company_id", "employee_number");
CREATE UNIQUE INDEX "employees_company_lower_email_uq"
  ON "employees" USING btree ("company_id", lower("email"));

CREATE TABLE "employee_job_assignments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "department_id" varchar(25) REFERENCES "departments"("id"),
  "job_title_id" varchar(25) REFERENCES "job_titles"("id"),
  "manager_employee_id" varchar(25),
  "effective_from" timestamp NOT NULL,
  "effective_to" timestamp,
  "reason" varchar(255),
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "employee_job_assignments_employee_idx"
  ON "employee_job_assignments" USING btree ("employee_id", "effective_from");
CREATE INDEX "employee_job_assignments_company_branch_idx"
  ON "employee_job_assignments" USING btree ("company_id", "branch_id");

CREATE TABLE "employee_documents" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "document_type" varchar(100) NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_url" text NOT NULL,
  "issued_at" timestamp,
  "expires_at" timestamp,
  "notes" text,
  "uploaded_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "employee_documents_employee_idx"
  ON "employee_documents" USING btree ("employee_id");

CREATE TABLE "attendance_records" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "location_id" varchar(25) REFERENCES "locations"("id"),
  "attendance_date" timestamp NOT NULL,
  "check_in_at" timestamp,
  "check_out_at" timestamp,
  "minutes_worked" integer,
  "status" smallint DEFAULT 0 NOT NULL,
  "source" varchar(50),
  "notes" text,
  "approved_by" varchar(25) REFERENCES "users"("id"),
  "approved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "attendance_records_company_date_idx"
  ON "attendance_records" USING btree ("company_id", "attendance_date");
CREATE INDEX "attendance_records_branch_date_idx"
  ON "attendance_records" USING btree ("branch_id", "attendance_date");
CREATE UNIQUE INDEX "attendance_records_employee_date_uq"
  ON "attendance_records" USING btree ("employee_id", "attendance_date");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_id" varchar(25);
CREATE INDEX "users_company_employee_idx" ON "users" USING btree ("company_id", "employee_id");
CREATE UNIQUE INDEX "users_employee_id_uq" ON "users" USING btree ("employee_id");
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;

CREATE TABLE "payroll_groups" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "pay_frequency" smallint DEFAULT 0 NOT NULL,
  "currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_groups_company_idx"
  ON "payroll_groups" USING btree ("company_id");
CREATE UNIQUE INDEX "payroll_groups_company_lower_name_uq"
  ON "payroll_groups" USING btree ("company_id", lower("name"));

CREATE TABLE "earning_types" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "is_taxable" boolean DEFAULT true NOT NULL,
  "is_recurring" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "earning_types_company_idx"
  ON "earning_types" USING btree ("company_id");
CREATE UNIQUE INDEX "earning_types_company_code_uq"
  ON "earning_types" USING btree ("company_id", "code");

CREATE TABLE "deduction_types" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "is_statutory" boolean DEFAULT false NOT NULL,
  "is_recurring" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "deduction_types_company_idx"
  ON "deduction_types" USING btree ("company_id");
CREATE UNIQUE INDEX "deduction_types_company_code_uq"
  ON "deduction_types" USING btree ("company_id", "code");

CREATE TABLE "employee_compensation" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "payroll_group_id" varchar(25) NOT NULL REFERENCES "payroll_groups"("id"),
  "pay_type" smallint DEFAULT 0 NOT NULL,
  "currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
  "base_pay_psw" bigint DEFAULT 0 NOT NULL,
  "effective_from" timestamp NOT NULL,
  "effective_to" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "tax_profile_id" varchar(25) REFERENCES "tax_profiles"("id"),
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "employee_compensation_employee_idx"
  ON "employee_compensation" USING btree ("employee_id", "effective_from");
CREATE INDEX "employee_compensation_company_group_idx"
  ON "employee_compensation" USING btree ("company_id", "payroll_group_id");

CREATE TABLE "employee_compensation_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_compensation_id" varchar(25) NOT NULL REFERENCES "employee_compensation"("id"),
  "item_type" smallint DEFAULT 0 NOT NULL,
  "earning_type_id" varchar(25) REFERENCES "earning_types"("id"),
  "deduction_type_id" varchar(25) REFERENCES "deduction_types"("id"),
  "calculation_type" smallint DEFAULT 0 NOT NULL,
  "amount_psw" bigint DEFAULT 0 NOT NULL,
  "percentage_basis" varchar(50),
  "is_recurring" boolean DEFAULT true NOT NULL,
  "effective_from" timestamp,
  "effective_to" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "employee_compensation_items_comp_idx"
  ON "employee_compensation_items" USING btree ("employee_compensation_id");

CREATE TABLE "payroll_periods" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_group_id" varchar(25) NOT NULL REFERENCES "payroll_groups"("id"),
  "name" varchar(255) NOT NULL,
  "period_start" timestamp NOT NULL,
  "period_end" timestamp NOT NULL,
  "payment_date" timestamp,
  "status" smallint DEFAULT 0 NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_periods_company_status_idx"
  ON "payroll_periods" USING btree ("company_id", "status");
CREATE UNIQUE INDEX "payroll_periods_group_window_uq"
  ON "payroll_periods" USING btree ("payroll_group_id", "period_start", "period_end");

CREATE TABLE "payroll_runs" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_period_id" varchar(25) NOT NULL REFERENCES "payroll_periods"("id"),
  "status" smallint DEFAULT 0 NOT NULL,
  "started_by" varchar(25) REFERENCES "users"("id"),
  "started_at" timestamp,
  "approved_by" varchar(25) REFERENCES "users"("id"),
  "approved_at" timestamp,
  "journal_batch_id" varchar(25) REFERENCES "journal_batches"("id"),
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_runs_period_status_idx"
  ON "payroll_runs" USING btree ("payroll_period_id", "status");

CREATE TABLE "payroll_run_employees" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_run_id" varchar(25) NOT NULL REFERENCES "payroll_runs"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "employee_number_snapshot" varchar(50) NOT NULL,
  "employee_name_snapshot" varchar(255) NOT NULL,
  "branch_id_snapshot" varchar(25),
  "department_name_snapshot" varchar(255),
  "job_title_name_snapshot" varchar(255),
  "base_pay_psw" bigint DEFAULT 0 NOT NULL,
  "gross_pay_psw" bigint DEFAULT 0 NOT NULL,
  "total_deductions_psw" bigint DEFAULT 0 NOT NULL,
  "net_pay_psw" bigint DEFAULT 0 NOT NULL,
  "currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
  "status" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_run_employees_company_employee_idx"
  ON "payroll_run_employees" USING btree ("company_id", "employee_id");
CREATE UNIQUE INDEX "payroll_run_employees_run_employee_uq"
  ON "payroll_run_employees" USING btree ("payroll_run_id", "employee_id");

CREATE TABLE "payroll_run_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_run_employee_id" varchar(25) NOT NULL REFERENCES "payroll_run_employees"("id"),
  "item_type" smallint NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "amount_psw" bigint DEFAULT 0 NOT NULL,
  "is_taxable" boolean DEFAULT false NOT NULL,
  "source" varchar(50),
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_run_items_run_employee_type_idx"
  ON "payroll_run_items" USING btree ("payroll_run_employee_id", "item_type");

CREATE TABLE "payslips" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_run_employee_id" varchar(25) NOT NULL REFERENCES "payroll_run_employees"("id"),
  "payslip_number" varchar(50) NOT NULL,
  "issued_at" timestamp,
  "delivery_status" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "payslips_company_number_uq"
  ON "payslips" USING btree ("company_id", "payslip_number");
CREATE UNIQUE INDEX "payslips_run_employee_uq"
  ON "payslips" USING btree ("payroll_run_employee_id");

INSERT INTO "module_catalog" ("id", "code", "name", "description", "is_core", "is_active")
VALUES
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'shipments', 'Shipments', 'Shipment and parcel operations', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'customers', 'Customers', 'Customer management', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'payments', 'Payments', 'Payment capture and settlement', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'accounting', 'Accounting', 'Accounting and tax operations', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'inventory', 'Inventory', 'Inventory management', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'shifts', 'Shifts', 'Shift and cashier session management', true, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'hr', 'HR', 'Human resources management', false, true),
  (substring(md5(random()::text || clock_timestamp()::text), 1, 25), 'payroll', 'Payroll', 'Payroll processing', false, true)
ON CONFLICT DO NOTHING;

INSERT INTO "company_modules" ("id", "company_id", "module_code", "is_enabled", "enabled_at", "configured_by")
SELECT
  substring(md5(random()::text || clock_timestamp()::text), 1, 25),
  c."id",
  m."code",
  CASE WHEN m."code" IN ('shipments', 'customers', 'payments', 'accounting', 'inventory', 'shifts') THEN true ELSE false END,
  CASE WHEN m."code" IN ('shipments', 'customers', 'payments', 'accounting', 'inventory', 'shifts') THEN now() ELSE null END,
  null
FROM "companies" c
CROSS JOIN "module_catalog" m
ON CONFLICT ("company_id", "module_code") DO NOTHING;
