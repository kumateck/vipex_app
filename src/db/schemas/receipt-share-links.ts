import { index, integer, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';
import { parcels } from './shipments';

export const ReceiptShareKind = {
  BOOKING: 'booking',
  SENDER_PAYMENT: 'sender_payment',
  RECEIVER_PAYMENT: 'receiver_payment',
  HOME_DELIVERY: 'home_delivery',
} as const;
export type ReceiptShareKindValue = (typeof ReceiptShareKind)[keyof typeof ReceiptShareKind];

// Opaque links customers open from an SMS/WhatsApp/email digital receipt.
// Only the sha256 of the token is stored; the token itself lives in the link.
export const receiptShareLinks = pgTable(
  'receipt_share_links',
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
    kind: varchar('kind', { length: 32 }).notNull(),
    paymentId: varchar('payment_id', { length: 25 }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: false }).notNull(),
    viewCount: integer('view_count').notNull().default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqTokenHash: uniqueIndex('receipt_share_links_token_hash_uq').on(t.tokenHash),
    byParcel: index('receipt_share_links_parcel_idx').on(t.parcelId),
  }),
);
