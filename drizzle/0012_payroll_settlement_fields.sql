ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "payment_method" varchar(30),
  ADD COLUMN IF NOT EXISTS "bank_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "bank_account_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "bank_account_number" varchar(100),
  ADD COLUMN IF NOT EXISTS "mobile_money_number" varchar(30);
