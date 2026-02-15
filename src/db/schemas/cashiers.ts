// import { pgTable, varchar, timestamp, bigint, uniqueIndex, index } from 'drizzle-orm/pg-core';
// import { branches, users } from './core';
// import { sql } from 'drizzle-orm';
// import { createId } from '@paralleldrive/cuid2';
// export const cashierSessionTypes = pgTable(
//   'cashier_session_types',
//   {
//     id: varchar('id', { length: 25 })
//       .primaryKey()
//       .$defaultFn(() => createId()),
//     sessionType: varchar('session_type', { length: 50 }).notNull(),
//     startTime: varchar('start_time', { length: 5 }).notNull(),
//     endTime: varchar('end_time', { length: 5 }).notNull(),
//     createdBy: varchar('created_by', { length: 25 }).notNull(),
//     createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
//     updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
//   },
//   (t) => ({
//     uqSessionType: uniqueIndex('cashier_session_types_session_type_uq').on(t.sessionType),
//   }),
// );

// // export const cashierSessions = pgTable(
// //   'cashier_sessions',
// //   {
// //     id: varchar('id', { length: 25 })
// //       .primaryKey()
// //       .$defaultFn(() => createId()),
// //     cashierId: varchar('cashier_id', { length: 25 })
// //       .notNull()
// //       .references(() => users.id),
// //     branchId: varchar('branch_id', { length: 25 })
// //       .notNull()
// //       .references(() => branches.id),
// //     sessionTypeId: varchar('session_type_id', { length: 25 })
// //       .notNull()
// //       .references(() => cashierSessionTypes.id),
// //     startTime: timestamp('start_time', { withTimezone: false }).notNull(),
// //     endTime: timestamp('end_time', { withTimezone: false }),

// //     // bigint defaults must use SQL literal, not 0n
// //     openingBalancePsw: bigint('opening_balance_psw', { mode: 'number' })
// //       .notNull()
// //       .default(sql`0`),
// //     closingBalancePsw: bigint('closing_balance_psw', { mode: 'number' }),

// //     status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
// //     createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
// //     updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
// //   },
// //   (t) => ({
// //     byCashier: index('cashier_sessions_cashier_idx').on(t.cashierId),
// //     byBranch: index('cashier_sessions_branch_idx').on(t.branchId),
// //     byStart: index('cashier_sessions_start_idx').on(t.startTime),
// //   }),
// // );
