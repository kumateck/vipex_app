ALTER TABLE "pickup_queues"
ADD COLUMN IF NOT EXISTS "location_id" varchar(25);

ALTER TABLE "pickup_queues"
ADD CONSTRAINT "pickup_queues_location_fk"
FOREIGN KEY ("location_id") REFERENCES "locations"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

UPDATE "pickup_queues" pq
SET "location_id" = p."pickup_location_id"
FROM "parcels" p
WHERE p."id" = pq."parcel_id";

ALTER TABLE "pickup_queues"
DROP CONSTRAINT IF EXISTS "pickup_queues_parcel_uq";

ALTER TABLE "pickup_queues"
DROP CONSTRAINT IF EXISTS "pickup_queues_daily_code_uq";

CREATE UNIQUE INDEX IF NOT EXISTS "pickup_queues_open_parcel_daily_uq"
ON "pickup_queues" ("parcel_id", "queue_date")
WHERE "ended_at" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "pickup_queues_daily_code_uq"
ON "pickup_queues" ("branch_id", "location_id", "queue_date", "payment_bucket", "queue_number");
