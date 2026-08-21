import { createId } from '@paralleldrive/cuid2';
import { boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { branches, companies, users } from './core';

export const operationsExceptionsBriefs = pgTable(
  'operations_exceptions_briefs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    generatedByUserId: varchar('generated_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    periodFrom: timestamp('period_from', { withTimezone: false }).notNull(),
    periodTo: timestamp('period_to', { withTimezone: false }).notNull(),
    groundingSnapshot: text('grounding_snapshot').notNull(),
    narrative: text('narrative'),
    provider: varchar('provider', { length: 30 }),
    succeeded: boolean('succeeded').notNull().default(true),
    errorReason: varchar('error_reason', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyCreatedAt: index('operations_exceptions_briefs_company_created_at_idx').on(
      t.companyId,
      t.createdAt,
    ),
  }),
);
