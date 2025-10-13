import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  bigint,
  index,
  smallint,
} from 'drizzle-orm/pg-core';
import { parcels } from './shipments';
import { users, locations } from './core';
import { DeliveryMode } from './enums';
import { sql } from 'drizzle-orm';

// Deliveries
export const deliveries = pgTable(
  'deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parcelId: uuid('parcel_id')
      .notNull()
      .references(() => parcels.id),

    mode: smallint('mode').notNull().default(DeliveryMode.OFFICE),
    status: varchar('status', { length: 30 }).notNull().default('QUEUED'),

    officeLocationId: uuid('office_location_id').references(() => locations.id),
    dropoffAddress: varchar('dropoff_address', { length: 255 }),

    frontDeskUserId: uuid('front_desk_user_id').references(() => users.id),
    deliveryUserId: uuid('delivery_user_id').references(() => users.id),

    riderUserId: uuid('rider_user_id').references(() => users.id),

    receiverCalledConfirmedBy: uuid('receiver_called_confirmed_by').references(() => users.id),
    receiverCalledConfirmedAt: timestamp('receiver_called_confirmed_at', { withTimezone: false }),

    // bigint defaults via SQL literal
    chargePsw: bigint('charge_psw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    amountPaidPsw: bigint('amount_paid_psw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),

    isDeleted: boolean('is_deleted').notNull().default(false),

    deliveredAt: timestamp('delivered_at', { withTimezone: false }),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: false }),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),

    cashierSessionId: uuid('cashier_session_id'),
  },
  (t) => ({
    byParcel: index('deliveries_parcel_idx').on(t.parcelId),
    byMode: index('deliveries_mode_idx').on(t.mode),
    byStatus: index('deliveries_status_idx').on(t.status),
  }),
);
