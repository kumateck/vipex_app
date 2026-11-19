ALTER TABLE "parcel_receiver_otps" ADD COLUMN "batch_signature_request" jsonb;
--> statement-breakpoint
CREATE INDEX "parcel_receiver_otps_pending_signature_idx"
  ON "parcel_receiver_otps" ("company_id", "branch_id", "id")
  WHERE "batch_signature_request" IS NOT NULL AND "batch_completed_at" IS NULL;
