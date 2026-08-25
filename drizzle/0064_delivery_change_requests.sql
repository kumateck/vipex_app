ALTER TABLE "deliveries"
  ADD COLUMN IF NOT EXISTS "change_request_status" varchar(20),
  ADD COLUMN IF NOT EXISTS "requested_dropoff_address" varchar(255),
  ADD COLUMN IF NOT EXISTS "requested_charge_psw" bigint,
  ADD COLUMN IF NOT EXISTS "change_request_reason" text,
  ADD COLUMN IF NOT EXISTS "change_requested_by" varchar(25),
  ADD COLUMN IF NOT EXISTS "change_requested_at" timestamp,
  ADD COLUMN IF NOT EXISTS "change_reviewed_by" varchar(25),
  ADD COLUMN IF NOT EXISTS "change_reviewed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "change_review_note" text;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "deliveries"
    ADD CONSTRAINT "deliveries_change_requested_by_users_id_fk"
    FOREIGN KEY ("change_requested_by") REFERENCES "public"."users"("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "deliveries"
    ADD CONSTRAINT "deliveries_change_reviewed_by_users_id_fk"
    FOREIGN KEY ("change_reviewed_by") REFERENCES "public"."users"("id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_change_request_status_idx"
  ON "deliveries" ("change_request_status", "change_requested_at");
