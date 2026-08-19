ALTER TABLE "parcels"
  ADD COLUMN IF NOT EXISTS "call_sender" boolean NOT NULL DEFAULT false;
