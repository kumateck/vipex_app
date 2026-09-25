ALTER TABLE "parcels"
  ADD COLUMN IF NOT EXISTS "processed_by" varchar(25)
  REFERENCES "users"("id");
