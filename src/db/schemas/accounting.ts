import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  bigint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { companies } from './core';

// Optional but powerful: DB-driven tax definition with rational rates to avoid FP.
// You can keep using your fixed Ghana scheme in code; this supports future changes.
export const taxProfiles = pgTable(
  'tax_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(), // e.g., "Ghana Default"
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('tax_profiles_company_idx').on(t.companyId),
  }),
);

export const taxComponents = pgTable(
  'tax_components',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => taxProfiles.id),
    key: varchar('key', { length: 50 }).notNull(), // 'VAT' | 'GETFUND' | 'NHIL' | 'COVID'
    // rate as rational: numerator/denominator; e.g., VAT 3/23 → 3, 23
    numerator: bigint('numerator', { mode: 'bigint' }).notNull(),
    denominator: bigint('denominator', { mode: 'bigint' }).notNull(),
    inclusive: boolean('inclusive').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: false }).notNull().defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: false }),
    active: boolean('active').notNull().default(true),
  },
  (t) => ({
    byProfile: index('tax_components_profile_idx').on(t.profileId),
  }),
);
