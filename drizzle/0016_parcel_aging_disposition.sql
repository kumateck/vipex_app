CREATE TABLE IF NOT EXISTS "parcel_disposition_actions" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "action_type" smallint NOT NULL DEFAULT 0,
  "warehouse_id" varchar(25),
  "notes" text,
  "recovered_amount_psw" bigint NOT NULL DEFAULT 0,
  "performed_by" varchar(25) NOT NULL,
  "performed_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "parcel_disposition_actions" ADD CONSTRAINT "parcel_disposition_actions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parcel_disposition_actions" ADD CONSTRAINT "parcel_disposition_actions_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parcel_disposition_actions" ADD CONSTRAINT "parcel_disposition_actions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "parcel_disposition_actions" ADD CONSTRAINT "parcel_disposition_actions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "parcel_disposition_actions_company_performed_idx" ON "parcel_disposition_actions" USING btree ("company_id","performed_at");
CREATE INDEX IF NOT EXISTS "parcel_disposition_actions_parcel_performed_idx" ON "parcel_disposition_actions" USING btree ("parcel_id","performed_at");
CREATE INDEX IF NOT EXISTS "parcel_disposition_actions_warehouse_idx" ON "parcel_disposition_actions" USING btree ("warehouse_id");
