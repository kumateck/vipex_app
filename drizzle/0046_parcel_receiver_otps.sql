CREATE TABLE IF NOT EXISTS "parcel_receiver_otps" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "parcel_id" varchar(25) NOT NULL REFERENCES "parcels"("id"),
  "target_receiver" varchar(16) NOT NULL,
  "phone" varchar(32) NOT NULL,
  "otp_hash" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "verified_at" timestamp,
  "verification_token" varchar(64),
  "verification_token_expires_at" timestamp,
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "created_by" varchar(25) NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "parcel_receiver_otps_parcel_idx"
  ON "parcel_receiver_otps" ("parcel_id");
CREATE INDEX IF NOT EXISTS "parcel_receiver_otps_parcel_expires_idx"
  ON "parcel_receiver_otps" ("parcel_id", "expires_at");
CREATE INDEX IF NOT EXISTS "parcel_receiver_otps_verification_token_idx"
  ON "parcel_receiver_otps" ("verification_token");
