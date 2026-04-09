CREATE TABLE IF NOT EXISTS "stock_allocation_policies" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "requester_root_location_id" varchar(25) REFERENCES "inventory_locations"("id"),
  "strategy" smallint NOT NULL DEFAULT 0,
  "allow_partial" boolean NOT NULL DEFAULT true,
  "prioritize_same_branch" boolean NOT NULL DEFAULT true,
  "max_source_locations" smallint NOT NULL DEFAULT 3,
  "active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "stock_allocation_policies_company_idx"
  ON "stock_allocation_policies" ("company_id");
CREATE INDEX IF NOT EXISTS "stock_allocation_policies_company_active_idx"
  ON "stock_allocation_policies" ("company_id", "active");
CREATE INDEX IF NOT EXISTS "stock_allocation_policies_requester_root_idx"
  ON "stock_allocation_policies" ("requester_root_location_id");

CREATE TABLE IF NOT EXISTS "stock_reservations" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "request_id" varchar(25) NOT NULL REFERENCES "stock_requests"("id"),
  "request_line_id" varchar(25) NOT NULL REFERENCES "stock_request_lines"("id"),
  "product_id" varchar(25) NOT NULL REFERENCES "products"("id"),
  "requester_location_id" varchar(25) NOT NULL REFERENCES "inventory_locations"("id"),
  "status" smallint NOT NULL DEFAULT 0,
  "requested_quantity" bigint NOT NULL,
  "reserved_quantity" bigint NOT NULL DEFAULT 0,
  "issued_quantity" bigint NOT NULL DEFAULT 0,
  "short_quantity" bigint NOT NULL DEFAULT 0,
  "notes" text,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "stock_reservations_request_line_uq"
  ON "stock_reservations" ("request_line_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_company_idx"
  ON "stock_reservations" ("company_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_request_idx"
  ON "stock_reservations" ("request_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_request_line_idx"
  ON "stock_reservations" ("request_line_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_product_idx"
  ON "stock_reservations" ("product_id");
CREATE INDEX IF NOT EXISTS "stock_reservations_status_idx"
  ON "stock_reservations" ("status");

CREATE TABLE IF NOT EXISTS "stock_reservation_allocations" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "reservation_id" varchar(25) NOT NULL REFERENCES "stock_reservations"("id"),
  "source_location_id" varchar(25) NOT NULL REFERENCES "inventory_locations"("id"),
  "sequence_no" smallint NOT NULL DEFAULT 0,
  "reserved_quantity" bigint NOT NULL,
  "issued_quantity" bigint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "stock_reservation_allocations_reservation_idx"
  ON "stock_reservation_allocations" ("reservation_id");
CREATE INDEX IF NOT EXISTS "stock_reservation_allocations_source_location_idx"
  ON "stock_reservation_allocations" ("source_location_id");
CREATE INDEX IF NOT EXISTS "stock_reservation_allocations_status_idx"
  ON "stock_reservation_allocations" ("status");
