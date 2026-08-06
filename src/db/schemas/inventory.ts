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
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies, branches } from './core';
import {
  InventoryMaintenanceStatus,
  InventoryMaintenanceIssueType,
  InventoryLocationType,
  StockAllocationStrategy,
  StockLotStatus,
  StockCountSessionStatus,
  StockReservationAllocationStatus,
  StockReservationStatus,
  StockRequestStatus,
  StockRequestType,
  TransferStatus,
  UnitOfMeasure,
  InventoryApprovalEntityType,
  InventoryApprovalStatus,
  InventoryValuationMethod,
  InventoryReplenishmentProposalStatus,
  InventoryTaskType,
  InventoryTaskStatus,
  InventoryEventType,
} from './enums';
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
    isRecoverable: boolean('is_recoverable').notNull().default(false),
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

// Product Unit Conversions (per-product conversion graph to base unit)
export const productUnitConversions = pgTable(
  'product_unit_conversions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    unitOfMeasure: smallint('unit_of_measure').notNull(),
    factorToBase: bigint('factor_to_base', { mode: 'number' }).notNull(),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byProduct: index('product_unit_conversions_product_idx').on(t.productId),
    bySortOrder: index('product_unit_conversions_product_sort_idx').on(t.productId, t.sortOrder),
    uqProductUnit: uniqueIndex('product_unit_conversions_product_unit_uq').on(
      t.productId,
      t.unitOfMeasure,
    ),
    uqProductFactor: uniqueIndex('product_unit_conversions_product_factor_uq').on(
      t.productId,
      t.factorToBase,
    ),
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
    locationType: smallint('location_type').notNull().default(InventoryLocationType.MAIN_STORE),
    parentLocationId: varchar('parent_location_id', { length: 25 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    parentFk: foreignKey({
      columns: [t.parentLocationId],
      foreignColumns: [t.id],
      name: 'inventory_locations_parent_location_fk',
    }),
    byCompany: index('inventory_locations_company_idx').on(t.companyId),
    byBranch: index('inventory_locations_branch_idx').on(t.branchId),
    byType: index('inventory_locations_type_idx').on(t.locationType),
    byParent: index('inventory_locations_parent_idx').on(t.parentLocationId),
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
    lotId: varchar('lot_id', { length: 25 }),
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
    byLot: index('stock_movements_lot_idx').on(t.lotId),
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
    fulfilledQuantity: bigint('fulfilled_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
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

// Transfer receiving acceptance logs (supports partial acceptance and variance capture)
export const stockTransferAcceptances = pgTable(
  'stock_transfer_acceptances',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    transferId: varchar('transfer_id', { length: 25 })
      .notNull()
      .references(() => stockTransfers.id),
    acceptedQuantity: bigint('accepted_quantity', { mode: 'number' }).notNull(),
    damagedQuantity: bigint('damaged_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    missingQuantity: bigint('missing_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    notes: text('notes'),
    acknowledgedBy: varchar('acknowledged_by', { length: 25 }).notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTransfer: index('stock_transfer_acceptances_transfer_idx').on(t.transferId),
    byAcknowledger: index('stock_transfer_acceptances_acker_idx').on(t.acknowledgedBy),
    byAcknowledgedAt: index('stock_transfer_acceptances_ack_at_idx').on(t.acknowledgedAt),
  }),
);

// Stock Requests (request -> approve -> partial fulfill -> fulfilled)
export const stockRequests = pgTable(
  'stock_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    requesterLocationId: varchar('requester_location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    requestedToLocationId: varchar('requested_to_location_id', { length: 25 }).references(
      () => inventoryLocations.id,
    ),
    requestType: smallint('request_type').notNull().default(StockRequestType.INTER_BRANCH),
    status: smallint('status').notNull().default(StockRequestStatus.DRAFT),
    notes: text('notes'),
    requestedBy: varchar('requested_by', { length: 25 }).notNull(),
    approvedBy: varchar('approved_by', { length: 25 }),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedBy: varchar('rejected_by', { length: 25 }),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_requests_company_idx').on(t.companyId),
    byRequesterLocation: index('stock_requests_requester_location_idx').on(t.requesterLocationId),
    byRequestedToLocation: index('stock_requests_requested_to_location_idx').on(
      t.requestedToLocationId,
    ),
    byRequestType: index('stock_requests_request_type_idx').on(t.requestType),
    byStatus: index('stock_requests_status_idx').on(t.status),
    byCreated: index('stock_requests_created_idx').on(t.createdAt),
  }),
);

export const stockRequestLines = pgTable(
  'stock_request_lines',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: varchar('request_id', { length: 25 })
      .notNull()
      .references(() => stockRequests.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    requestedQuantity: bigint('requested_quantity', { mode: 'number' }).notNull(),
    fulfilledQuantity: bigint('fulfilled_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byRequest: index('stock_request_lines_request_idx').on(t.requestId),
    byProduct: index('stock_request_lines_product_idx').on(t.productId),
    uqRequestProduct: uniqueIndex('stock_request_lines_request_product_uq').on(
      t.requestId,
      t.productId,
    ),
  }),
);

// Request receiving acknowledgement logs (supports partial acknowledgement as stock arrives)
export const stockRequestAcknowledgements = pgTable(
  'stock_request_acknowledgements',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: varchar('request_id', { length: 25 })
      .notNull()
      .references(() => stockRequests.id),
    requestLineId: varchar('request_line_id', { length: 25 })
      .notNull()
      .references(() => stockRequestLines.id),
    acknowledgedQuantity: bigint('acknowledged_quantity', { mode: 'number' }).notNull(),
    notes: text('notes'),
    acknowledgedBy: varchar('acknowledged_by', { length: 25 }).notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byRequest: index('stock_request_acknowledgements_request_idx').on(t.requestId),
    byRequestLine: index('stock_request_acknowledgements_line_idx').on(t.requestLineId),
    byAcknowledger: index('stock_request_acknowledgements_acker_idx').on(t.acknowledgedBy),
    byAcknowledgedAt: index('stock_request_acknowledgements_ack_at_idx').on(t.acknowledgedAt),
  }),
);

// Stock allocation policy (per company, optional per requester root location)
export const stockAllocationPolicies = pgTable(
  'stock_allocation_policies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    requesterRootLocationId: varchar('requester_root_location_id', { length: 25 }).references(
      () => inventoryLocations.id,
    ),
    strategy: smallint('strategy').notNull().default(StockAllocationStrategy.FEFO),
    allowPartial: boolean('allow_partial').notNull().default(true),
    prioritizeSameBranch: boolean('prioritize_same_branch').notNull().default(true),
    maxSourceLocations: smallint('max_source_locations').notNull().default(3),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_allocation_policies_company_idx').on(t.companyId),
    byCompanyActive: index('stock_allocation_policies_company_active_idx').on(
      t.companyId,
      t.active,
    ),
    byRequesterRoot: index('stock_allocation_policies_requester_root_idx').on(
      t.requesterRootLocationId,
    ),
  }),
);

// Reservation header (one reservation per stock request line)
export const stockReservations = pgTable(
  'stock_reservations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    requestId: varchar('request_id', { length: 25 })
      .notNull()
      .references(() => stockRequests.id),
    requestLineId: varchar('request_line_id', { length: 25 })
      .notNull()
      .references(() => stockRequestLines.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    requesterLocationId: varchar('requester_location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    status: smallint('status').notNull().default(StockReservationStatus.OPEN),
    requestedQuantity: bigint('requested_quantity', { mode: 'number' }).notNull(),
    reservedQuantity: bigint('reserved_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    issuedQuantity: bigint('issued_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    shortQuantity: bigint('short_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_reservations_company_idx').on(t.companyId),
    byRequest: index('stock_reservations_request_idx').on(t.requestId),
    byRequestLine: index('stock_reservations_request_line_idx').on(t.requestLineId),
    byProduct: index('stock_reservations_product_idx').on(t.productId),
    byStatus: index('stock_reservations_status_idx').on(t.status),
    uqRequestLine: uniqueIndex('stock_reservations_request_line_uq').on(t.requestLineId),
  }),
);

// Reservation allocations by source location
export const stockReservationAllocations = pgTable(
  'stock_reservation_allocations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    reservationId: varchar('reservation_id', { length: 25 })
      .notNull()
      .references(() => stockReservations.id),
    sourceLocationId: varchar('source_location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    sourceLotId: varchar('source_lot_id', { length: 25 }),
    sequenceNo: smallint('sequence_no').notNull().default(0),
    reservedQuantity: bigint('reserved_quantity', { mode: 'number' }).notNull(),
    issuedQuantity: bigint('issued_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    status: smallint('status').notNull().default(StockReservationAllocationStatus.RESERVED),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byReservation: index('stock_reservation_allocations_reservation_idx').on(t.reservationId),
    bySourceLocation: index('stock_reservation_allocations_source_location_idx').on(
      t.sourceLocationId,
    ),
    bySourceLot: index('stock_reservation_allocations_source_lot_idx').on(t.sourceLotId),
    byStatus: index('stock_reservation_allocations_status_idx').on(t.status),
  }),
);

// Stock lots / batches at product+location level used for FEFO
export const stockLots = pgTable(
  'stock_lots',
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
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    supplierBatchNumber: varchar('supplier_batch_number', { length: 100 }),
    receivedAt: timestamp('received_at', { withTimezone: false }).notNull().defaultNow(),
    manufacturedAt: timestamp('manufactured_at', { withTimezone: false }),
    expiryDate: timestamp('expiry_date', { withTimezone: false }),
    quantityOnHand: bigint('quantity_on_hand', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    reservedQuantity: bigint('reserved_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    status: smallint('status').notNull().default(StockLotStatus.ACTIVE),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_lots_company_idx').on(t.companyId),
    byProduct: index('stock_lots_product_idx').on(t.productId),
    byLocation: index('stock_lots_location_idx').on(t.locationId),
    byStatus: index('stock_lots_status_idx').on(t.status),
    byExpiry: index('stock_lots_expiry_idx').on(t.expiryDate),
    byReceived: index('stock_lots_received_idx').on(t.receivedAt),
    uqProductLocationBatch: uniqueIndex('stock_lots_product_location_batch_uq').on(
      t.productId,
      t.locationId,
      sql`lower(${t.batchNumber})`,
    ),
  }),
);

export const stockLotMovements = pgTable(
  'stock_lot_movements',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    lotId: varchar('lot_id', { length: 25 })
      .notNull()
      .references(() => stockLots.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    movementType: smallint('movement_type').notNull(),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    referenceId: varchar('reference_id', { length: 25 }),
    referenceType: varchar('reference_type', { length: 50 }),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_lot_movements_company_idx').on(t.companyId),
    byLot: index('stock_lot_movements_lot_idx').on(t.lotId),
    byProduct: index('stock_lot_movements_product_idx').on(t.productId),
    byLocation: index('stock_lot_movements_location_idx').on(t.locationId),
    byCreated: index('stock_lot_movements_created_idx').on(t.createdAt),
    byReference: index('stock_lot_movements_reference_idx').on(t.referenceId),
  }),
);

// Stock Maintenance Records (recoverable maintenance / damage / missing lifecycle)
export const stockMaintenanceRecords = pgTable(
  'stock_maintenance_records',
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
    issueType: smallint('issue_type').notNull().default(InventoryMaintenanceIssueType.MAINTENANCE),
    status: smallint('status').notNull().default(InventoryMaintenanceStatus.OPEN),
    quantity: bigint('quantity', { mode: 'number' }).notNull(),
    quantityReturned: bigint('quantity_returned', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    quantityDisposed: bigint('quantity_disposed', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    resolvedBy: varchar('resolved_by', { length: 25 }),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_maintenance_records_company_idx').on(t.companyId),
    byProduct: index('stock_maintenance_records_product_idx').on(t.productId),
    byLocation: index('stock_maintenance_records_location_idx').on(t.locationId),
    byIssueType: index('stock_maintenance_records_issue_type_idx').on(t.issueType),
    byStatus: index('stock_maintenance_records_status_idx').on(t.status),
    byCreated: index('stock_maintenance_records_created_idx').on(t.createdAt),
  }),
);

// Physical stock count / reconciliation sessions
export const stockCountSessions = pgTable(
  'stock_count_sessions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    sessionNo: varchar('session_no', { length: 60 }).notNull(),
    status: smallint('status').notNull().default(StockCountSessionStatus.DRAFT),
    notes: text('notes'),
    submittedBy: varchar('submitted_by', { length: 25 }),
    submittedAt: timestamp('submitted_at', { withTimezone: false }),
    approvedBy: varchar('approved_by', { length: 25 }),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    cancelledBy: varchar('cancelled_by', { length: 25 }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: false }),
    cancellationReason: text('cancellation_reason'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('stock_count_sessions_company_idx').on(t.companyId),
    byLocation: index('stock_count_sessions_location_idx').on(t.locationId),
    byStatus: index('stock_count_sessions_status_idx').on(t.status),
    byCreated: index('stock_count_sessions_created_idx').on(t.createdAt),
    uqCompanySessionNo: uniqueIndex('stock_count_sessions_company_no_uq').on(
      t.companyId,
      t.sessionNo,
    ),
  }),
);

export const stockCountSessionLines = pgTable(
  'stock_count_session_lines',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionId: varchar('session_id', { length: 25 })
      .notNull()
      .references(() => stockCountSessions.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    systemQuantity: bigint('system_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    countedQuantity: bigint('counted_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    varianceQuantity: bigint('variance_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    varianceReason: text('variance_reason'),
    adjustmentMovementId: varchar('adjustment_movement_id', { length: 25 }),
    countedBy: varchar('counted_by', { length: 25 }),
    countedAt: timestamp('counted_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    bySession: index('stock_count_session_lines_session_idx').on(t.sessionId),
    byProduct: index('stock_count_session_lines_product_idx').on(t.productId),
    byVariance: index('stock_count_session_lines_variance_idx').on(t.varianceQuantity),
    uqSessionProduct: uniqueIndex('stock_count_session_lines_session_product_uq').on(
      t.sessionId,
      t.productId,
    ),
  }),
);

// Approval policy and workflow
export const inventoryApprovalPolicies = pgTable(
  'inventory_approval_policies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    entityType: smallint('entity_type')
      .notNull()
      .default(InventoryApprovalEntityType.STOCK_REQUEST),
    minAmount: bigint('min_amount', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    maxAmount: bigint('max_amount', { mode: 'number' }),
    locationType: smallint('location_type'),
    level1ApproverRoleId: varchar('level1_approver_role_id', { length: 25 }),
    level2ApproverRoleId: varchar('level2_approver_role_id', { length: 25 }),
    slaHours: smallint('sla_hours').notNull().default(24),
    escalationRoleId: varchar('escalation_role_id', { length: 25 }),
    active: boolean('active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_approval_policies_company_idx').on(t.companyId),
    byEntity: index('inventory_approval_policies_entity_idx').on(t.entityType),
    byActive: index('inventory_approval_policies_active_idx').on(t.active),
  }),
);

export const inventoryApprovalRequests = pgTable(
  'inventory_approval_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    entityType: smallint('entity_type')
      .notNull()
      .default(InventoryApprovalEntityType.STOCK_REQUEST),
    entityId: varchar('entity_id', { length: 25 }).notNull(),
    policyId: varchar('policy_id', { length: 25 }).references(() => inventoryApprovalPolicies.id),
    status: smallint('status').notNull().default(InventoryApprovalStatus.PENDING),
    levelNo: smallint('level_no').notNull().default(1),
    amount: bigint('amount', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    submittedBy: varchar('submitted_by', { length: 25 }).notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: false }).notNull().defaultNow(),
    decidedBy: varchar('decided_by', { length: 25 }),
    decidedAt: timestamp('decided_at', { withTimezone: false }),
    decisionReason: text('decision_reason'),
    escalationAt: timestamp('escalation_at', { withTimezone: false }),
    dueAt: timestamp('due_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_approval_requests_company_idx').on(t.companyId),
    byEntity: index('inventory_approval_requests_entity_idx').on(t.entityType, t.entityId),
    byStatus: index('inventory_approval_requests_status_idx').on(t.status),
    byDueAt: index('inventory_approval_requests_due_idx').on(t.dueAt),
  }),
);

// Valuation + finance integration
export const inventoryValuationSnapshots = pgTable(
  'inventory_valuation_snapshots',
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
    method: smallint('method').notNull().default(InventoryValuationMethod.WEIGHTED_AVERAGE),
    quantity: bigint('quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    averageUnitCost: bigint('average_unit_cost', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    totalValue: bigint('total_value', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    snapshotAt: timestamp('snapshot_at', { withTimezone: false }).notNull().defaultNow(),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_valuation_snapshots_company_idx').on(t.companyId),
    byProductLocation: index('inventory_valuation_snapshots_product_location_idx').on(
      t.productId,
      t.locationId,
    ),
    bySnapshotAt: index('inventory_valuation_snapshots_at_idx').on(t.snapshotAt),
  }),
);

export const inventoryFinancialPostings = pgTable(
  'inventory_financial_postings',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    movementId: varchar('movement_id', { length: 25 })
      .notNull()
      .references(() => stockMovements.id),
    accountCodeDr: varchar('account_code_dr', { length: 30 }).notNull(),
    accountCodeCr: varchar('account_code_cr', { length: 30 }).notNull(),
    amount: bigint('amount', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    postingDate: timestamp('posting_date', { withTimezone: false }).notNull().defaultNow(),
    postedBy: varchar('posted_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_financial_postings_company_idx').on(t.companyId),
    byMovement: uniqueIndex('inventory_financial_postings_movement_uq').on(t.movementId),
    byPostingDate: index('inventory_financial_postings_date_idx').on(t.postingDate),
  }),
);

export const inventoryReorderPolicies = pgTable(
  'inventory_reorder_policies',
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
    branchId: varchar('branch_id', { length: 25 })
      .notNull()
      .references(() => branches.id),
    locationType: smallint('location_type').notNull(),
    locationId: varchar('location_id', { length: 25 }).references(() => inventoryLocations.id),
    reorderPoint: bigint('reorder_point', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    targetLevel: bigint('target_level', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    safetyStock: bigint('safety_stock', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    active: boolean('active').notNull().default(true),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_reorder_policies_company_idx').on(t.companyId),
    byProduct: index('inventory_reorder_policies_product_idx').on(t.productId),
    byBranchType: index('inventory_reorder_policies_branch_type_idx').on(
      t.branchId,
      t.locationType,
    ),
    byLocation: index('inventory_reorder_policies_location_idx').on(t.locationId),
    byActive: index('inventory_reorder_policies_active_idx').on(t.active),
  }),
);

// Planning/replenishment
export const inventoryReplenishmentProposals = pgTable(
  'inventory_replenishment_proposals',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    proposalNo: varchar('proposal_no', { length: 60 }).notNull(),
    scopeLocationId: varchar('scope_location_id', { length: 25 }).references(
      () => inventoryLocations.id,
    ),
    leadTimeDays: smallint('lead_time_days').notNull().default(7),
    coverageDays: smallint('coverage_days').notNull().default(14),
    status: smallint('status').notNull().default(InventoryReplenishmentProposalStatus.DRAFT),
    notes: text('notes'),
    generatedBy: varchar('generated_by', { length: 25 }).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: false }).notNull().defaultNow(),
    approvedBy: varchar('approved_by', { length: 25 }),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_replenishment_proposals_company_idx').on(t.companyId),
    byStatus: index('inventory_replenishment_proposals_status_idx').on(t.status),
    uqCompanyNo: uniqueIndex('inventory_replenishment_proposals_company_no_uq').on(
      t.companyId,
      t.proposalNo,
    ),
  }),
);

export const inventoryReplenishmentProposalLines = pgTable(
  'inventory_replenishment_proposal_lines',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    proposalId: varchar('proposal_id', { length: 25 })
      .notNull()
      .references(() => inventoryReplenishmentProposals.id),
    productId: varchar('product_id', { length: 25 })
      .notNull()
      .references(() => products.id),
    locationId: varchar('location_id', { length: 25 })
      .notNull()
      .references(() => inventoryLocations.id),
    currentQuantity: bigint('current_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    minStockLevel: bigint('min_stock_level', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    suggestedQuantity: bigint('suggested_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    sourceLocationId: varchar('source_location_id', { length: 25 }).references(
      () => inventoryLocations.id,
    ),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byProposal: index('inventory_replenishment_proposal_lines_proposal_idx').on(t.proposalId),
    byProduct: index('inventory_replenishment_proposal_lines_product_idx').on(t.productId),
  }),
);

// Physical operations tasks and scans
export const inventoryTasks = pgTable(
  'inventory_tasks',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    taskType: smallint('task_type').notNull().default(InventoryTaskType.PICK),
    status: smallint('status').notNull().default(InventoryTaskStatus.OPEN),
    productId: varchar('product_id', { length: 25 }).references(() => products.id),
    fromLocationId: varchar('from_location_id', { length: 25 }).references(
      () => inventoryLocations.id,
    ),
    toLocationId: varchar('to_location_id', { length: 25 }).references(() => inventoryLocations.id),
    plannedQuantity: bigint('planned_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    processedQuantity: bigint('processed_quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    assignedTo: varchar('assigned_to', { length: 25 }),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: false }),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_tasks_company_idx').on(t.companyId),
    byType: index('inventory_tasks_type_idx').on(t.taskType),
    byStatus: index('inventory_tasks_status_idx').on(t.status),
    byAssignee: index('inventory_tasks_assigned_idx').on(t.assignedTo),
  }),
);

export const inventoryTaskScans = pgTable(
  'inventory_task_scans',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    taskId: varchar('task_id', { length: 25 })
      .notNull()
      .references(() => inventoryTasks.id),
    scanCode: varchar('scan_code', { length: 120 }).notNull(),
    quantity: bigint('quantity', { mode: 'number' })
      .notNull()
      .default(sql`0`),
    scannedBy: varchar('scanned_by', { length: 25 }).notNull(),
    scannedAt: timestamp('scanned_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTask: index('inventory_task_scans_task_idx').on(t.taskId),
    byScannedAt: index('inventory_task_scans_at_idx').on(t.scannedAt),
  }),
);

// Immutable inventory event journal
export const inventoryEventJournal = pgTable(
  'inventory_event_journal',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    eventType: smallint('event_type').notNull().default(InventoryEventType.POLICY_UPDATED),
    entityType: varchar('entity_type', { length: 60 }).notNull(),
    entityId: varchar('entity_id', { length: 25 }).notNull(),
    payloadJson: text('payload_json').notNull(),
    createdBy: varchar('created_by', { length: 25 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('inventory_event_journal_company_idx').on(t.companyId),
    byEntity: index('inventory_event_journal_entity_idx').on(t.entityType, t.entityId),
    byEventType: index('inventory_event_journal_type_idx').on(t.eventType),
    byCreatedAt: index('inventory_event_journal_at_idx').on(t.createdAt),
  }),
);
