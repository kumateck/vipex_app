ALTER TABLE "deliveries"
  ADD COLUMN IF NOT EXISTS "rider_collected_principal_psw" bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rider_collected_delivery_fee_psw" bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "rider_collection_recorded_at" timestamp;
--> statement-breakpoint
UPDATE "deliveries" AS "delivery"
SET
  "rider_collected_principal_psw" = "parcel"."planned_tobepaid_psw",
  "rider_collected_delivery_fee_psw" = "delivery"."charge_psw",
  "rider_collection_recorded_at" = COALESCE(
    "delivery"."rider_completed_at",
    "delivery"."confirmed_at",
    "delivery"."updated_at"
  )
FROM "parcels" AS "parcel"
WHERE "parcel"."id" = "delivery"."parcel_id"
  AND "delivery"."rider_user_id" IS NOT NULL
  AND "delivery"."rider_collection_recorded_at" IS NULL
  AND "delivery"."status" IN (
    'RIDER_GIVEN_PARCEL_TO_CUSTOMER',
    'DELIVERED_AT_HOME',
    'DELIVERED'
  );
