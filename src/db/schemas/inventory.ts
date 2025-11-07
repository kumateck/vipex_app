import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  bigint,
  smallint,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies, branches, users } from './core';
import {
  UnitOfMeasure,
  StockMovementType,
  StockAdjustmentReason,
  TransferStatus,
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
    description: varchar('description', { length: 500 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('product_categories_company_idx').on(t.companyId),
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
    description: varchar('description', { length: 1000 }),
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
    uqCompanySku: uniqueIndex('products_company_sku_uq')
      .on(t.companyId, t.sku)
      .where(sql`${t.isDeleted} = false`),
  }),
);

// Inventory Locations
export const inventoryLocations = pgTable(
  'inventory_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byBranch: index('inventory_locations_branch_idx').on(t.branchId),
    uqBranchName: uniqueIndex('inventory_locations_branch_name_uq').on(t.branchId, t.name),
  }),
);

// Stock Levels
export const stockLevels = pgTable(
  'stock_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    quantityAvailable: bigint('quantity_available', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    quantityReserved: bigint('quantity_reserved', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    lastCountDate: timestamp('last_count_date', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byProduct: index('stock_levels_product_idx').on(t.productId),
    byLocation: index('stock_levels_location_idx').on(t.locationId),
    uqProductLocation: uniqueIndex('stock_levels_product_location_uq').on(
      t.productId,
      t.locationId,
    ),
    chkQuantityAvailable: check(
      'stock_levels_quantity_available_check',
      sql`${t.quantityAvailable} >= 0`,
    ),
  }),
);

// Stock Movements
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    movementType: smallint('movement_type').notNull().default(StockMovementType.RECEIPT),
    quantity: bigint('quantity', { mode: 'bigint' }).notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    notes: varchar('notes', { length: 1000 }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byProduct: index('stock_movements_product_idx').on(t.productId),
    byLocation: index('stock_movements_location_idx').on(t.locationId),
    byMovementType: index('stock_movements_movement_type_idx').on(t.movementType),
    byCreatedAt: index('stock_movements_created_at_idx').on(t.createdAt),
  }),
);

// Stock Adjustments
export const stockAdjustments = pgTable('stock_adjustments', {
  id: uuid('id').primaryKey().defaultRandom(),
  movementId: uuid('movement_id')
    .notNull()
    .unique()
    .references(() => stockMovements.id),
  reason: smallint('reason').notNull().default(StockAdjustmentReason.OTHER),
  reasonDetails: varchar('reason_details', { length: 1000 }),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: false }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
});

// Stock Transfers
export const stockTransfers = pgTable(
  'stock_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull().unique(),
    fromLocationId: uuid('from_location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    toLocationId: uuid('to_location_id')
      .notNull()
      .references(() => inventoryLocations.id),
    status: smallint('status').notNull().default(TransferStatus.PENDING),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    shippedAt: timestamp('shipped_at', { withTimezone: false }),
    receivedAt: timestamp('received_at', { withTimezone: false }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),
    notes: varchar('notes', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTransferNumber: index('stock_transfers_transfer_number_idx').on(t.transferNumber),
    byFromLocation: index('stock_transfers_from_location_idx').on(t.fromLocationId),
    byToLocation: index('stock_transfers_to_location_idx').on(t.toLocationId),
    byStatus: index('stock_transfers_status_idx').on(t.status),
  }),
);

// Stock Transfer Items
export const stockTransferItems = pgTable(
  'stock_transfer_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferId: uuid('transfer_id')
      .notNull()
      .references(() => stockTransfers.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantityRequested: bigint('quantity_requested', { mode: 'bigint' }).notNull(),
    quantityShipped: bigint('quantity_shipped', { mode: 'bigint' }),
    quantityReceived: bigint('quantity_received', { mode: 'bigint' }),
    notes: varchar('notes', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTransfer: index('stock_transfer_items_transfer_idx').on(t.transferId),
    byProduct: index('stock_transfer_items_product_idx').on(t.productId),
    byTransferProduct: index('stock_transfer_items_transfer_product_idx').on(
      t.transferId,
      t.productId,
    ),
  }),
);
