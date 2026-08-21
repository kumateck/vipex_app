-- The currently active uniqueness rule scopes queue_number per payment_bucket (SP/TP),
-- so the same number can legitimately appear twice on one day under the old scheme.
-- Drop it first so the renumber below isn't blocked by the very rule it's replacing.
DROP INDEX IF EXISTS "pickup_queues_daily_code_uq";

-- Renumber into one continuous sequence per (branch, location, day) — this only touches
-- the internal queue_number integer; the customer-facing queue_code (e.g. SPA001/TPA001)
-- is untouched.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY branch_id, location_id, queue_date
    ORDER BY queued_at, id
  ) AS new_number
  FROM pickup_queues
)
UPDATE pickup_queues pq
SET queue_number = ranked.new_number
FROM ranked
WHERE pq.id = ranked.id
  AND pq.queue_number IS DISTINCT FROM ranked.new_number;

CREATE UNIQUE INDEX IF NOT EXISTS "pickup_queues_daily_code_uq"
ON "pickup_queues" ("branch_id", "location_id", "queue_date", "queue_number");
