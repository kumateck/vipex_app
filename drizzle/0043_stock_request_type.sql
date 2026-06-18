ALTER TABLE "stock_requests"
  ADD COLUMN IF NOT EXISTS "request_type" smallint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "stock_requests_request_type_idx"
  ON "stock_requests" ("request_type");
