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
import { companies, branches, users, locations } from '../core';
import { cards } from '../customers';
import { sql } from 'drizzle-orm';
import { ConsignmentReceivingStatus, PaymentResponsibility, PendingBookingStatus } from '../enums';
import { createId } from '@paralleldrive/cuid2';
import { parcels } from './booking-parcels';

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

    // Receiving completeness lifecycle
    status: smallint('status').notNull().default(ConsignmentReceivingStatus.OPEN),
    closedBy: varchar('closed_by', { length: 25 }).references(() => users.id),
    closedAt: timestamp('closed_at', { withTimezone: false }),
    closedWithExceptions: boolean('closed_with_exceptions').notNull().default(false),
    closeExceptionReason: varchar('close_exception_reason', { length: 1000 }),
  },
  (t) => ({
    uqDailySerial: uniqueIndex('consignments_daily_serial_uq').on(
      t.companyId,
      t.sourceId,
      t.consignmentDate,
      t.serialForDay,
    ),
    byRoute: index('consignments_route_idx').on(t.sourceId, t.destinationId),
    byStatus: index('consignments_status_idx').on(t.status),
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

    // Per-item receiving record, scoped to this consignment (source of truth for
    // duplicate-scan and wrong-consignment detection)
    arrivedAt: timestamp('arrived_at', { withTimezone: false }),
    arrivedBy: varchar('arrived_by', { length: 25 }).references(() => users.id),
  },
  (t) => ({
    pk: uniqueIndex('consignment_items_uq').on(t.consignmentId, t.parcelId),
    // At most one active consignment per parcel (active = removed_at IS NULL)
    uqActiveParcel: uniqueIndex('consignment_items_parcel_active_uq')
      .on(t.parcelId)
      .where(sql`${t.removedAt} IS NULL`),
    byConsignmentArrived: index('consignment_items_consignment_arrived_idx').on(
      t.consignmentId,
      t.arrivedAt,
    ),
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

export const pickupQueues = pgTable(
  'pickup_queues',
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
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    paymentBucket: varchar('payment_bucket', { length: 2 }).notNull(),
    queueDate: timestamp('queue_date', { mode: 'date' }).notNull(),
    queueNumber: integer('queue_number').notNull(),
    queueCode: varchar('queue_code', { length: 32 }).notNull(),
    pickerStaffId: varchar('picker_staff_id', { length: 25 }).references(() => users.id),
    idCardTypeId: varchar('id_card_type_id', { length: 25 }).references(() => cards.id),
    idCardNumber: varchar('id_card_number', { length: 255 }),
    queuedBy: varchar('queued_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    queuedAt: timestamp('queued_at', { withTimezone: false }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: false }),
    endedBy: varchar('ended_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqPickupQueueOpenParcelDaily: uniqueIndex('pickup_queues_open_parcel_daily_uq')
      .on(t.parcelId, t.queueDate)
      .where(sql`${t.endedAt} IS NULL`),
    uqPickupQueueDailyCode: uniqueIndex('pickup_queues_daily_code_uq').on(
      t.branchId,
      t.locationId,
      t.queueDate,
      t.queueNumber,
    ),
    byBranchQueuedAt: index('pickup_queues_branch_queued_at_idx').on(t.branchId, t.queuedAt),
    byQueueCode: index('pickup_queues_code_idx').on(t.queueCode),
    byParcel: index('pickup_queues_parcel_idx').on(t.parcelId),
  }),
);
