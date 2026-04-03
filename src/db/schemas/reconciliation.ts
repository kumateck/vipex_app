import {
  bigint,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { branches, companies, users } from './core';

export const ReconciliationSettlementStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

export const reconciliationBankSettlements = pgTable(
  'reconciliation_bank_settlements',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    settlementNo: varchar('settlement_no', { length: 60 }).notNull(),
    settlementDate: timestamp('settlement_date', { withTimezone: false }).notNull(),
    bankReference: varchar('bank_reference', { length: 120 }),
    expectedAmountPsw: bigint('expected_amount_psw', { mode: 'number' }).notNull().default(0),
    bankedAmountPsw: bigint('banked_amount_psw', { mode: 'number' }).notNull().default(0),
    variancePsw: bigint('variance_psw', { mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    status: smallint('status').notNull().default(ReconciliationSettlementStatus.PENDING),
    submittedByUserId: varchar('submitted_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    rejectedByUserId: varchar('rejected_by_user_id', { length: 25 }).references(() => users.id),
    rejectionReason: text('rejection_reason'),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('reconciliation_bank_settlements_company_idx').on(t.companyId),
    byCompanyStatus: index('reconciliation_bank_settlements_company_status_idx').on(
      t.companyId,
      t.status,
    ),
    byBranchDate: index('reconciliation_bank_settlements_branch_date_idx').on(
      t.branchId,
      t.settlementDate,
    ),
    uqCompanySettlementNo: uniqueIndex('reconciliation_bank_settlements_company_no_uq').on(
      t.companyId,
      t.settlementNo,
    ),
  }),
);
