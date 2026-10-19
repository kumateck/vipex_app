import {
  pgTable,
  varchar,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  integer,
  json,
} from 'drizzle-orm/pg-core';
import { companies, branches, users } from '../core';
import { cashierSessions } from '../shifts';
import { sql } from 'drizzle-orm';
import {
  ParcelReconciliationActionType,
  ParcelReconciliationCaseStatus,
  ParcelReconciliationCaseType,
} from '../enums';
import { createId } from '@paralleldrive/cuid2';
import { parcels } from './booking-parcels';
import { consignments } from './consignment-bookings';

export const parcelDiscrepancies = pgTable(
  'parcel_discrepancies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    consignmentId: varchar('consignment_id', { length: 25 }).references(() => consignments.id),
    trackingCode: varchar('tracking_code', { length: 255 }),
    bookingCode: varchar('booking_code', { length: 255 }),
    discrepancyType: varchar('discrepancy_type', { length: 100 }).notNull(),
    notes: varchar('notes', { length: 1000 }),
    status: smallint('status').notNull().default(0), // 0=open, 1=resolved
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    resolvedBy: varchar('resolved_by', { length: 25 }).references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    resolutionNote: varchar('resolution_note', { length: 1000 }),
  },
  (t) => ({
    byCompanyStatus: index('parcel_discrepancies_company_status_idx').on(t.companyId, t.status),
    byParcel: index('parcel_discrepancies_parcel_idx').on(t.parcelId),
    byCreated: index('parcel_discrepancies_created_idx').on(t.createdAt),
    byConsignment: index('parcel_discrepancies_consignment_idx').on(t.consignmentId),
    uqOpenByParcel: uniqueIndex('parcel_discrepancies_open_parcel_uq')
      .on(t.parcelId)
      .where(sql`${t.parcelId} IS NOT NULL AND ${t.status} = 0`),
  }),
);

export const parcelStickerPrints = pgTable(
  'parcel_sticker_prints',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),
    bookingCode: varchar('booking_code', { length: 255 }).notNull(),
    trackingCode: varchar('tracking_code', { length: 255 }).notNull(),
    copies: integer('copies').notNull().default(1),
    printedBy: varchar('printed_by', { length: 25 }).references(() => users.id),
    printedAt: timestamp('printed_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyPrintedAt: index('parcel_sticker_prints_company_printed_at_idx').on(
      t.companyId,
      t.printedAt,
    ),
    byBranchPrintedAt: index('parcel_sticker_prints_branch_printed_at_idx').on(
      t.branchId,
      t.printedAt,
    ),
    byParcel: index('parcel_sticker_prints_parcel_idx').on(t.parcelId),
  }),
);

export const parcelReconciliationCases = pgTable(
  'parcel_reconciliation_cases',
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
    linkedParcelId: varchar('linked_parcel_id', { length: 25 }).references(() => parcels.id),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }).references(
      () => cashierSessions.id,
    ),
    effectiveAt: timestamp('effective_at', { withTimezone: false }),
    originalChargePsw: bigint('original_charge_psw', { mode: 'number' }),
    proposedChargePsw: bigint('proposed_charge_psw', { mode: 'number' }),
    originalPlannedToBePaidPsw: bigint('original_planned_to_be_paid_psw', { mode: 'number' }),
    proposedPlannedToBePaidPsw: bigint('proposed_planned_to_be_paid_psw', { mode: 'number' }),
    caseType: smallint('case_type').notNull().default(ParcelReconciliationCaseType.SHORTAGE),
    actionType: smallint('action_type').default(ParcelReconciliationActionType.VOID_AND_REFUND),
    status: smallint('status').notNull().default(ParcelReconciliationCaseStatus.REQUESTED),
    notes: varchar('notes', { length: 1000 }),
    resolutionNote: varchar('resolution_note', { length: 1000 }),
    evidenceUrl: varchar('evidence_url', { length: 1000 }),
    requestedBy: varchar('requested_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: false }).notNull().defaultNow(),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    executedBy: varchar('executed_by', { length: 25 }).references(() => users.id),
    executedAt: timestamp('executed_at', { withTimezone: false }),
    voidedPaymentCount: integer('voided_payment_count').notNull().default(0),
    metadata: json('metadata'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatus: index('parcel_recon_cases_company_status_idx').on(t.companyId, t.status),
    byParcel: index('parcel_recon_cases_parcel_idx').on(t.parcelId),
    byLinkedParcel: index('parcel_recon_cases_linked_parcel_idx').on(t.linkedParcelId),
    byCashierSession: index('parcel_recon_cases_cashier_session_idx').on(t.cashierSessionId),
    byRequestedAt: index('parcel_recon_cases_requested_idx').on(t.requestedAt),
    uqOpenByParcel: uniqueIndex('parcel_recon_cases_open_parcel_uq')
      .on(t.parcelId)
      .where(sql`${t.status} IN (0, 1)`),
  }),
);
