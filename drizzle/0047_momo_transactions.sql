CREATE TABLE IF NOT EXISTS "momo_transactions" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "parcel_id" varchar(25) NOT NULL REFERENCES "parcels"("id"),
  "flow" varchar(16) NOT NULL,
  "payer_momo_number" varchar(32) NOT NULL,
  "amount_psw" bigint NOT NULL,
  "external_reference_id" varchar(64) NOT NULL,
  "provider_transaction_id" varchar(128),
  "status" smallint NOT NULL DEFAULT 0,
  "status_reason" varchar(500),
  "requested_by" varchar(25) NOT NULL REFERENCES "users"("id"),
  "payment_id" varchar(25) REFERENCES "payments"("id"),
  "callback_received_at" timestamp,
  "last_polled_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "momo_transactions_parcel_idx"
  ON "momo_transactions" ("parcel_id");
CREATE INDEX IF NOT EXISTS "momo_transactions_company_status_idx"
  ON "momo_transactions" ("company_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "momo_transactions_external_ref_uq"
  ON "momo_transactions" ("external_reference_id");

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "momo_transaction_id" varchar(25);
