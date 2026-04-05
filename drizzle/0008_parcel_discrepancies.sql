CREATE TABLE IF NOT EXISTS "parcel_discrepancies" (
  "id" varchar(25) PRIMARY KEY,
  "company_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25),
  "branch_id" varchar(25),
  "tracking_code" varchar(255),
  "booking_code" varchar(255),
  "discrepancy_type" varchar(100) NOT NULL,
  "notes" varchar(1000),
  "status" smallint NOT NULL DEFAULT 0,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "resolved_by" varchar(25),
  "resolved_at" timestamp,
  "resolution_note" varchar(1000)
);

DO $$
BEGIN
  ALTER TABLE "parcel_discrepancies"
  ADD CONSTRAINT "parcel_discrepancies_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_discrepancies"
  ADD CONSTRAINT "parcel_discrepancies_parcel_id_parcels_id_fk"
  FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_discrepancies"
  ADD CONSTRAINT "parcel_discrepancies_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_discrepancies"
  ADD CONSTRAINT "parcel_discrepancies_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_discrepancies"
  ADD CONSTRAINT "parcel_discrepancies_resolved_by_users_id_fk"
  FOREIGN KEY ("resolved_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "parcel_discrepancies_company_status_idx"
ON "parcel_discrepancies" ("company_id", "status");

CREATE INDEX IF NOT EXISTS "parcel_discrepancies_parcel_idx"
ON "parcel_discrepancies" ("parcel_id");

CREATE INDEX IF NOT EXISTS "parcel_discrepancies_created_idx"
ON "parcel_discrepancies" ("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "parcel_discrepancies_open_parcel_uq"
ON "parcel_discrepancies" ("parcel_id")
WHERE "parcel_id" IS NOT NULL AND "status" = 0;
