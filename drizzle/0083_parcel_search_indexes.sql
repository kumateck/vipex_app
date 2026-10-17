-- Parcel list/search (Awaiting Pickup, Receiver Cashier): narrow by branch + status
-- instead of scanning every branch's parcels in a status, and index the per-parcel
-- pickup queue join that previously had no index.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parcels_company_destination_status_idx" ON "parcels" ("company_id", "destination_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_queues_parcel_idx" ON "pickup_queues" ("parcel_id");
--> statement-breakpoint
ANALYZE "parcels";
--> statement-breakpoint
ANALYZE "pickup_queues";
