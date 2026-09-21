ALTER TABLE "parcels"
  ADD COLUMN IF NOT EXISTS "shelf_picker_staff_id" varchar(25)
  REFERENCES "users"("id");

UPDATE "parcels" AS p
SET "shelf_picker_staff_id" = assignment."picker_staff_id"
FROM (
  SELECT DISTINCT ON ("parcel_id") "parcel_id", "picker_staff_id"
  FROM "pickup_queues"
  WHERE "picker_staff_id" IS NOT NULL
  ORDER BY "parcel_id", ("ended_at" IS NULL) DESC, "updated_at" DESC
) AS assignment
WHERE p."id" = assignment."parcel_id"
  AND p."shelf_picker_staff_id" IS NULL;
