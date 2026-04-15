CREATE TABLE IF NOT EXISTS "inventory_reorder_policies" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "product_id" varchar(25) NOT NULL REFERENCES "products"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "location_type" smallint NOT NULL,
  "location_id" varchar(25) REFERENCES "inventory_locations"("id"),
  "reorder_point" bigint NOT NULL DEFAULT 0,
  "target_level" bigint NOT NULL DEFAULT 0,
  "safety_stock" bigint NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "inventory_reorder_policies_company_idx"
  ON "inventory_reorder_policies" ("company_id");
CREATE INDEX IF NOT EXISTS "inventory_reorder_policies_product_idx"
  ON "inventory_reorder_policies" ("product_id");
CREATE INDEX IF NOT EXISTS "inventory_reorder_policies_branch_type_idx"
  ON "inventory_reorder_policies" ("branch_id", "location_type");
CREATE INDEX IF NOT EXISTS "inventory_reorder_policies_location_idx"
  ON "inventory_reorder_policies" ("location_id");
CREATE INDEX IF NOT EXISTS "inventory_reorder_policies_active_idx"
  ON "inventory_reorder_policies" ("active");

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reorder_policies_scope_without_location_uq"
  ON "inventory_reorder_policies" ("company_id", "product_id", "branch_id", "location_type")
  WHERE "location_id" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reorder_policies_scope_with_location_uq"
  ON "inventory_reorder_policies" ("company_id", "product_id", "branch_id", "location_type", "location_id")
  WHERE "location_id" IS NOT NULL;
