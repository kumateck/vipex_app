DROP INDEX IF EXISTS "pickup_queues_code_uq";

CREATE INDEX IF NOT EXISTS "pickup_queues_code_idx"
ON "pickup_queues" ("queue_code");
