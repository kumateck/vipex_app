CREATE TABLE "payroll_overtime_entries" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_period_id" varchar(25) NOT NULL REFERENCES "payroll_periods"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "overtime_minutes" bigint DEFAULT 0 NOT NULL,
  "rate_per_hour_psw" bigint DEFAULT 0 NOT NULL,
  "multiplier_pct" bigint DEFAULT 100 NOT NULL,
  "notes" text,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_overtime_entries_cycle_employee_idx"
  ON "payroll_overtime_entries" USING btree ("payroll_period_id", "employee_id");
CREATE INDEX "payroll_overtime_entries_company_cycle_idx"
  ON "payroll_overtime_entries" USING btree ("company_id", "payroll_period_id");

CREATE TABLE "payroll_manual_adjustments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "payroll_period_id" varchar(25) NOT NULL REFERENCES "payroll_periods"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "item_type" smallint DEFAULT 0 NOT NULL,
  "earning_type_id" varchar(25) REFERENCES "earning_types"("id"),
  "deduction_type_id" varchar(25) REFERENCES "deduction_types"("id"),
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "amount_psw" bigint DEFAULT 0 NOT NULL,
  "is_taxable" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payroll_manual_adjustments_cycle_employee_idx"
  ON "payroll_manual_adjustments" USING btree ("payroll_period_id", "employee_id");
CREATE INDEX "payroll_manual_adjustments_company_cycle_idx"
  ON "payroll_manual_adjustments" USING btree ("company_id", "payroll_period_id");
