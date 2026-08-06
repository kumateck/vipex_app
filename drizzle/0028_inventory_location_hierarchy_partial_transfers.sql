ALTER TABLE "inventory_locations"
  ADD COLUMN IF NOT EXISTS "location_type" smallint NOT NULL DEFAULT 0;

ALTER TABLE "inventory_locations"
  ADD COLUMN IF NOT EXISTS "parent_location_id" varchar(25);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_locations_parent_location_fk'
  ) THEN
    ALTER TABLE "inventory_locations"
      ADD CONSTRAINT "inventory_locations_parent_location_fk"
      FOREIGN KEY ("parent_location_id") REFERENCES "inventory_locations"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "inventory_locations_type_idx"
  ON "inventory_locations" ("location_type");

CREATE INDEX IF NOT EXISTS "inventory_locations_parent_idx"
  ON "inventory_locations" ("parent_location_id");

ALTER TABLE "stock_transfers"
  ADD COLUMN IF NOT EXISTS "fulfilled_quantity" bigint NOT NULL DEFAULT 0;
