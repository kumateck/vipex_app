ALTER TABLE "self_service_booking_drafts"
  ADD COLUMN IF NOT EXISTS "destination_branch_id" varchar(25) REFERENCES "branches"("id"),
  ADD COLUMN IF NOT EXISTS "destination_location_id" varchar(25) REFERENCES "locations"("id");
