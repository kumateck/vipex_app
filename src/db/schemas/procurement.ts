import {
  bigint,
  boolean,
  integer,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { branches, companies, users } from './core';

export const ProcurementRequestStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export const ProcurementDemandStatus = {
  OPEN: 0,
  CONSOLIDATED: 1,
  CONVERTED_TO_REQUEST: 2,
  CANCELLED: 3,
  APPROVED: 4,
} as const;

export const ProcurementDemandUrgency = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export const ProcurementQuoteStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  ACCEPTED: 2,
  REJECTED: 3,
} as const;

export const ProcurementPurchaseOrderStatus = {
  OPEN: 0,
  PARTIALLY_RECEIVED: 1,
  RECEIVED: 2,
  CANCELLED: 3,
} as const;

export const procurementSuppliers = pgTable(
  'procurement_suppliers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    email: varchar('email', { length: 255 }),
    telephone: varchar('telephone', { length: 50 }),
    address: text('address'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_suppliers_company_idx').on(t.companyId),
    byCompanyActive: index('procurement_suppliers_company_active_idx').on(t.companyId, t.isActive),
    uqCompanyLowerName: uniqueIndex('procurement_suppliers_company_lower_name_uq').on(
      t.companyId,
      sql`lower(${t.name})`,
    ),
  }),
);

export const procurementFleetPolicies = pgTable(
  'procurement_fleet_policies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    preferredSupplierId: varchar('preferred_supplier_id', { length: 25 }).references(
      () => procurementSuppliers.id,
    ),
    demandUrgency: smallint('demand_urgency').notNull().default(ProcurementDemandUrgency.NORMAL),
    replenishMultiplier: integer('replenish_multiplier').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_fleet_policies_company_idx').on(t.companyId),
    byCompanyActive: index('procurement_fleet_policies_company_active_idx').on(
      t.companyId,
      t.isActive,
    ),
    byCompanyBranch: index('procurement_fleet_policies_company_branch_idx').on(
      t.companyId,
      t.branchId,
    ),
    byPreferredSupplier: index('procurement_fleet_policies_supplier_idx').on(t.preferredSupplierId),
    uqCompanyBranch: uniqueIndex('procurement_fleet_policies_company_branch_uq').on(
      t.companyId,
      t.branchId,
    ),
  }),
);

export const procurementPurchaseRequests = pgTable(
  'procurement_purchase_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    requestNo: varchar('request_no', { length: 50 }).notNull(),
    supplierId: varchar('supplier_id', { length: 25 }).references(() => procurementSuppliers.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    amountPsw: bigint('amount_psw', { mode: 'number' }).notNull().default(0),
    status: smallint('status').notNull().default(ProcurementRequestStatus.SUBMITTED),
    requestedByUserId: varchar('requested_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    rejectedByUserId: varchar('rejected_by_user_id', { length: 25 }).references(() => users.id),
    rejectionReason: text('rejection_reason'),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_purchase_requests_company_idx').on(t.companyId),
    byCompanyStatus: index('procurement_purchase_requests_company_status_idx').on(
      t.companyId,
      t.status,
    ),
    bySupplier: index('procurement_purchase_requests_supplier_idx').on(t.supplierId),
    uqCompanyRequestNo: uniqueIndex('procurement_purchase_requests_company_request_no_uq').on(
      t.companyId,
      t.requestNo,
    ),
  }),
);

export const procurementDemands = pgTable(
  'procurement_demands',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    demandNo: varchar('demand_no', { length: 50 }).notNull(),
    sourceModule: varchar('source_module', { length: 50 }).notNull(),
    sourceEntityType: varchar('source_entity_type', { length: 100 }),
    sourceEntityId: varchar('source_entity_id', { length: 25 }),
    dedupeKey: varchar('dedupe_key', { length: 200 }),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 30 }).notNull().default('unit'),
    quantity: bigint('quantity', { mode: 'number' }).notNull().default(1),
    estimatedUnitCostPsw: bigint('estimated_unit_cost_psw', { mode: 'number' })
      .notNull()
      .default(0),
    estimatedTotalPsw: bigint('estimated_total_psw', { mode: 'number' }).notNull().default(0),
    urgency: smallint('urgency').notNull().default(ProcurementDemandUrgency.NORMAL),
    neededBy: timestamp('needed_by', { withTimezone: false }),
    status: smallint('status').notNull().default(ProcurementDemandStatus.OPEN),
    note: text('note'),
    metadataJson: text('metadata_json'),
    requestedByUserId: varchar('requested_by_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    approvedByUserId: varchar('approved_by_user_id', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedByUserId: varchar('rejected_by_user_id', { length: 25 }).references(() => users.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_demands_company_idx').on(t.companyId),
    byCompanyStatus: index('procurement_demands_company_status_idx').on(t.companyId, t.status),
    byCompanySource: index('procurement_demands_company_source_idx').on(
      t.companyId,
      t.sourceModule,
      t.sourceEntityType,
      t.sourceEntityId,
    ),
    byBranch: index('procurement_demands_branch_idx').on(t.branchId),
    byDedupe: index('procurement_demands_dedupe_idx').on(t.companyId, t.dedupeKey),
    uqCompanyDemandNo: uniqueIndex('procurement_demands_company_demand_no_uq').on(
      t.companyId,
      t.demandNo,
    ),
  }),
);

export const procurementDemandConsolidations = pgTable(
  'procurement_demand_consolidations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    consolidationNo: varchar('consolidation_no', { length: 50 }).notNull(),
    sourceRootLocationId: varchar('source_root_location_id', { length: 25 }),
    targetMainStoreLocationId: varchar('target_main_store_location_id', { length: 25 }),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_demand_consolidations_company_idx').on(t.companyId),
    uqCompanyConsolidationNo: uniqueIndex('procurement_demand_consolidations_company_no_uq').on(
      t.companyId,
      t.consolidationNo,
    ),
  }),
);

export const procurementDemandConsolidationItems = pgTable(
  'procurement_demand_consolidation_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    consolidationId: varchar('consolidation_id', { length: 25 })
      .notNull()
      .references(() => procurementDemandConsolidations.id),
    demandId: varchar('demand_id', { length: 25 })
      .notNull()
      .references(() => procurementDemands.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byConsolidation: index('procurement_demand_consolidation_items_consolidation_idx').on(
      t.consolidationId,
    ),
    byDemand: index('procurement_demand_consolidation_items_demand_idx').on(t.demandId),
    uqConsolidationDemand: uniqueIndex('procurement_demand_consolidation_items_uq').on(
      t.consolidationId,
      t.demandId,
    ),
  }),
);

export const procurementSupplierQuotes = pgTable(
  'procurement_supplier_quotes',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    demandId: varchar('demand_id', { length: 25 })
      .notNull()
      .references(() => procurementDemands.id),
    supplierId: varchar('supplier_id', { length: 25 })
      .notNull()
      .references(() => procurementSuppliers.id),
    quoteNo: varchar('quote_no', { length: 50 }).notNull(),
    unitCostPsw: bigint('unit_cost_psw', { mode: 'number' }).notNull().default(0),
    quantity: bigint('quantity', { mode: 'number' }).notNull().default(0),
    totalCostPsw: bigint('total_cost_psw', { mode: 'number' }).notNull().default(0),
    status: smallint('status').notNull().default(ProcurementQuoteStatus.SUBMITTED),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_supplier_quotes_company_idx').on(t.companyId),
    byDemand: index('procurement_supplier_quotes_demand_idx').on(t.demandId),
    bySupplier: index('procurement_supplier_quotes_supplier_idx').on(t.supplierId),
    byStatus: index('procurement_supplier_quotes_status_idx').on(t.status),
    uqCompanyQuoteNo: uniqueIndex('procurement_supplier_quotes_company_quote_no_uq').on(
      t.companyId,
      t.quoteNo,
    ),
  }),
);

export const procurementPurchaseOrders = pgTable(
  'procurement_purchase_orders',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    purchaseRequestId: varchar('purchase_request_id', { length: 25 }).references(
      () => procurementPurchaseRequests.id,
    ),
    supplierId: varchar('supplier_id', { length: 25 })
      .notNull()
      .references(() => procurementSuppliers.id),
    poNo: varchar('po_no', { length: 50 }).notNull(),
    status: smallint('status').notNull().default(ProcurementPurchaseOrderStatus.OPEN),
    note: text('note'),
    createdBy: varchar('created_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_purchase_orders_company_idx').on(t.companyId),
    bySupplier: index('procurement_purchase_orders_supplier_idx').on(t.supplierId),
    byStatus: index('procurement_purchase_orders_status_idx').on(t.status),
    uqCompanyPoNo: uniqueIndex('procurement_purchase_orders_company_po_no_uq').on(
      t.companyId,
      t.poNo,
    ),
  }),
);

export const procurementPurchaseOrderItems = pgTable(
  'procurement_purchase_order_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    purchaseOrderId: varchar('purchase_order_id', { length: 25 })
      .notNull()
      .references(() => procurementPurchaseOrders.id),
    demandId: varchar('demand_id', { length: 25 }).references(() => procurementDemands.id),
    productId: varchar('product_id', { length: 25 }),
    locationId: varchar('location_id', { length: 25 }),
    itemCode: varchar('item_code', { length: 100 }).notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 30 }).notNull().default('unit'),
    orderedQuantity: bigint('ordered_quantity', { mode: 'number' }).notNull().default(0),
    receivedQuantity: bigint('received_quantity', { mode: 'number' }).notNull().default(0),
    backorderQuantity: bigint('backorder_quantity', { mode: 'number' }).notNull().default(0),
    unitCostPsw: bigint('unit_cost_psw', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byPurchaseOrder: index('procurement_purchase_order_items_po_idx').on(t.purchaseOrderId),
    byDemand: index('procurement_purchase_order_items_demand_idx').on(t.demandId),
    byProduct: index('procurement_purchase_order_items_product_idx').on(t.productId),
  }),
);

export const procurementGoodsReceipts = pgTable(
  'procurement_goods_receipts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    purchaseOrderId: varchar('purchase_order_id', { length: 25 })
      .notNull()
      .references(() => procurementPurchaseOrders.id),
    receiptNo: varchar('receipt_no', { length: 50 }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: false }).notNull().defaultNow(),
    note: text('note'),
    receivedBy: varchar('received_by', { length: 25 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('procurement_goods_receipts_company_idx').on(t.companyId),
    byPo: index('procurement_goods_receipts_po_idx').on(t.purchaseOrderId),
    uqCompanyReceiptNo: uniqueIndex('procurement_goods_receipts_company_receipt_no_uq').on(
      t.companyId,
      t.receiptNo,
    ),
  }),
);

export const procurementGoodsReceiptItems = pgTable(
  'procurement_goods_receipt_items',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    goodsReceiptId: varchar('goods_receipt_id', { length: 25 })
      .notNull()
      .references(() => procurementGoodsReceipts.id),
    purchaseOrderItemId: varchar('purchase_order_item_id', { length: 25 })
      .notNull()
      .references(() => procurementPurchaseOrderItems.id),
    receivedQuantity: bigint('received_quantity', { mode: 'number' }).notNull().default(0),
    locationId: varchar('location_id', { length: 25 }),
    lotId: varchar('lot_id', { length: 25 }),
    batchNumber: varchar('batch_number', { length: 100 }),
    supplierBatchNumber: varchar('supplier_batch_number', { length: 100 }),
    manufacturedAt: timestamp('manufactured_at', { withTimezone: false }),
    expiryDate: timestamp('expiry_date', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byReceipt: index('procurement_goods_receipt_items_receipt_idx').on(t.goodsReceiptId),
    byPoItem: index('procurement_goods_receipt_items_po_item_idx').on(t.purchaseOrderItemId),
    byLot: index('procurement_goods_receipt_items_lot_idx').on(t.lotId),
  }),
);
