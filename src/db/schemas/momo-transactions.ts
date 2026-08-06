import {
  bigint,
  index,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { branches, companies, users } from './core';
import { parcels } from './shipments';
import { payments } from './payments';

// Tracks the async lifecycle of an MTN MoMo "Request to Pay" call, separate
// from `payments` because a request can be pending/failed/timed out before
// any money is actually collected — `payments` rows are only ever created
// once a request lands SUCCESSFUL, at which point `paymentId` is backfilled.
export const MomoTransactionStatus = {
  PENDING: 0,
  SUCCESSFUL: 1,
  FAILED: 2,
  TIMED_OUT: 3,
  CANCELLED: 4,
} as const;

export const MomoTransactionFlow = {
  SENDER: 'sender',
  RECEIVER: 'receiver',
} as const;

export const momoTransactions = pgTable(
  'momo_transactions',
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
    flow: varchar('flow', { length: 16 }).notNull(), // 'sender' | 'receiver'
    payerMomoNumber: varchar('payer_momo_number', { length: 32 }).notNull(),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull(),
    externalReferenceId: varchar('external_reference_id', { length: 64 }).notNull(),
    providerTransactionId: varchar('provider_transaction_id', { length: 128 }),
    status: smallint('status').notNull().default(MomoTransactionStatus.PENDING),
    statusReason: varchar('status_reason', { length: 500 }),
    requestedBy: varchar('requested_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    paymentId: varchar('payment_id', { length: 25 }).references(() => payments.id),
    callbackReceivedAt: timestamp('callback_received_at', { withTimezone: false }),
    lastPolledAt: timestamp('last_polled_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byParcel: index('momo_transactions_parcel_idx').on(t.parcelId),
    byCompanyStatus: index('momo_transactions_company_status_idx').on(t.companyId, t.status),
    uqExternalRef: uniqueIndex('momo_transactions_external_ref_uq').on(t.externalReferenceId),
  }),
);
