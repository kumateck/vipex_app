import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  smallint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { CashierType, UserStatus } from './enums';

// Companies
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  code: varchar('code', { length: 255 }).notNull(),
  tin: varchar('tin', { length: 255 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Branches (unique name per company, case-insensitive)
export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    telephone: varchar('telephone', { length: 255 }),
    address: varchar('address', { length: 255 }),
    email: varchar('email', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('branches_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('branches_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Locations (unique name per branch, case-insensitive)
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    name: varchar('name', { length: 255 }).notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('locations_company_idx').on(t.companyId),
    byBranch: index('locations_branch_idx').on(t.branchId),
    uqBranchLowerName: uniqueIndex('locations_branch_lower_name_uq').on(
      t.branchId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Statuses (unique per company, case-insensitive)
export const statuses = pgTable(
  'statuses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    type: smallint('type').notNull().default(CashierType.SENDING),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 255 }).notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('statuses_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('statuses_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Roles (unique per company, case-insensitive)
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('roles_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('roles_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Permissions
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    permission: varchar('permission', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    permType: varchar('perm_type', { length: 255 }).notNull(),
    permIcon: varchar('perm_icon', { length: 255 }),
    permParent: varchar('perm_parent', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('permissions_company_idx').on(t.companyId),
  }),
);

// Role Permissions
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Users (status is smallint; map in app with your enums)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullname: varchar('fullname', { length: 255 }).notNull(),
  telephone: varchar('telephone', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  status: smallint('status').notNull().default(UserStatus.INVITED), // INVITED default
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  branchId: uuid('branch_id')
    .notNull()
    .references(() => branches.id),
  createdBy: uuid('created_by').notNull(),
  taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});
