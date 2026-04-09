ALTER TABLE "fleet_vehicles"
  ADD COLUMN IF NOT EXISTS "year" integer,
  ADD COLUMN IF NOT EXISTS "vin" varchar(64),
  ADD COLUMN IF NOT EXISTS "ownership_type" smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lessor_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "lease_start_at" timestamp,
  ADD COLUMN IF NOT EXISTS "lease_end_at" timestamp,
  ADD COLUMN IF NOT EXISTS "fuel_type" smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "tank_capacity_liters" double precision,
  ADD COLUMN IF NOT EXISTS "payload_capacity_kg" double precision,
  ADD COLUMN IF NOT EXISTS "cargo_capacity_cbm" double precision,
  ADD COLUMN IF NOT EXISTS "lifecycle_status" smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "insurance_expiry_at" timestamp,
  ADD COLUMN IF NOT EXISTS "roadworthy_expiry_at" timestamp;

CREATE TABLE IF NOT EXISTS "fleet_vehicle_documents" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "document_type" varchar(100) NOT NULL,
  "document_number" varchar(100),
  "issuer" varchar(255),
  "issued_at" timestamp,
  "expires_at" timestamp,
  "file_url" varchar(500),
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_vehicle_documents_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_documents_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_documents_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_company_idx"
  ON "fleet_vehicle_documents" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_vehicle_idx"
  ON "fleet_vehicle_documents" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_expiry_idx"
  ON "fleet_vehicle_documents" USING btree ("company_id", "expires_at");
