import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  index,
  smallint,
  bigint,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { companies } from './core';
import { CustomerCreditSourceType, CustomerCreditTransactionType, CustomerType } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Customers (company-scoped; no branch linkage)
export const customers = pgTable(
  'customers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    fullname: varchar('fullname', { length: 255 }).notNull(),
    telephone: varchar('telephone', { length: 255 }),
    telephone2: varchar('telephone2', { length: 255 }),
    address: varchar('address', { length: 255 }),
    email: varchar('email', { length: 255 }),
    customerType: smallint('customer_type').notNull().default(CustomerType.INDIVIDUAL),
    creditEligible: boolean('credit_eligible').notNull().default(false),
    creditLimitPsw: bigint('credit_limit_psw', { mode: 'number' }).notNull().default(0),
    paymentTermsDays: integer('payment_terms_days').notNull().default(0),
    isNiaVerified: boolean('is_nia_verified').notNull().default(false),
    loggedToGovernment: boolean('logged_to_government').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    idxName: index('customers_fullname_idx').on(t.fullname),
    idxPhone: index('customers_telephone_idx').on(t.telephone),
    // Optional: enforce unique phone per company (case-insensitive). Uncomment if desired.
    // uqCompanyPhone: uniqueIndex('customers_company_phone_uq').on(t.companyId, sql`lower(${t.telephone})`),
  }),
);

// Cards
export const cards = pgTable('cards', {
  id: varchar('id', { length: 25 })
    .primaryKey()
    .$defaultFn(() => createId()),
  companyId: varchar('company_id', { length: 25 })
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: varchar('created_by', { length: 25 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Customer Cards
export const customerCards = pgTable('customer_cards', {
  id: varchar('id', { length: 25 })
    .primaryKey()
    .$defaultFn(() => createId()),
  customerId: varchar('customer_id', { length: 25 })
    .notNull()
    .references(() => customers.id),
  cardId: varchar('card_id', { length: 25 })
    .notNull()
    .references(() => cards.id),
  cardNumber: varchar('card_number', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Customer credit ledger
export const customerCreditTransactions = pgTable(
  'customer_credit_transactions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    customerId: varchar('customer_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    sourceType: smallint('source_type').notNull().default(CustomerCreditSourceType.MANUAL),
    transactionType: smallint('transaction_type')
      .notNull()
      .default(CustomerCreditTransactionType.CHARGE),
    referenceId: varchar('reference_id', { length: 255 }),
    signedAmountPsw: bigint('signed_amount_psw', { mode: 'number' }).notNull(),
    notes: varchar('notes', { length: 1000 }),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCustomer: index('customer_credit_transactions_customer_idx').on(t.customerId),
    byCompany: index('customer_credit_transactions_company_idx').on(t.companyId),
    byCreated: index('customer_credit_transactions_created_idx').on(t.createdAt),
  }),
);

export const customerCreditAllocations = pgTable(
  'customer_credit_allocations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    customerId: varchar('customer_id', { length: 25 })
      .notNull()
      .references(() => customers.id),
    chargeTransactionId: varchar('charge_transaction_id', { length: 25 })
      .notNull()
      .references(() => customerCreditTransactions.id),
    paymentTransactionId: varchar('payment_transaction_id', { length: 25 })
      .notNull()
      .references(() => customerCreditTransactions.id),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull(),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCustomer: index('customer_credit_allocations_customer_idx').on(t.customerId),
    byCompany: index('customer_credit_allocations_company_idx').on(t.companyId),
    byCharge: index('customer_credit_allocations_charge_idx').on(t.chargeTransactionId),
    byPayment: index('customer_credit_allocations_payment_idx').on(t.paymentTransactionId),
    uniqChargePayment: uniqueIndex('customer_credit_allocations_charge_payment_uq').on(
      t.chargeTransactionId,
      t.paymentTransactionId,
    ),
  }),
);
