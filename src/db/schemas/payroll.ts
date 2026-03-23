import {
  bigint,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  smallint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';
import { employees } from './hr';
import {
  PayrollFrequency,
  PayrollItemType,
  PayrollPeriodStatus,
  PayrollRunStatus,
  PayType,
  CompensationItemCalculationType,
} from './enums';
import { taxProfiles, journalBatches } from './accounting';

export const payrollGroups = pgTable(
  'payroll_groups',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    payFrequency: smallint('pay_frequency').notNull().default(PayrollFrequency.MONTHLY),
    currencyCode: varchar('currency_code', { length: 10 }).notNull().default('GHS'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('payroll_groups_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('payroll_groups_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const earningTypes = pgTable(
  'earning_types',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    isTaxable: boolean('is_taxable').notNull().default(true),
    isRecurring: boolean('is_recurring').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('earning_types_company_idx').on(t.companyId),
    uqCompanyCode: uniqueIndex('earning_types_company_code_uq').on(t.companyId, t.code),
  }),
);

export const deductionTypes = pgTable(
  'deduction_types',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    isStatutory: boolean('is_statutory').notNull().default(false),
    isRecurring: boolean('is_recurring').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('deduction_types_company_idx').on(t.companyId),
    uqCompanyCode: uniqueIndex('deduction_types_company_code_uq').on(t.companyId, t.code),
  }),
);

export const employeeCompensation = pgTable(
  'employee_compensation',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    employeeId: varchar('employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    payrollGroupId: varchar('payroll_group_id', { length: 25 })
      .notNull()
      .references(() => payrollGroups.id),
    payType: smallint('pay_type').notNull().default(PayType.MONTHLY),
    currencyCode: varchar('currency_code', { length: 10 }).notNull().default('GHS'),
    basePayPsw: bigint('base_pay_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    effectiveFrom: timestamp('effective_from', { withTimezone: false }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: false }),
    isActive: boolean('is_active').notNull().default(true),
    taxProfileId: varchar('tax_profile_id', { length: 25 }).references(() => taxProfiles.id),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byEmployee: index('employee_compensation_employee_idx').on(t.employeeId, t.effectiveFrom),
    byCompanyPayrollGroup: index('employee_compensation_company_group_idx').on(
      t.companyId,
      t.payrollGroupId,
    ),
  }),
);

export const employeeCompensationItems = pgTable(
  'employee_compensation_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    employeeCompensationId: varchar('employee_compensation_id', { length: 25 })
      .notNull()
      .references(() => employeeCompensation.id),
    itemType: smallint('item_type').notNull().default(PayrollItemType.EARNING),
    earningTypeId: varchar('earning_type_id', { length: 25 }).references(() => earningTypes.id),
    deductionTypeId: varchar('deduction_type_id', { length: 25 }).references(
      () => deductionTypes.id,
    ),
    calculationType: smallint('calculation_type')
      .notNull()
      .default(CompensationItemCalculationType.FIXED),
    amountPsw: bigint('amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    percentageBasis: varchar('percentage_basis', { length: 50 }),
    isRecurring: boolean('is_recurring').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: false }),
    effectiveTo: timestamp('effective_to', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompensation: index('employee_compensation_items_comp_idx').on(t.employeeCompensationId),
  }),
);

export const payrollPeriods = pgTable(
  'payroll_periods',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    payrollGroupId: varchar('payroll_group_id', { length: 25 })
      .notNull()
      .references(() => payrollGroups.id),
    name: varchar('name', { length: 255 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: false }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: false }).notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: false }),
    status: smallint('status').notNull().default(PayrollPeriodStatus.DRAFT),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatus: index('payroll_periods_company_status_idx').on(t.companyId, t.status),
    uqGroupWindow: uniqueIndex('payroll_periods_group_window_uq').on(
      t.payrollGroupId,
      t.periodStart,
      t.periodEnd,
    ),
  }),
);

export const payrollRuns = pgTable(
  'payroll_runs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    payrollPeriodId: varchar('payroll_period_id', { length: 25 })
      .notNull()
      .references(() => payrollPeriods.id),
    status: smallint('status').notNull().default(PayrollRunStatus.DRAFT),
    startedBy: varchar('started_by', { length: 25 }).references(() => users.id),
    startedAt: timestamp('started_at', { withTimezone: false }),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    journalBatchId: varchar('journal_batch_id', { length: 25 }).references(() => journalBatches.id),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byPeriodStatus: index('payroll_runs_period_status_idx').on(t.payrollPeriodId, t.status),
  }),
);

export const payrollRunEmployees = pgTable(
  'payroll_run_employees',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    payrollRunId: varchar('payroll_run_id', { length: 25 })
      .notNull()
      .references(() => payrollRuns.id),
    employeeId: varchar('employee_id', { length: 25 })
      .notNull()
      .references(() => employees.id),
    employeeNumberSnapshot: varchar('employee_number_snapshot', { length: 50 }).notNull(),
    employeeNameSnapshot: varchar('employee_name_snapshot', { length: 255 }).notNull(),
    branchIdSnapshot: varchar('branch_id_snapshot', { length: 25 }),
    departmentNameSnapshot: varchar('department_name_snapshot', { length: 255 }),
    jobTitleNameSnapshot: varchar('job_title_name_snapshot', { length: 255 }),
    basePayPsw: bigint('base_pay_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    grossPayPsw: bigint('gross_pay_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    totalDeductionsPsw: bigint('total_deductions_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    netPayPsw: bigint('net_pay_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    currencyCode: varchar('currency_code', { length: 10 }).notNull().default('GHS'),
    status: varchar('status', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyEmployee: index('payroll_run_employees_company_employee_idx').on(
      t.companyId,
      t.employeeId,
    ),
    uqRunEmployee: uniqueIndex('payroll_run_employees_run_employee_uq').on(
      t.payrollRunId,
      t.employeeId,
    ),
  }),
);

export const payrollRunItems = pgTable(
  'payroll_run_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    payrollRunEmployeeId: varchar('payroll_run_employee_id', { length: 25 })
      .notNull()
      .references(() => payrollRunEmployees.id),
    itemType: smallint('item_type').notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    amountPsw: bigint('amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    isTaxable: boolean('is_taxable').notNull().default(false),
    source: varchar('source', { length: 50 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byRunEmployeeType: index('payroll_run_items_run_employee_type_idx').on(
      t.payrollRunEmployeeId,
      t.itemType,
    ),
  }),
);

export const payslips = pgTable(
  'payslips',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    payrollRunEmployeeId: varchar('payroll_run_employee_id', { length: 25 })
      .notNull()
      .references(() => payrollRunEmployees.id),
    payslipNumber: varchar('payslip_number', { length: 50 }).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: false }),
    deliveryStatus: varchar('delivery_status', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqCompanyPayslipNumber: uniqueIndex('payslips_company_number_uq').on(
      t.companyId,
      t.payslipNumber,
    ),
    uqRunEmployee: uniqueIndex('payslips_run_employee_uq').on(t.payrollRunEmployeeId),
  }),
);
