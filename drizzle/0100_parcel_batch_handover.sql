ALTER TABLE "parcel_receiver_otps"
  ADD COLUMN "batch_scope" varchar(96),
  ADD COLUMN "batch_completed_at" timestamp;
--> statement-breakpoint
CREATE INDEX "parcel_receiver_otps_batch_idx"
  ON "parcel_receiver_otps" ("batch_scope", "created_by", "created_at")
  WHERE "batch_scope" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "parcel_receiver_otps_batch_phone_idx"
  ON "parcel_receiver_otps" ("company_id", "branch_id", "phone", "created_at")
  WHERE "batch_scope" IS NOT NULL;
