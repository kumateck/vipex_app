DROP INDEX IF EXISTS "pickup_queues_daily_code_uq";

CREATE UNIQUE INDEX IF NOT EXISTS "pickup_queues_daily_code_uq"
ON "pickup_queues" ("branch_id", "location_id", "queue_date", "queue_number");
