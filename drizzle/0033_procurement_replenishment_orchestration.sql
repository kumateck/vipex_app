ALTER TABLE "procurement_demands"
  ADD COLUMN IF NOT EXISTS "approved_by_user_id" varchar(25),
  ADD COLUMN IF NOT EXISTS "approved_at" timestamp,
  ADD COLUMN IF NOT EXISTS "rejected_by_user_id" varchar(25),
  ADD COLUMN IF NOT EXISTS "rejected_at" timestamp,
  ADD COLUMN IF NOT EXISTS "rejection_reason" text;

CREATE TABLE IF NOT EXISTS "procurement_demand_consolidations" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "consolidation_no" varchar(50) NOT NULL,
  "source_root_location_id" varchar(25),
  "target_main_store_location_id" varchar(25),
  "note" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_demand_consolidation_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "consolidation_id" varchar(25) NOT NULL,
  "demand_id" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_supplier_quotes" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "demand_id" varchar(25) NOT NULL,
  "supplier_id" varchar(25) NOT NULL,
  "quote_no" varchar(50) NOT NULL,
  "unit_cost_psw" bigint NOT NULL DEFAULT 0,
  "quantity" bigint NOT NULL DEFAULT 0,
  "total_cost_psw" bigint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 1,
  "note" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_purchase_orders" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "purchase_request_id" varchar(25),
  "supplier_id" varchar(25) NOT NULL,
  "po_no" varchar(50) NOT NULL,
  "status" smallint NOT NULL DEFAULT 0,
  "note" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_purchase_order_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "purchase_order_id" varchar(25) NOT NULL,
  "demand_id" varchar(25),
  "product_id" varchar(25),
  "location_id" varchar(25),
  "item_code" varchar(100) NOT NULL,
  "item_name" varchar(255) NOT NULL,
  "unit" varchar(30) NOT NULL DEFAULT 'unit',
  "ordered_quantity" bigint NOT NULL DEFAULT 0,
  "received_quantity" bigint NOT NULL DEFAULT 0,
  "backorder_quantity" bigint NOT NULL DEFAULT 0,
  "unit_cost_psw" bigint NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_goods_receipts" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "purchase_order_id" varchar(25) NOT NULL,
  "receipt_no" varchar(50) NOT NULL,
  "received_at" timestamp NOT NULL DEFAULT now(),
  "note" text,
  "received_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "procurement_goods_receipt_items" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "goods_receipt_id" varchar(25) NOT NULL,
  "purchase_order_item_id" varchar(25) NOT NULL,
  "received_quantity" bigint NOT NULL DEFAULT 0,
  "location_id" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "procurement_demand_consolidations_company_idx"
  ON "procurement_demand_consolidations" ("company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_demand_consolidations_company_no_uq"
  ON "procurement_demand_consolidations" ("company_id", "consolidation_no");

CREATE INDEX IF NOT EXISTS "procurement_demand_consolidation_items_consolidation_idx"
  ON "procurement_demand_consolidation_items" ("consolidation_id");
CREATE INDEX IF NOT EXISTS "procurement_demand_consolidation_items_demand_idx"
  ON "procurement_demand_consolidation_items" ("demand_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_demand_consolidation_items_uq"
  ON "procurement_demand_consolidation_items" ("consolidation_id", "demand_id");

CREATE INDEX IF NOT EXISTS "procurement_supplier_quotes_company_idx"
  ON "procurement_supplier_quotes" ("company_id");
CREATE INDEX IF NOT EXISTS "procurement_supplier_quotes_demand_idx"
  ON "procurement_supplier_quotes" ("demand_id");
CREATE INDEX IF NOT EXISTS "procurement_supplier_quotes_supplier_idx"
  ON "procurement_supplier_quotes" ("supplier_id");
CREATE INDEX IF NOT EXISTS "procurement_supplier_quotes_status_idx"
  ON "procurement_supplier_quotes" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_supplier_quotes_company_quote_no_uq"
  ON "procurement_supplier_quotes" ("company_id", "quote_no");

CREATE INDEX IF NOT EXISTS "procurement_purchase_orders_company_idx"
  ON "procurement_purchase_orders" ("company_id");
CREATE INDEX IF NOT EXISTS "procurement_purchase_orders_supplier_idx"
  ON "procurement_purchase_orders" ("supplier_id");
CREATE INDEX IF NOT EXISTS "procurement_purchase_orders_status_idx"
  ON "procurement_purchase_orders" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_purchase_orders_company_po_no_uq"
  ON "procurement_purchase_orders" ("company_id", "po_no");

CREATE INDEX IF NOT EXISTS "procurement_purchase_order_items_po_idx"
  ON "procurement_purchase_order_items" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "procurement_purchase_order_items_demand_idx"
  ON "procurement_purchase_order_items" ("demand_id");
CREATE INDEX IF NOT EXISTS "procurement_purchase_order_items_product_idx"
  ON "procurement_purchase_order_items" ("product_id");

CREATE INDEX IF NOT EXISTS "procurement_goods_receipts_company_idx"
  ON "procurement_goods_receipts" ("company_id");
CREATE INDEX IF NOT EXISTS "procurement_goods_receipts_po_idx"
  ON "procurement_goods_receipts" ("purchase_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_goods_receipts_company_receipt_no_uq"
  ON "procurement_goods_receipts" ("company_id", "receipt_no");

CREATE INDEX IF NOT EXISTS "procurement_goods_receipt_items_receipt_idx"
  ON "procurement_goods_receipt_items" ("goods_receipt_id");
CREATE INDEX IF NOT EXISTS "procurement_goods_receipt_items_po_item_idx"
  ON "procurement_goods_receipt_items" ("purchase_order_item_id");
