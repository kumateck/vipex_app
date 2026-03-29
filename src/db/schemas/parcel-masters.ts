import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';

export const parcelContentCatalog = pgTable(
  'parcel_content_catalog',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    basePricePsw: integer('base_price_psw').notNull().default(0),
    taxInclusive: boolean('tax_inclusive').notNull().default(true),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('parcel_content_catalog_company_idx').on(t.companyId, t.active, t.sortOrder),
    uqCompanyLowerName: uniqueIndex('parcel_content_catalog_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const parcelDetailCatalog = pgTable(
  'parcel_detail_catalog',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('parcel_detail_catalog_company_idx').on(t.companyId, t.active, t.sortOrder),
    uqCompanyLowerName: uniqueIndex('parcel_detail_catalog_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);
