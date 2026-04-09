ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "is_recoverable" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "stock_maintenance_records" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "product_id" varchar(25) NOT NULL,
  "location_id" varchar(25) NOT NULL,
  "issue_type" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "quantity" bigint NOT NULL,
  "quantity_returned" bigint NOT NULL DEFAULT 0,
  "quantity_disposed" bigint NOT NULL DEFAULT 0,
  "notes" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "resolved_by" varchar(25),
  "resolved_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_maintenance_records_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "stock_maintenance_records"
      ADD CONSTRAINT "stock_maintenance_records_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_maintenance_records_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "stock_maintenance_records"
      ADD CONSTRAINT "stock_maintenance_records_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_maintenance_records_location_id_inventory_locations_id_fk'
  ) THEN
    ALTER TABLE "stock_maintenance_records"
      ADD CONSTRAINT "stock_maintenance_records_location_id_inventory_locations_id_fk"
      FOREIGN KEY ("location_id") REFERENCES "inventory_locations"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_company_idx"
  ON "stock_maintenance_records" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_product_idx"
  ON "stock_maintenance_records" ("product_id");

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_location_idx"
  ON "stock_maintenance_records" ("location_id");

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_issue_type_idx"
  ON "stock_maintenance_records" ("issue_type");

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_status_idx"
  ON "stock_maintenance_records" ("status");

CREATE INDEX IF NOT EXISTS "stock_maintenance_records_created_idx"
  ON "stock_maintenance_records" ("created_at");
