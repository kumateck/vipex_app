import { pgTable, varchar, timestamp, json, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    actorUserId: varchar('actor_user_id', { length: 25 }).references(() => users.id),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 25 }),
    action: varchar('action', { length: 120 }).notNull(),
    message: varchar('message', { length: 1000 }),
    metadata: json('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('audit_logs_company_idx').on(t.companyId),
    byActor: index('audit_logs_actor_idx').on(t.actorUserId),
    byEntity: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    byAction: index('audit_logs_action_idx').on(t.action),
    byCreated: index('audit_logs_created_idx').on(t.createdAt),
  }),
);
