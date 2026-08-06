import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { branches, companies, users } from './core';
import { parcels } from './shipments';

// Receiver identity verification for office pickup handover: a 6-digit code is
// texted to the receiver (or second/alternate receiver) and must be verified
// within 5 minutes. Once verified, a separate short-lived opaque
// verificationToken is minted so the cashier does not have to re-enter the OTP
// again when finishing the payment dialog a few minutes later.
export const parcelReceiverOtps = pgTable(
  'parcel_receiver_otps',
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
    parcelId: varchar('parcel_id', { length: 25 })
      .notNull()
      .references(() => parcels.id),
    targetReceiver: varchar('target_receiver', { length: 16 }).notNull(), // 'main' | 'second'
    phone: varchar('phone', { length: 32 }).notNull(),
    otpHash: varchar('otp_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: false }),
    verificationToken: varchar('verification_token', { length: 64 }),
    verificationTokenExpiresAt: timestamp('verification_token_expires_at', {
      withTimezone: false,
    }),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byParcel: index('parcel_receiver_otps_parcel_idx').on(t.parcelId),
    byParcelExpires: index('parcel_receiver_otps_parcel_expires_idx').on(t.parcelId, t.expiresAt),
    byVerificationToken: index('parcel_receiver_otps_verification_token_idx').on(
      t.verificationToken,
    ),
  }),
);
