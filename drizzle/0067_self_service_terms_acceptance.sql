ALTER TABLE "self_service_booking_drafts"
  ADD COLUMN IF NOT EXISTS "terms_version" varchar(32);

ALTER TABLE "self_service_booking_drafts"
  ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamp;
