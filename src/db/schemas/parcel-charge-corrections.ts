import {
  check,
  bigint,
  index,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';
import { customers } from './customers';
import { parcels } from './shipments';

export const parcelChargeCorrections = pgTable(
  'parcel_charge_corrections',
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
    customerId: varchar('customer_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    originalMethod: smallint('original_method').notNull(),
    chargePsw: bigint('charge_psw', { mode: 'number' }).notNull(),
    reason: varchar('reason', { length: 500 }).notNull(),
    status: smallint('status').notNull().default(0), // 0 pending, 1 approved and applied, 2 rejected
    requestedBy: varchar('requested_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    requestedAt: timestamp('requested_at', { withTimezone: false }).notNull().defaultNow(),
    reviewedBy: varchar('reviewed_by', { length: 25 }).references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: false }),
    reviewNote: varchar('review_note', { length: 500 }),
  },
  (t) => ({
    positiveCharge: check(
      'parcel_charge_corrections_amount_check',
      sql`${t.chargePsw} > 0 and ${t.chargePsw} <= 10000000`,
    ),
    validStatus: check('parcel_charge_corrections_status_check', sql`${t.status} in (0, 1, 2)`),
    independentReview: check(
      'parcel_charge_corrections_review_check',
      sql`(${t.status} = 0 and ${t.reviewedBy} is null and ${t.reviewedAt} is null) or (${t.status} in (1, 2) and ${t.reviewedBy} is not null and ${t.reviewedAt} is not null and ${t.reviewedBy} <> ${t.requestedBy})`,
    ),
    byCompanyStatus: index('parcel_charge_corrections_company_status_idx').on(
      t.companyId,
      t.status,
      t.requestedAt,
    ),
    byParcel: index('parcel_charge_corrections_parcel_idx').on(t.parcelId),
    onePending: uniqueIndex('parcel_charge_corrections_pending_uq')
      .on(t.parcelId)
      .where(sql`${t.status} = 0`),
  }),
);
