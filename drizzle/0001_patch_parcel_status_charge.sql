-- Patch: introduce ParcelStatus enum columns and parcel charge

-- 1) Add new enum-backed status columns and charge
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "status" smallint NOT NULL DEFAULT 0;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "status" smallint NOT NULL DEFAULT 0;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "charge_psw" bigint NOT NULL DEFAULT 0;

-- 2) Backfill status from existing statuses table (best-effort mapping)
UPDATE "bookings" b
SET "status" = CASE
  WHEN lower(s.name) IN ('created', 'pending') THEN 0
  WHEN lower(s.name) IN ('processed', 'confirmed') THEN 1
  WHEN lower(s.name) IN ('in transit', 'in_transit', 'in-transit', 'transit') THEN 2
  WHEN lower(s.name) IN ('arrived at destination', 'arrived_at_destination', 'arrived') THEN 3
  WHEN lower(s.name) IN ('customer contacted', 'customer_contacted') THEN 4
  WHEN lower(s.name) IN ('awaiting pickup', 'awaiting_pickup', 'ready for pickup', 'ready_for_pickup') THEN 5
  WHEN lower(s.name) IN ('delivered by office', 'delivered_by_office', 'delivered at office') THEN 6
  WHEN lower(s.name) IN ('home delivery requested', 'home_delivery_requested') THEN 7
  WHEN lower(s.name) IN ('address collected', 'address_collected') THEN 8
  WHEN lower(s.name) IN ('parcel grouped', 'parcel_grouped', 'grouped') THEN 9
  WHEN lower(s.name) IN ('dispatched') THEN 10
  WHEN lower(s.name) IN ('delivered at home', 'delivered_at_home', 'home delivered', 'home_delivered') THEN 11
  WHEN lower(s.name) IN ('returned to office', 'returned_to_office') THEN 12
  WHEN lower(s.name) IN ('returned to sender', 'returned_to_sender') THEN 13
  WHEN lower(s.name) IN ('cancelled', 'canceled') THEN 14
  ELSE 0
END
FROM "statuses" s
WHERE b."status_id" = s."id" AND b."status" = 0;

UPDATE "parcels" p
SET "status" = CASE
  WHEN lower(s.name) IN ('created', 'pending') THEN 0
  WHEN lower(s.name) IN ('processed', 'confirmed') THEN 1
  WHEN lower(s.name) IN ('in transit', 'in_transit', 'in-transit', 'transit') THEN 2
  WHEN lower(s.name) IN ('arrived at destination', 'arrived_at_destination', 'arrived') THEN 3
  WHEN lower(s.name) IN ('customer contacted', 'customer_contacted') THEN 4
  WHEN lower(s.name) IN ('awaiting pickup', 'awaiting_pickup', 'ready for pickup', 'ready_for_pickup') THEN 5
  WHEN lower(s.name) IN ('delivered by office', 'delivered_by_office', 'delivered at office') THEN 6
  WHEN lower(s.name) IN ('home delivery requested', 'home_delivery_requested') THEN 7
  WHEN lower(s.name) IN ('address collected', 'address_collected') THEN 8
  WHEN lower(s.name) IN ('parcel grouped', 'parcel_grouped', 'grouped') THEN 9
  WHEN lower(s.name) IN ('dispatched') THEN 10
  WHEN lower(s.name) IN ('delivered at home', 'delivered_at_home', 'home delivered', 'home_delivered') THEN 11
  WHEN lower(s.name) IN ('returned to office', 'returned_to_office') THEN 12
  WHEN lower(s.name) IN ('returned to sender', 'returned_to_sender') THEN 13
  WHEN lower(s.name) IN ('cancelled', 'canceled') THEN 14
  ELSE 0
END
FROM "statuses" s
WHERE p."status_id" = s."id" AND p."status" = 0;

-- 3) Backfill charge from planned-to-be-paid + existing principal payments
UPDATE "parcels" p
SET "charge_psw" = COALESCE(p."planned_tobepaid_psw", 0) + COALESCE(
  (
    SELECT SUM(payments."gross_amount_psw")
    FROM "payments"
    WHERE payments."parcel_id" = p."id"
      AND payments."component" = 0
      AND payments."voided_at" IS NULL
  ),
  0
)
WHERE p."charge_psw" = 0;

-- 4) Drop legacy status_id columns and constraints
ALTER TABLE "parcels" DROP CONSTRAINT IF EXISTS "parcels_status_id_statuses_id_fk";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_status_id_statuses_id_fk";

ALTER TABLE "parcels" DROP COLUMN IF EXISTS "status_id";
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "status_id";

-- 5) Recreate index for new status column
CREATE INDEX IF NOT EXISTS "parcels_status_idx" ON "parcels" USING btree ("status");
