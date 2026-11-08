import { bigint, date, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';

/**
 * Price charged to the client per billable WhatsApp message, by Meta pricing
 * category, with a start date. A message is billed at the row with the latest
 * `effective_from` on or before the day it was sent, so later price changes never
 * alter earlier periods. Rates are micro-units (1/1,000,000 of the currency)
 * because WhatsApp prices are fractions of a cent.
 */
export const whatsappBillingRates = pgTable(
  'whatsapp_billing_rates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    authenticationRateMicros: bigint('authentication_rate_micros', { mode: 'number' })
      .notNull()
      .default(0),
    utilityRateMicros: bigint('utility_rate_micros', { mode: 'number' }).notNull().default(0),
    marketingRateMicros: bigint('marketing_rate_micros', { mode: 'number' }).notNull().default(0),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqCompanyEffectiveFrom: uniqueIndex('whatsapp_billing_rates_company_effective_uq').on(
      t.companyId,
      t.effectiveFrom,
    ),
  }),
);
