import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  bigint,
  index,
  smallint,
  text,
} from 'drizzle-orm/pg-core';
import { parcels } from './shipments';
import { users, locations } from './core';
import { DeliveryMode } from './enums';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Deliveries
export const deliveries = pgTable(
  'deliveries',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),

    mode: smallint('mode').notNull().default(DeliveryMode.OFFICE),
    status: varchar('status', { length: 30 }).notNull().default('QUEUED'),

    officeLocationId: varchar('office_location_id', { length: 25 }).references(() => locations.id),
    dropoffAddress: varchar('dropoff_address', { length: 255 }),

    frontDeskUserId: varchar('front_desk_user_id', { length: 25 }).references(() => users.id),
    deliveryUserId: varchar('delivery_user_id', { length: 25 }).references(() => users.id),

    riderUserId: varchar('rider_user_id', { length: 25 }).references(() => users.id),
    riderAssignedAt: timestamp('rider_assigned_at', { withTimezone: false }),
    riderCompletedAt: timestamp('rider_completed_at', { withTimezone: false }),
    returnedAt: timestamp('returned_at', { withTimezone: false }),
    signatureImage: text('signature_image'),
    riderCollectedPrincipalPsw: bigint('rider_collected_principal_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    riderCollectedDeliveryFeePsw: bigint('rider_collected_delivery_fee_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    riderCollectionRecordedAt: timestamp('rider_collection_recorded_at', {
      withTimezone: false,
    }),
    changeRequestStatus: varchar('change_request_status', { length: 20 }),
    requestedDropoffAddress: varchar('requested_dropoff_address', { length: 255 }),
    requestedChargePsw: bigint('requested_charge_psw', { mode: 'number' }),
    changeRequestReason: text('change_request_reason'),
    changeRequestedBy: varchar('change_requested_by', { length: 25 }).references(() => users.id),
    changeRequestedAt: timestamp('change_requested_at', { withTimezone: false }),
    changeReviewedBy: varchar('change_reviewed_by', { length: 25 }).references(() => users.id),
    changeReviewedAt: timestamp('change_reviewed_at', { withTimezone: false }),
    changeReviewNote: text('change_review_note'),

    receiverCalledConfirmedBy: varchar('receiver_called_confirmed_by', { length: 25 }).references(
      () => users.id,
    ),
    receiverCalledConfirmedAt: timestamp('receiver_called_confirmed_at', { withTimezone: false }),

    // bigint defaults via SQL literal
    chargePsw: bigint('charge_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    amountPaidPsw: bigint('amount_paid_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),

    isDeleted: boolean('is_deleted').notNull().default(false),

    deliveredAt: timestamp('delivered_at', { withTimezone: false }),
    confirmedBy: varchar('confirmed_by', { length: 25 }).references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),

    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),

    cashierSessionId: varchar('cashier_session_id', { length: 25 }),
  },
  (t) => ({
    byParcel: index('deliveries_parcel_idx').on(t.parcelId),
    byMode: index('deliveries_mode_idx').on(t.mode),
    byStatus: index('deliveries_status_idx').on(t.status),
    byRiderAssignedAt: index('deliveries_rider_assigned_at_idx').on(
      t.riderUserId,
      t.riderAssignedAt,
    ),
    byRiderCompletedAt: index('deliveries_rider_completed_at_idx').on(
      t.riderUserId,
      t.riderCompletedAt,
    ),
    byRiderReturnedAt: index('deliveries_rider_returned_at_idx').on(t.riderUserId, t.returnedAt),
    byChangeRequestStatus: index('deliveries_change_request_status_idx').on(
      t.changeRequestStatus,
      t.changeRequestedAt,
    ),
  }),
);
