import {
  pgTable,
  uuid,
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
import {
  StockMovementType,
  StockAdjustmentReason,
  TransferStatus,
  UnitOfMeasure,
} from './enums';

// Product Categories
export const productCategories = pgTable(
  'product_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    categoryId: uuid('category_id').references(() => productCategories.id),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    unitOfMeasure: smallint('unit_of_measure').notNull().default(UnitOfMeasure.PIECE),
    minStockLevel: bigint('min_stock_level', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    quantity: bigint('quantity', { mode: 'bigint' }).notNull().default(sql`0`),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    movementType: smallint('movement_type').notNull(),
    quantity: bigint('quantity', { mode: 'bigint' }).notNull(),
    referenceId: uuid('reference_id'), // Links to adjustment, transfer, etc.
    referenceType: varchar('reference_type', { length: 50 }), // 'adjustment', 'transfer', etc.
    notes: text('notes'),
    createdBy: uuid('created_by').notNull(),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    reason: smallint('reason').notNull(),
    quantityChange: bigint('quantity_change', { mode: 'bigint' }).notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by').notNull(),
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
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    fromLocationId: uuid('from_location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    toLocationId: uuid('to_location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    quantity: bigint('quantity', { mode: 'bigint' }).notNull(),
    status: smallint('status').notNull().default(TransferStatus.PENDING),
    notes: text('notes'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    completedBy: uuid('completed_by'),
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
