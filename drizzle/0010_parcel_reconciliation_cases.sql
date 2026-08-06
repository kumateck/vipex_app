CREATE TABLE IF NOT EXISTS "parcel_reconciliation_cases" (
  "id" varchar(25) PRIMARY KEY,
  "company_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "linked_parcel_id" varchar(25),
  "case_type" smallint NOT NULL DEFAULT 0,
  "action_type" smallint DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "notes" varchar(1000),
  "resolution_note" varchar(1000),
  "evidence_url" varchar(1000),
  "requested_by" varchar(25) NOT NULL,
  "requested_at" timestamp NOT NULL DEFAULT now(),
  "approved_by" varchar(25),
  "approved_at" timestamp,
  "executed_by" varchar(25),
  "executed_at" timestamp,
  "voided_payment_count" integer NOT NULL DEFAULT 0,
  "metadata" json,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_parcel_id_parcels_id_fk"
  FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_linked_parcel_id_parcels_id_fk"
  FOREIGN KEY ("linked_parcel_id") REFERENCES "parcels"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_requested_by_users_id_fk"
  FOREIGN KEY ("requested_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_approved_by_users_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
  ADD CONSTRAINT "parcel_recon_cases_executed_by_users_id_fk"
  FOREIGN KEY ("executed_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "parcel_recon_cases_company_status_idx"
ON "parcel_reconciliation_cases" ("company_id", "status");

CREATE INDEX IF NOT EXISTS "parcel_recon_cases_parcel_idx"
ON "parcel_reconciliation_cases" ("parcel_id");

CREATE INDEX IF NOT EXISTS "parcel_recon_cases_linked_parcel_idx"
ON "parcel_reconciliation_cases" ("linked_parcel_id");

CREATE INDEX IF NOT EXISTS "parcel_recon_cases_requested_idx"
ON "parcel_reconciliation_cases" ("requested_at");

CREATE UNIQUE INDEX IF NOT EXISTS "parcel_recon_cases_open_parcel_uq"
ON "parcel_reconciliation_cases" ("parcel_id")
WHERE "status" IN (0, 1);
