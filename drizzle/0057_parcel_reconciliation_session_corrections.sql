ALTER TABLE "parcel_reconciliation_cases"
  ADD COLUMN IF NOT EXISTS "cashier_session_id" varchar(25),
  ADD COLUMN IF NOT EXISTS "effective_at" timestamp,
  ADD COLUMN IF NOT EXISTS "original_charge_psw" bigint,
  ADD COLUMN IF NOT EXISTS "proposed_charge_psw" bigint,
  ADD COLUMN IF NOT EXISTS "original_planned_to_be_paid_psw" bigint,
  ADD COLUMN IF NOT EXISTS "proposed_planned_to_be_paid_psw" bigint;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "parcel_reconciliation_cases"
    ADD CONSTRAINT "parcel_recon_cases_cashier_session_id_fk"
    FOREIGN KEY ("cashier_session_id") REFERENCES "public"."cashier_sessions_enhanced"("id")
    ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parcel_recon_cases_cashier_session_idx"
  ON "parcel_reconciliation_cases" USING btree ("cashier_session_id");
