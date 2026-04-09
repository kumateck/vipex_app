CREATE TABLE IF NOT EXISTS "parcel_storage_waivers" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "waived_amount_psw" bigint NOT NULL DEFAULT 0,
  "reason" text NOT NULL,
  "waived_by" varchar(25) NOT NULL,
  "waived_at" timestamp NOT NULL DEFAULT now(),
  "accounting_journal_entry_id" varchar(25),
  "accounting_posted_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "parcel_storage_waivers" ADD CONSTRAINT "parcel_storage_waivers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parcel_storage_waivers" ADD CONSTRAINT "parcel_storage_waivers_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parcel_storage_waivers" ADD CONSTRAINT "parcel_storage_waivers_waived_by_users_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "parcel_storage_waivers"
  ADD COLUMN IF NOT EXISTS "accounting_journal_entry_id" varchar(25),
  ADD COLUMN IF NOT EXISTS "accounting_posted_at" timestamp;

CREATE INDEX IF NOT EXISTS "parcel_storage_waivers_company_waived_idx"
  ON "parcel_storage_waivers" USING btree ("company_id","waived_at");
CREATE INDEX IF NOT EXISTS "parcel_storage_waivers_parcel_waived_idx"
  ON "parcel_storage_waivers" USING btree ("parcel_id","waived_at");
CREATE INDEX IF NOT EXISTS "parcel_storage_waivers_accounting_entry_idx"
  ON "parcel_storage_waivers" USING btree ("accounting_journal_entry_id");
