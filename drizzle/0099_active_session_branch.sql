ALTER TABLE "refresh_tokens"
  ADD COLUMN "active_branch_id" varchar(25) REFERENCES "branches"("id"),
  ADD COLUMN "active_location_id" varchar(25) REFERENCES "locations"("id");
