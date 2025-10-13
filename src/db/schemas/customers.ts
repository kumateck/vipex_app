import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { companies } from './core';

// Customers (company-scoped; no branch linkage)
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    fullname: varchar('fullname', { length: 255 }).notNull(),
    telephone: varchar('telephone', { length: 255 }),
    telephone2: varchar('telephone2', { length: 255 }),
    address: varchar('address', { length: 255 }),
    email: varchar('email', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
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
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// Customer Cards
export const customerCards = pgTable('customer_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id),
  cardNumber: varchar('card_number', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});
