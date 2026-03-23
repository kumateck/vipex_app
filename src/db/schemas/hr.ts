import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  smallint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { branches, companies, locations, users } from './core';
import { AttendanceStatus, EmploymentStatus, EmploymentType, Gender } from './enums';

export const departments = pgTable(
  'departments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 50 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('departments_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('departments_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
    uqCompanyCode: uniqueIndex('departments_company_code_uq').on(t.companyId, t.code),
  }),
);

export const jobTitles = pgTable(
  'job_titles',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    code: varchar('code', { length: 50 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('job_titles_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('job_titles_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
    uqCompanyCode: uniqueIndex('job_titles_company_code_uq').on(t.companyId, t.code),
  }),
);

export const employees = pgTable(
  'employees',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    employeeNumber: varchar('employee_number', { length: 50 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    telephone: varchar('telephone', { length: 30 }).notNull(),
    alternatePhone: varchar('alternate_phone', { length: 30 }),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: false }),
    gender: smallint('gender').default(Gender.UNSPECIFIED),
    maritalStatus: varchar('marital_status', { length: 50 }),
    nationalIdType: smallint('national_id_type'),
    nationalIdNumber: varchar('national_id_number', { length: 100 }),
    taxId: varchar('tax_id', { length: 100 }),
    ssnitNumber: varchar('ssnit_number', { length: 100 }),
    address: varchar('address', { length: 255 }),
    city: varchar('city', { length: 100 }),
    country: varchar('country', { length: 100 }),
    emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 30 }),
    paymentMethod: varchar('payment_method', { length: 30 }),
    bankName: varchar('bank_name', { length: 255 }),
    bankAccountName: varchar('bank_account_name', { length: 255 }),
    bankAccountNumber: varchar('bank_account_number', { length: 100 }),
    mobileMoneyNumber: varchar('mobile_money_number', { length: 30 }),
    employmentStatus: smallint('employment_status').notNull().default(EmploymentStatus.ACTIVE),
    employmentType: smallint('employment_type').notNull().default(EmploymentType.FULL_TIME),
    hireDate: timestamp('hire_date', { withTimezone: false }).notNull(),
    confirmationDate: timestamp('confirmation_date', { withTimezone: false }),
    terminationDate: timestamp('termination_date', { withTimezone: false }),
    terminationReason: text('termination_reason'),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    departmentId: varchar('department_id', { length: 25 }).references(() => departments.id),
    jobTitleId: varchar('job_title_id', { length: 25 }).references(() => jobTitles.id),
    managerEmployeeId: varchar('manager_employee_id', { length: 25 }),
    hasUserAccount: boolean('has_user_account').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('employees_company_idx').on(t.companyId),
    byStatus: index('employees_company_status_idx').on(t.companyId, t.employmentStatus),
    byBranch: index('employees_company_branch_idx').on(t.companyId, t.branchId),
    byDepartment: index('employees_company_department_idx').on(t.companyId, t.departmentId),
    byManager: index('employees_manager_idx').on(t.managerEmployeeId),
    uqCompanyEmployeeNumber: uniqueIndex('employees_company_employee_number_uq').on(
      t.companyId,
      t.employeeNumber,
    ),
    uqCompanyLowerEmail: uniqueIndex('employees_company_lower_email_uq').on(
      t.companyId,
      sql`lower(${t.email})`,
    ),
  }),
);

export const employeeJobAssignments = pgTable(
  'employee_job_assignments',
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
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    departmentId: varchar('department_id', { length: 25 }).references(() => departments.id),
    jobTitleId: varchar('job_title_id', { length: 25 }).references(() => jobTitles.id),
    managerEmployeeId: varchar('manager_employee_id', { length: 25 }),
    effectiveFrom: timestamp('effective_from', { withTimezone: false }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: false }),
    reason: varchar('reason', { length: 255 }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byEmployee: index('employee_job_assignments_employee_idx').on(t.employeeId, t.effectiveFrom),
    byCompanyBranch: index('employee_job_assignments_company_branch_idx').on(
      t.companyId,
      t.branchId,
    ),
  }),
);

export const employeeDocuments = pgTable(
  'employee_documents',
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
    documentType: varchar('document_type', { length: 100 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: text('file_url').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    notes: text('notes'),
    uploadedBy: varchar('uploaded_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byEmployee: index('employee_documents_employee_idx').on(t.employeeId),
  }),
);

export const attendanceRecords = pgTable(
  'attendance_records',
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
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    attendanceDate: timestamp('attendance_date', { withTimezone: false }).notNull(),
    checkInAt: timestamp('check_in_at', { withTimezone: false }),
    checkOutAt: timestamp('check_out_at', { withTimezone: false }),
    minutesWorked: integer('minutes_worked'),
    status: smallint('status').notNull().default(AttendanceStatus.PRESENT),
    source: varchar('source', { length: 50 }),
    notes: text('notes'),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyDate: index('attendance_records_company_date_idx').on(t.companyId, t.attendanceDate),
    byBranchDate: index('attendance_records_branch_date_idx').on(t.branchId, t.attendanceDate),
    uqEmployeeDate: uniqueIndex('attendance_records_employee_date_uq').on(
      t.employeeId,
      t.attendanceDate,
    ),
  }),
);
