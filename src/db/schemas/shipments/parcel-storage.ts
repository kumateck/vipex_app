import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { companies, users, warehouses } from '../core';
import { sql } from 'drizzle-orm';
import { ParcelDispositionActionType, ParcelStorageClearanceStatus } from '../enums';
import { createId } from '@paralleldrive/cuid2';
import { parcels } from './booking-parcels';

export const parcelDispositionActions = pgTable(
  'parcel_disposition_actions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    actionType: smallint('action_type').notNull().default(ParcelDispositionActionType.NOTICE_SENT),
    warehouseId: varchar('warehouse_id', { length: 25 }).references(() => warehouses.id),
    notes: text('notes'),
    recoveredAmountPsw: bigint('recovered_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    performedBy: varchar('performed_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    performedAt: timestamp('performed_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyPerformedAt: index('parcel_disposition_actions_company_performed_idx').on(
      t.companyId,
      t.performedAt,
    ),
    byParcelPerformedAt: index('parcel_disposition_actions_parcel_performed_idx').on(
      t.parcelId,
      t.performedAt,
    ),
    byWarehouse: index('parcel_disposition_actions_warehouse_idx').on(t.warehouseId),
  }),
);

export const parcelStorageWaivers = pgTable(
  'parcel_storage_waivers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    waivedAmountPsw: bigint('waived_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    reason: text('reason').notNull(),
    waivedBy: varchar('waived_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    waivedAt: timestamp('waived_at', { withTimezone: false }).notNull().defaultNow(),
    accountingJournalEntryId: varchar('accounting_journal_entry_id', { length: 25 }),
    accountingPostedAt: timestamp('accounting_posted_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyWaivedAt: index('parcel_storage_waivers_company_waived_idx').on(
      t.companyId,
      t.waivedAt,
    ),
    byParcelWaivedAt: index('parcel_storage_waivers_parcel_waived_idx').on(t.parcelId, t.waivedAt),
  }),
);

export const parcelStorageClearanceRequests = pgTable(
  'parcel_storage_clearance_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    status: smallint('status').notNull().default(ParcelStorageClearanceStatus.PENDING_APPROVAL),
    requestedDays: integer('requested_days').notNull(),
    accruedDaysAtRequest: integer('accrued_days_at_request').notNull(),
    dailyRatePsw: bigint('daily_rate_psw', { mode: 'number' }).notNull(),
    requestedAmountPsw: bigint('requested_amount_psw', { mode: 'number' }).notNull(),
    clearAll: boolean('clear_all').notNull().default(false),
    reason: text('reason').notNull(),
    evidenceUrl: text('evidence_url'),
    requestedBy: varchar('requested_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: false }).notNull().defaultNow(),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    approvalNote: text('approval_note'),
    returnedBy: varchar('returned_by', { length: 25 }).references(() => users.id),
    returnedAt: timestamp('returned_at', { withTimezone: false }),
    returnNote: text('return_note'),
    rejectedBy: varchar('rejected_by', { length: 25 }).references(() => users.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    rejectionNote: text('rejection_note'),
    executedBy: varchar('executed_by', { length: 25 }).references(() => users.id),
    executedAt: timestamp('executed_at', { withTimezone: false }),
    executedDays: integer('executed_days'),
    executedAmountPsw: bigint('executed_amount_psw', { mode: 'number' }),
    accountingJournalEntryId: varchar('accounting_journal_entry_id', { length: 25 }),
    accountingPostedAt: timestamp('accounting_posted_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatusRequestedAt: index('parcel_storage_clearance_company_status_idx').on(
      t.companyId,
      t.status,
      t.requestedAt,
    ),
    byParcelRequestedAt: index('parcel_storage_clearance_parcel_requested_idx').on(
      t.parcelId,
      t.requestedAt,
    ),
    oneOpenRequest: uniqueIndex('parcel_storage_clearance_one_open_idx')
      .on(t.parcelId)
      .where(sql`${t.status} in (0, 1, 2)`),
  }),
);
