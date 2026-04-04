ALTER TABLE "parcels"
ADD COLUMN IF NOT EXISTS "source_location_id" varchar(25);

DO $$
BEGIN
  ALTER TABLE "parcels"
  ADD CONSTRAINT "parcels_source_location_id_locations_id_fk"
  FOREIGN KEY ("source_location_id") REFERENCES "locations"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "parcels_source_location_id_idx"
ON "parcels" ("source_location_id");
