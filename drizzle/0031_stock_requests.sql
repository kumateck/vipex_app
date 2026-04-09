CREATE TABLE IF NOT EXISTS "stock_requests" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "requester_location_id" varchar(25) NOT NULL,
  "requested_to_location_id" varchar(25),
  "status" smallint NOT NULL DEFAULT 0,
  "notes" text,
  "requested_by" varchar(25) NOT NULL,
  "approved_by" varchar(25),
  "approved_at" timestamp,
  "rejected_by" varchar(25),
  "rejected_at" timestamp,
  "rejection_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stock_request_lines" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "request_id" varchar(25) NOT NULL,
  "product_id" varchar(25) NOT NULL,
  "requested_quantity" bigint NOT NULL,
  "fulfilled_quantity" bigint NOT NULL DEFAULT 0,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_requests_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "stock_requests"
      ADD CONSTRAINT "stock_requests_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_requests_requester_location_id_inventory_locations_id_fk'
  ) THEN
    ALTER TABLE "stock_requests"
      ADD CONSTRAINT "stock_requests_requester_location_id_inventory_locations_id_fk"
      FOREIGN KEY ("requester_location_id") REFERENCES "inventory_locations"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_requests_requested_to_location_id_inventory_locations_id_fk'
  ) THEN
    ALTER TABLE "stock_requests"
      ADD CONSTRAINT "stock_requests_requested_to_location_id_inventory_locations_id_fk"
      FOREIGN KEY ("requested_to_location_id") REFERENCES "inventory_locations"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_request_lines_request_id_stock_requests_id_fk'
  ) THEN
    ALTER TABLE "stock_request_lines"
      ADD CONSTRAINT "stock_request_lines_request_id_stock_requests_id_fk"
      FOREIGN KEY ("request_id") REFERENCES "stock_requests"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_request_lines_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "stock_request_lines"
      ADD CONSTRAINT "stock_request_lines_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "stock_requests_company_idx"
  ON "stock_requests" ("company_id");

CREATE INDEX IF NOT EXISTS "stock_requests_requester_location_idx"
  ON "stock_requests" ("requester_location_id");

CREATE INDEX IF NOT EXISTS "stock_requests_requested_to_location_idx"
  ON "stock_requests" ("requested_to_location_id");

CREATE INDEX IF NOT EXISTS "stock_requests_status_idx"
  ON "stock_requests" ("status");

CREATE INDEX IF NOT EXISTS "stock_requests_created_idx"
  ON "stock_requests" ("created_at");

CREATE INDEX IF NOT EXISTS "stock_request_lines_request_idx"
  ON "stock_request_lines" ("request_id");

CREATE INDEX IF NOT EXISTS "stock_request_lines_product_idx"
  ON "stock_request_lines" ("product_id");

CREATE UNIQUE INDEX IF NOT EXISTS "stock_request_lines_request_product_uq"
  ON "stock_request_lines" ("request_id", "product_id");
