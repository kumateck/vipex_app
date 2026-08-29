import { bigint, boolean, index, pgTable, smallint, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { branches, companies, locations, users } from './core';
import { customers } from './customers';
import { bookings, parcels } from './shipments';
import { SelfServiceDraftStatus } from './enums';

// One row per customer self-service submission (one draft = one parcel), reached
// via a branch-specific public link/QR code. No customer auth/OTP: submissions
// are public and rate-limited, and auto-expire (and get hard-deleted) one hour
// after creation if no agent completes them, via the background sweep in
// src/server/features/self-service/expiry-sweep.ts.
//
// Sender/receiver identity is stored as raw contact fields, not customer FKs -
// customers.createdBy is NOT NULL and there is no "system" user, so resolving
// or creating the real customers rows is deferred to agent completion, where a
// real staff users.id exists to satisfy that constraint.
export const selfServiceBookingDrafts = pgTable(
  'self_service_booking_drafts',
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
    status: smallint('status').notNull().default(SelfServiceDraftStatus.PENDING),

    senderFullname: varchar('sender_fullname', { length: 255 }).notNull(),
    senderPhone: varchar('sender_phone', { length: 32 }).notNull(),
    senderPhone2: varchar('sender_phone2', { length: 32 }),
    // Set only when the customer-facing phone lookup found an exact match at
    // submission time - lets agent completion attach the existing customer
    // directly instead of re-resolving by phone. Never exposed to the client.
    senderCustomerId: varchar('sender_customer_id', { length: 25 }).references(() => customers.id),

    receiverFullname: varchar('receiver_fullname', { length: 255 }).notNull(),
    receiverPhone: varchar('receiver_phone', { length: 32 }).notNull(),
    receiverPhone2: varchar('receiver_phone2', { length: 32 }),
    receiverCustomerId: varchar('receiver_customer_id', { length: 25 }).references(
      () => customers.id,
    ),

    // Customer-picked destination, same options the agent create-parcel form
    // uses (branches/locations). Nullable in schema but required by app
    // validation at submission; the agent can still change it on completion
    // if the customer picked the wrong one.
    destinationBranchId: varchar('destination_branch_id', { length: 25 }).references(
      () => branches.id,
    ),
    destinationLocationId: varchar('destination_location_id', { length: 25 }).references(
      () => locations.id,
    ),

    parcelContent: varchar('parcel_content', { length: 255 }).notNull(),
    parcelValuePsw: bigint('parcel_value_psw', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    callSender: boolean('call_sender').notNull().default(false),
    termsVersion: varchar('terms_version', { length: 32 }),
    termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: false }),

    // Fixed 1-hour TTL from createdAt; unclaimed/incomplete drafts past this
    // are hard-deleted by the background sweep, not just hidden from queries.
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),

    claimedBy: varchar('claimed_by', { length: 25 }).references(() => users.id),
    claimedAt: timestamp('claimed_at', { withTimezone: false }),

    completedBy: varchar('completed_by', { length: 25 }).references(() => users.id),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    bookingId: varchar('booking_id', { length: 25 }).references(() => bookings.id),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),

    cancelledBy: varchar('cancelled_by', { length: 25 }).references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancelReason: varchar('cancel_reason', { length: 1000 }),

    requestIp: varchar('request_ip', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byBranchStatus: index('self_service_drafts_branch_status_idx').on(t.branchId, t.status),
    byCompany: index('self_service_drafts_company_idx').on(t.companyId),
    bySenderPhone: index('self_service_drafts_sender_phone_idx').on(t.senderPhone),
    byStatusExpires: index('self_service_drafts_status_expires_idx').on(t.status, t.expiresAt),
  }),
);
