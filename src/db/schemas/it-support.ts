import { createId } from '@paralleldrive/cuid2';
import { boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { branches, companies, locations, users } from './core';

export const itSupportTickets = pgTable(
  'it_support_tickets',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    subject: varchar('subject', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 30 }).notNull().default('open'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    category: varchar('category', { length: 60 }).notNull().default('general'),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    requesterUserId: varchar('requester_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    assignedToUserId: varchar('assigned_to_user_id', { length: 25 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    closedAt: timestamp('closed_at', { withTimezone: false }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatusPriority: index('it_support_tickets_company_status_priority_idx').on(
      t.companyId,
      t.status,
      t.priority,
    ),
    byCompanyRequester: index('it_support_tickets_company_requester_idx').on(
      t.companyId,
      t.requesterUserId,
    ),
    byCompanyAssignee: index('it_support_tickets_company_assignee_idx').on(
      t.companyId,
      t.assignedToUserId,
    ),
    byCreatedAt: index('it_support_tickets_created_at_idx').on(t.createdAt),
  }),
);

export const itSupportTicketEvents = pgTable(
  'it_support_ticket_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    ticketId: varchar('ticket_id', { length: 25 })
      .notNull()
      .references(() => itSupportTickets.id),
    eventType: varchar('event_type', { length: 60 }).notNull(),
    eventNote: text('event_note'),
    fromStatus: varchar('from_status', { length: 30 }),
    toStatus: varchar('to_status', { length: 30 }),
    performedBy: varchar('performed_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTicket: index('it_support_ticket_events_ticket_idx').on(t.ticketId),
    byCreatedAt: index('it_support_ticket_events_created_at_idx').on(t.createdAt),
  }),
);
