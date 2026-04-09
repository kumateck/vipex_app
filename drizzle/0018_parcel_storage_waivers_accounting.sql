ALTER TABLE "parcel_storage_waivers"
  ADD COLUMN IF NOT EXISTS "accounting_journal_entry_id" varchar(25),
  ADD COLUMN IF NOT EXISTS "accounting_posted_at" timestamp;

CREATE INDEX IF NOT EXISTS "parcel_storage_waivers_accounting_entry_idx"
  ON "parcel_storage_waivers" USING btree ("accounting_journal_entry_id");
