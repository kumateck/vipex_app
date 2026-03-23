import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';

export const moduleCatalog = pgTable(
  'module_catalog',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isCore: boolean('is_core').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqLowerCode: uniqueIndex('module_catalog_lower_code_uq').on(sql`lower(${t.code})`),
  }),
);

export const companyModules = pgTable(
  'company_modules',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    moduleCode: varchar('module_code', { length: 50 }).notNull(),
    isEnabled: boolean('is_enabled').notNull().default(false),
    enabledAt: timestamp('enabled_at', { withTimezone: false }),
    disabledAt: timestamp('disabled_at', { withTimezone: false }),
    configuredBy: varchar('configured_by', { length: 25 }).references(() => users.id),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('company_modules_company_idx').on(t.companyId),
    byCompanyEnabled: index('company_modules_company_enabled_idx').on(t.companyId, t.isEnabled),
    uqCompanyModuleCode: uniqueIndex('company_modules_company_module_code_uq').on(
      t.companyId,
      t.moduleCode,
    ),
  }),
);
