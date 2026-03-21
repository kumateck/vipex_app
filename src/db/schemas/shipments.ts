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
  json,
  text,
} from 'drizzle-orm/pg-core';
import { companies, branches, users, locations } from './core';
import { customers, cards } from './customers';
import { sql } from 'drizzle-orm';
import { ParcelStatus, PaymentMethod, PaymentResponsibility, PendingBookingStatus } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Bookings: pure header (no destinationId, invoice, paymentMode, actionType)
// id is UUID primary key; parcels link via bookingId
export const bookings = pgTable(
  'bookings',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }),
  },
  (t) => ({ byCreated: index('bookings_created_idx').on(t.createdAt) }),
);
// Parcels: trackingCode (QR) + bookingCode (human visible); payment method stored as smallint
export const parcels = pgTable(
  'parcels',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    destinationId: varchar('destination_id', { length: 25 })
      .notNull()
      .references(() => branches.id),

    bookingId: varchar('booking_id', { length: 25 })
      .notNull()
      .references(() => bookings.id),
    bookingCode: varchar('booking_code', { length: 255 }).notNull(),
    trackingCode: varchar('tracking_code', { length: 255 }).notNull(),

    senderId: varchar('sender_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    receiverId: varchar('receiver_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    secondReceiverId: varchar('second_receiver_id', { length: 25 }).references(() => customers.id),

    status: smallint('status').notNull().default(ParcelStatus.CREATED),
    parcelDetails: varchar('parcel_details', { length: 255 }).notNull(),
    parcelContent: varchar('parcel_content', { length: 255 }).notNull(),

    // bigint defaults via SQL literal
    parcelValuePsw: bigint('parcel_value_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    chargePsw: bigint('charge_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    cardId: varchar('card_id', { length: 25 }).references(() => cards.id),
    cardNumber: varchar('card_number', { length: 255 }),
    secondCardId: varchar('second_card_id', { length: 25 }).references(() => cards.id),
    secondCardNumber: varchar('second_card_number', { length: 255 }),

    pickupLocationId: varchar('pickup_location_id', { length: 25 }).references(() => locations.id),

    plannedToBePaidPsw: bigint('planned_tobepaid_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    method: smallint('method').notNull().default(PaymentMethod.CASH),

    taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),

    createdBy: varchar('created_by', { length: 25 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    receivedBy: varchar('received_by', { length: 25 }),
    receivedAt: timestamp('received_at', { withTimezone: false }),
    confirmedBy: varchar('confirmed_by', { length: 25 }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    cashierSessionId: varchar('cashier_session_id', { length: 25 }),
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
    byStatus: index('parcels_status_idx').on(t.status),
  }),
);
export const consignments = pgTable(
  'consignments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    sourceId: varchar('source_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    destinationId: varchar('destination_id', { length: 25 })
      .notNull()
      .references(() => branches.id),

    // Use a proper date/timestamp builder (no sql.as)
    consignmentDate: timestamp('consignment_date', { mode: 'date' }).notNull(),

    // Use a proper integer column (no sql.as)
    serialForDay: integer('serial_for_day').notNull(),

    // Human code like YYYYMMDD-<serial>
    code: varchar('code', { length: 255 }).notNull(),

    createdBy: varchar('created_by', { length: 25 })
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
    consignmentId: varchar('consignment_id', { length: 25 })
      .notNull()
      .references(() => consignments.id),
    parcelId: varchar('parcel_id', { length: 25 })
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

// Pending Bookings awaiting cashier confirmation
export const pendingBookings = pgTable(
  'pending_bookings',
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

    // Complete booking data from attendant (JSON object)
    bookingData: json('booking_data').notNull(),

    // Payment responsibility
    paymentResponsibility: smallint('payment_responsibility')
      .notNull()
      .default(PaymentResponsibility.SENDER),
    senderAmountPsw: bigint('sender_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    recipientAmountPsw: bigint('recipient_amount_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    // Attendant who created the pending booking
    attendantId: varchar('attendant_id', { length: 25 })
      .notNull()
      .references(() => users.id),

    // Status tracking
    status: smallint('status').notNull().default(PendingBookingStatus.PENDING),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancelledBy: varchar('cancelled_by', { length: 25 }).references(() => users.id),
    cancelReason: text('cancel_reason'),
  },
  (t) => ({
    byCompany: index('pending_bookings_company_idx').on(t.companyId),
    byBranch: index('pending_bookings_branch_idx').on(t.branchId),
    byAttendant: index('pending_bookings_attendant_idx').on(t.attendantId),
    byStatus: index('pending_bookings_status_idx').on(t.status),
    byExpires: index('pending_bookings_expires_idx').on(t.expiresAt),
    byCreated: index('pending_bookings_created_idx').on(t.createdAt),
  }),
);
