import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  integer,
} from 'drizzle-orm/pg-core';
import { companies, branches, users, statuses, locations } from './core';
import { customers, cards } from './customers';
import { sql } from 'drizzle-orm';
import { PaymentMethod } from './enums';

// Bookings: pure header (no destinationId, invoice, paymentMode, actionType)
// id is UUID primary key; parcels link via bookingId
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => customers.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => branches.id),
    statusId: uuid('status_id')
      .notNull()
      .references(() => statuses.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: uuid('cashier_session_id'),
  },
  (t) => ({
    bySender: index('bookings_sender_idx').on(t.senderId),
    byCreated: index('bookings_created_idx').on(t.createdAt),
  }),
);
// Parcels: trackingCode (QR) + bookingCode (human visible); payment method stored as smallint
export const parcels = pgTable(
  'parcels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => branches.id),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => branches.id),

    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id),
    bookingCode: varchar('booking_code', { length: 255 }).notNull(),
    trackingCode: varchar('tracking_code', { length: 255 }).notNull(),

    senderId: uuid('sender_id')
      .notNull()
      .references(() => customers.id),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => customers.id),
    secondReceiverId: uuid('second_receiver_id').references(() => customers.id),

    statusId: uuid('status_id')
      .notNull()
      .references(() => statuses.id),
    parcelDetails: varchar('parcel_details', { length: 255 }).notNull(),
    parcelContent: varchar('parcel_content', { length: 255 }).notNull(),

    // bigint defaults via SQL literal
    parcelValuePsw: bigint('parcel_value_psw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),

    cardId: uuid('card_id').references(() => cards.id),
    cardNumber: varchar('card_number', { length: 255 }),
    secondCardId: uuid('second_card_id').references(() => cards.id),
    secondCardNumber: varchar('second_card_number', { length: 255 }),

    pickupLocationId: uuid('pickup_location_id').references(() => locations.id),

    plannedToBePaidPsw: bigint('planned_tobepaid_psw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),

    method: smallint('method').notNull().default(PaymentMethod.CASH),

    taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),

    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    receivedBy: uuid('received_by'),
    receivedAt: timestamp('received_at', { withTimezone: false }),
    confirmedBy: uuid('confirmed_by'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: uuid('cashier_session_id'),
  },
  (t) => ({
    byBookingId: index('parcels_booking_id_idx').on(t.bookingId),
    byBookingCode: index('parcels_booking_code_idx').on(t.bookingCode),
    uqTrackingPerCompany: uniqueIndex('parcels_company_tracking_uq').on(
      t.companyId,
      t.trackingCode,
    ),
    bySender: index('parcels_sender_idx').on(t.senderId),
    byReceiver: index('parcels_receiver_idx').on(t.receiverId),
    byStatus: index('parcels_status_idx').on(t.statusId),
  }),
);
export const consignments = pgTable(
  'consignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => branches.id),
    destinationId: uuid('destination_id')
      .notNull()
      .references(() => branches.id),

    // Use a proper date/timestamp builder (no sql.as)
    consignmentDate: timestamp('consignment_date', { mode: 'date' }).notNull(),

    // Use a proper integer column (no sql.as)
    serialForDay: integer('serial_for_day').notNull(),

    // Human code like YYYYMMDD-<serial>
    code: varchar('code', { length: 255 }).notNull(),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqDailySerial: uniqueIndex('consignments_daily_serial_uq').on(
      t.companyId,
      t.sourceId,
      t.consignmentDate,
      t.serialForDay,
    ),
    byRoute: index('consignments_route_idx').on(t.sourceId, t.destinationId),
  }),
);

export const consignmentItems = pgTable(
  'consignment_items',
  {
    consignmentId: uuid('consignment_id')
      .notNull()
      .references(() => consignments.id),
    parcelId: uuid('parcel_id')
      .notNull()
      .references(() => parcels.id),
    addedAt: timestamp('added_at', { withTimezone: false }).notNull().defaultNow(),
    removedAt: timestamp('removed_at', { withTimezone: false }),
  },
  (t) => ({
    pk: uniqueIndex('consignment_items_uq').on(t.consignmentId, t.parcelId),
    // At most one active consignment per parcel (active = removed_at IS NULL)
    uqActiveParcel: uniqueIndex('consignment_items_parcel_active_uq')
      .on(t.parcelId)
      .where(sql`${t.removedAt} IS NULL`),
  }),
);
