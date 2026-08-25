ALTER TABLE "deliveries"
  ADD COLUMN IF NOT EXISTS "rider_assigned_at" timestamp,
  ADD COLUMN IF NOT EXISTS "rider_completed_at" timestamp,
  ADD COLUMN IF NOT EXISTS "returned_at" timestamp;
--> statement-breakpoint
UPDATE "deliveries"
SET "rider_assigned_at" = "created_at"
WHERE "rider_user_id" IS NOT NULL
  AND "rider_assigned_at" IS NULL;
--> statement-breakpoint
UPDATE "deliveries"
SET "rider_completed_at" = COALESCE("confirmed_at", "delivered_at", "updated_at")
WHERE "rider_completed_at" IS NULL
  AND "status" IN ('RIDER_GIVEN_PARCEL_TO_CUSTOMER', 'DELIVERED_AT_HOME', 'DELIVERED');
--> statement-breakpoint
UPDATE "deliveries"
SET "returned_at" = "updated_at"
WHERE "returned_at" IS NULL
  AND "status" = 'RETURNED_TO_OFFICE';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_rider_assigned_at_idx"
  ON "deliveries" ("rider_user_id", "rider_assigned_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_rider_completed_at_idx"
  ON "deliveries" ("rider_user_id", "rider_completed_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_rider_returned_at_idx"
  ON "deliveries" ("rider_user_id", "returned_at");
