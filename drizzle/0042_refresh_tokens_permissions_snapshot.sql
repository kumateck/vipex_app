ALTER TABLE "refresh_tokens"
ADD COLUMN IF NOT EXISTS "permissions_snapshot" jsonb NOT NULL DEFAULT '[]'::jsonb;
