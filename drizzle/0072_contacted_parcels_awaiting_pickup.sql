-- Restore received parcels stranded by the legacy follow-up status.
-- Contact history remains in call_center_called_at and audit records.
UPDATE "parcels" AS parcel
SET "status" = 5,
    "updated_at" = now()
WHERE parcel."status" = 4
  AND parcel."received_at" IS NOT NULL
  AND parcel."confirmed_at" IS NULL
  AND parcel."is_deleted" = false
  AND NOT EXISTS (
    SELECT 1
    FROM "deliveries" AS delivery
    WHERE delivery."parcel_id" = parcel."id"
      AND delivery."is_deleted" = false
      AND (
        delivery."mode" = 1
        OR nullif(trim(delivery."dropoff_address"), '') IS NOT NULL
        OR delivery."status" = 'ADDRESS_COLLECTED'
      )
  );
