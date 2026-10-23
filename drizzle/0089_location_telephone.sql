-- Optional location-specific SMS contact number. Existing rows remain unset.
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "telephone" varchar(30);
