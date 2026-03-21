ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "is_nia_verified" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "logged_to_government" boolean DEFAULT false NOT NULL;
