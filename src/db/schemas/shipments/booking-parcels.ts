import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  jsonb,
} from 'drizzle-orm/pg-core';
import { companies, branches, users, locations } from '../core';
import { customers, cards } from '../customers';
import { sql } from 'drizzle-orm';
import { ParcelStatus, PaymentMethod } from '../enums';
import { createId } from '@paralleldrive/cuid2';
import type { DeliveryConfirmationSnapshot } from '@/shared/shipments/delivery-confirmation-snapshot';

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
    sourceLocationId: varchar('source_location_id', { length: 25 }).references(() => locations.id),
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
    senderNameSnapshot: varchar('sender_name_snapshot', { length: 255 }).notNull().default(''),
    receiverId: varchar('receiver_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    receiverNameSnapshot: varchar('receiver_name_snapshot', { length: 255 }).notNull().default(''),
    secondReceiverId: varchar('second_receiver_id', { length: 25 }).references(() => customers.id),
    secondReceiverNameSnapshot: varchar('second_receiver_name_snapshot', { length: 255 }),
    deliveryConfirmationSnapshot: jsonb(
      'delivery_confirmation_snapshot',
    ).$type<DeliveryConfirmationSnapshot>(),

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

    callCenterAssignedToUserId: varchar('call_center_assigned_to_user_id', {
      length: 25,
    }).references(() => users.id),
    callCenterCalledAt: timestamp('call_center_called_at', { withTimezone: false }),
    shelfPickerStaffId: varchar('shelf_picker_staff_id', { length: 25 }).references(() => users.id),
    taxReportConfirmation: boolean('tax_report_confirmation').notNull().default(false),
    callSender: boolean('call_sender').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedBy: varchar('deleted_by', { length: 25 }).references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    deleteReason: varchar('delete_reason', { length: 1000 }),

    createdBy: varchar('created_by', { length: 25 }),
    chargeAgentUserId: varchar('charge_agent_user_id', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    processedBy: varchar('processed_by', { length: 25 }).references(() => users.id),
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
    byCompanyDestinationStatus: index('parcels_company_destination_status_idx').on(
      t.companyId,
      t.destinationId,
      t.status,
    ),
  }),
);
