import { createId } from '@paralleldrive/cuid2';
import { boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { companies, users } from './core';

export const aiChatConversations = pgTable(
  'ai_chat_conversations',
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
    title: varchar('title', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyUser: index('ai_chat_conversations_company_user_idx').on(t.companyId, t.userId),
  }),
);

export const aiChatMessages = pgTable(
  'ai_chat_messages',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: varchar('conversation_id', { length: 25 })
      .notNull()
      .references(() => aiChatConversations.id),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),
    toolInvocations: text('tool_invocations'),
    provider: varchar('provider', { length: 30 }),
    hitIterationCap: boolean('hit_iteration_cap').notNull().default(false),
    succeeded: boolean('succeeded').notNull().default(true),
    errorReason: varchar('error_reason', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byConversationCreatedAt: index('ai_chat_messages_conversation_created_at_idx').on(
      t.conversationId,
      t.createdAt,
    ),
    byCompanyCreatedAt: index('ai_chat_messages_company_created_at_idx').on(
      t.companyId,
      t.createdAt,
    ),
  }),
);
