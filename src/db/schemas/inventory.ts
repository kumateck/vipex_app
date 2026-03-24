import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
  uniqueIndex,
  smallint,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies, branches } from './core';
import { TransferStatus, UnitOfMeasure } from './enums';
import { createId } from '@paralleldrive/cuid2';

// Product Categories
export const productCategories = pgTable(
  'product_categories',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('product_categories_company_idx').on(t.companyId),
    uqCompanyLowerName: uniqueIndex('product_categories_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Products
export const products = pgTable(
  'products',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    categoryId: varchar('category_id', { length: 25 }).references(() => productCategories.id),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    unitOfMeasure: smallint('unit_of_measure').notNull().default(UnitOfMeasure.PIECE),
    minStockLevel: bigint('min_stock_level', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('products_company_idx').on(t.companyId),
    byCategory: index('products_category_idx').on(t.categoryId),
    uqCompanySku: uniqueIndex('products_company_sku_uq').on(t.companyId, sql`lower(${t.sku})`),
  }),
);

// Inventory Locations (storage locations within branches)
export const inventoryLocations = pgTable(
  'inventory_locations',
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
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_locations_company_idx').on(t.companyId),
    byBranch: index('inventory_locations_branch_idx').on(t.branchId),
    uqBranchLowerName: uniqueIndex('inventory_locations_branch_lower_name_uq').on(
      t.branchId,
      sql`lower(${t.name})`,
    ),
  }),
);

// Stock Levels (current stock per product per location)
export const stockLevels = pgTable(
  'stock_levels',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    quantity: bigint('quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_levels_company_idx').on(t.companyId),
    byProduct: index('stock_levels_product_idx').on(t.productId),
    byLocation: index('stock_levels_location_idx').on(t.locationId),
    uqProductLocation: uniqueIndex('stock_levels_product_location_uq').on(
      t.productId,
      t.locationId,
    ),
  }),
);

// Stock Movements (transaction log for all stock changes)
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    movementType: smallint('movement_type').notNull(),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    referenceId: varchar('reference_id', { length: 25 }), // Links to adjustment, transfer, etc.
    referenceType: varchar('reference_type', { length: 50 }), // 'adjustment', 'transfer', etc.
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_movements_company_idx').on(t.companyId),
    byProduct: index('stock_movements_product_idx').on(t.productId),
    byLocation: index('stock_movements_location_idx').on(t.locationId),
    byCreated: index('stock_movements_created_idx').on(t.createdAt),
    byReference: index('stock_movements_reference_idx').on(t.referenceId),
  }),
);

// Stock Adjustments (manual adjustments with reasons)
export const stockAdjustments = pgTable(
  'stock_adjustments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    reason: smallint('reason').notNull(),
    quantityChange: bigint('quantity_change', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_adjustments_company_idx').on(t.companyId),
    byProduct: index('stock_adjustments_product_idx').on(t.productId),
    byLocation: index('stock_adjustments_location_idx').on(t.locationId),
    byCreated: index('stock_adjustments_created_idx').on(t.createdAt),
  }),
);

// Stock Transfers (inter-branch/location transfers)
export const stockTransfers = pgTable(
  'stock_transfers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    fromLocationId: varchar('from_location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    toLocationId: varchar('to_location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    status: smallint('status').notNull().default(TransferStatus.PENDING),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    completedBy: varchar('completed_by', { length: 25 }),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_transfers_company_idx').on(t.companyId),
    byProduct: index('stock_transfers_product_idx').on(t.productId),
    byFromLocation: index('stock_transfers_from_location_idx').on(t.fromLocationId),
    byToLocation: index('stock_transfers_to_location_idx').on(t.toLocationId),
    byStatus: index('stock_transfers_status_idx').on(t.status),
    byCreated: index('stock_transfers_created_idx').on(t.createdAt),
  }),
);
