ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "is_recoverable" boolean NOT NULL DEFAULT false;
