ALTER TABLE "consignments"
  ADD COLUMN IF NOT EXISTS "status" smallint NOT NULL DEFAULT 0;
ALTER TABLE "consignments"
  ADD COLUMN IF NOT EXISTS "closed_by" varchar(25) REFERENCES "users"("id");
ALTER TABLE "consignments"
  ADD COLUMN IF NOT EXISTS "closed_at" timestamp;
ALTER TABLE "consignments"
  ADD COLUMN IF NOT EXISTS "closed_with_exceptions" boolean NOT NULL DEFAULT false;
ALTER TABLE "consignments"
  ADD COLUMN IF NOT EXISTS "close_exception_reason" varchar(1000);

CREATE INDEX IF NOT EXISTS "consignments_status_idx"
  ON "consignments" ("status");

ALTER TABLE "consignment_items"
  ADD COLUMN IF NOT EXISTS "arrived_at" timestamp;
ALTER TABLE "consignment_items"
  ADD COLUMN IF NOT EXISTS "arrived_by" varchar(25) REFERENCES "users"("id");

CREATE INDEX IF NOT EXISTS "consignment_items_consignment_arrived_idx"
  ON "consignment_items" ("consignment_id", "arrived_at");

ALTER TABLE "parcel_discrepancies"
  ADD COLUMN IF NOT EXISTS "consignment_id" varchar(25) REFERENCES "consignments"("id");

CREATE INDEX IF NOT EXISTS "parcel_discrepancies_consignment_idx"
  ON "parcel_discrepancies" ("consignment_id");
