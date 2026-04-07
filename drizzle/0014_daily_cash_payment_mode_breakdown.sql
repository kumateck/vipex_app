ALTER TABLE "daily_cash_confirmations"
ADD COLUMN IF NOT EXISTS "expected_mtn_psw" bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "expected_telecel_psw" bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "expected_airtel_psw" bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "counted_mtn_psw" bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "counted_telecel_psw" bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "counted_airtel_psw" bigint NOT NULL DEFAULT 0;
