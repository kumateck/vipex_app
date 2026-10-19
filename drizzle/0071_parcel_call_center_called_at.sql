ALTER TABLE "parcels"
  ADD COLUMN IF NOT EXISTS "call_center_called_at" timestamp;
