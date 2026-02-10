import { pgTable, uuid, varchar, timestamp, smallint, bigint, index } from 'drizzle-orm/pg-core';
import { parcels } from './shipments';
import { users, branches, companies } from './core';
import { CashierType, PaymentMethod, Payer, PaymentComponent } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Payments stored in pesewas (bigint) + tax breakdown in pesewas
// Taxes apply ONLY to component=PRINCIPAL (not DELIVERY_FEE).
export const payments = pgTable(
  'payments',
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

    component: smallint('component').notNull().default(PaymentComponent.PRINCIPAL), // PRINCIPAL | DELIVERY_FEE | OTHER
    payer: smallint('payer').notNull().default(Payer.SENDER),
    cashierType: smallint('cashier_type').notNull().default(CashierType.SENDING),
    method: smallint('method').notNull().default(PaymentMethod.CASH),

    cashierUserId: varchar('cashier_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),

    grossAmountPsw: bigint('gross_amount_psw', { mode: 'number' }).notNull(),
    netAmountPsw: bigint('net_amount_psw', { mode: 'number' }).notNull(),
    vatPsw: bigint('vat_psw', { mode: 'number' }).notNull(),
    getfundPsw: bigint('getfund_psw', { mode: 'number' }).notNull(),
    nhilPsw: bigint('nhil_psw', { mode: 'number' }).notNull(),
    covidPsw: bigint('covid_psw', { mode: 'number' }).notNull(),
    taxTotalPsw: bigint('tax_total_psw', { mode: 'number' }).notNull(),

    receivedAt: timestamp('received_at', { withTimezone: false }).notNull().defaultNow(),
    notes: varchar('notes', { length: 1000 }),
    receiptNo: varchar('receipt_no', { length: 255 }),

    voidedAt: timestamp('voided_at', { withTimezone: false }),
    voidedBy: varchar('voided_by', { length: 25 }),

    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byParcel: index('payments_parcel_idx').on(t.parcelId),
    byCashier: index('payments_cashier_idx').on(t.cashierUserId),
    byType: index('payments_type_idx').on(t.cashierType),
    byWhen: index('payments_received_at_idx').on(t.receivedAt),
    byBranch: index('payments_branch_idx').on(t.branchId),
    byComponent: index('payments_component_idx').on(t.component),
  }),
);
