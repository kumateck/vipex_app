import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { companies, users } from './core';

// Customer correspondence is independent of CS and IT ticket tables.
export const websiteContactMessages = pgTable(
  'website_contact_messages',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    reference: varchar('reference', { length: 32 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 32 }).notNull(),
    email: varchar('email', { length: 254 }),
    branch: varchar('branch', { length: 120 }),
    trackingCode: varchar('tracking_code', { length: 50 }),
    message: text('message').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('new'),
    updatedBy: varchar('updated_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('website_contact_reference_uq').on(t.reference),
    index('website_contact_company_created_idx').on(t.companyId, t.createdAt, t.id),
    index('website_contact_company_status_idx').on(t.companyId, t.status, t.createdAt),
    check('website_contact_type_check', sql`${t.type} IN ('enquiry', 'complaint', 'feedback')`),
    check(
      'website_contact_status_check',
      sql`${t.status} IN ('new', 'in_progress', 'resolved', 'spam')`,
    ),
  ],
);

export const websiteContactEvents = pgTable(
  'website_contact_message_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    messageId: varchar('message_id', { length: 25 })
      .notNull()
      .references(() => websiteContactMessages.id),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    fromStatus: varchar('from_status', { length: 20 }),
    toStatus: varchar('to_status', { length: 20 }).notNull(),
    note: text('note'),
    performedBy: varchar('performed_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('website_contact_events_message_idx').on(t.companyId, t.messageId, t.createdAt)],
);
