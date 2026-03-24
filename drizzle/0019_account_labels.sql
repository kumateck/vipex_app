ALTER TABLE "chart_of_accounts"
ADD COLUMN IF NOT EXISTS "label" varchar(255);

UPDATE "chart_of_accounts"
SET "label" = "name"
WHERE "label" IS NULL;
