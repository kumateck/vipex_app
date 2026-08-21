import { createId } from '@paralleldrive/cuid2';
import { boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { companies, users } from './core';

export const helpAssistantQueries = pgTable(
  'help_assistant_queries',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    question: text('question').notNull(),
    answer: text('answer'),
    provider: varchar('provider', { length: 30 }),
    matchedGuideIds: text('matched_guide_ids'),
    succeeded: boolean('succeeded').notNull().default(true),
    errorReason: varchar('error_reason', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyCreatedAt: index('help_assistant_queries_company_created_at_idx').on(
      t.companyId,
      t.createdAt,
    ),
    byUser: index('help_assistant_queries_user_idx').on(t.userId),
  }),
);
