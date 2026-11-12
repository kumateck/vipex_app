import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { locations } from './core';

export const receivingOffices = pgTable(
  'receiving_offices',
  {
    id: varchar('id', { length: 25 }).primaryKey().$defaultFn(createId),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
  },
  (table) => [
    uniqueIndex('receiving_offices_location_name_uq').on(
      table.locationId,
      sql`lower(${table.name})`,
    ),
  ],
);
