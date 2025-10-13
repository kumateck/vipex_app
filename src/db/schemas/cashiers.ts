import { pgTable, uuid, varchar, timestamp, bigint, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { branches, users } from './core';
import { sql } from 'drizzle-orm';
export const cashierSessionTypes = pgTable(
  'cashier_session_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionType: varchar('session_type', { length: 50 }).notNull(),
    startTime: varchar('start_time', { length: 5 }).notNull(),
    endTime: varchar('end_time', { length: 5 }).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqSessionType: uniqueIndex('cashier_session_types_session_type_uq').on(t.sessionType),
  }),
);

export const cashierSessions = pgTable(
  'cashier_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cashierId: uuid('cashier_id')
      .notNull()
      .references(() => users.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    sessionTypeId: uuid('session_type_id')
      .notNull()
      .references(() => cashierSessionTypes.id),
    startTime: timestamp('start_time', { withTimezone: false }).notNull(),
    endTime: timestamp('end_time', { withTimezone: false }),

    // bigint defaults must use SQL literal, not 0n
    openingBalancePsw: bigint('opening_balance_psw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    closingBalancePsw: bigint('closing_balance_psw', { mode: 'bigint' }),

    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCashier: index('cashier_sessions_cashier_idx').on(t.cashierId),
    byBranch: index('cashier_sessions_branch_idx').on(t.branchId),
    byStart: index('cashier_sessions_start_idx').on(t.startTime),
  }),
);
