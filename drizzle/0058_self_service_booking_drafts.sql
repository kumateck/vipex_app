CREATE TABLE IF NOT EXISTS "self_service_booking_drafts" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) NOT NULL REFERENCES "branches"("id"),
  "status" smallint NOT NULL DEFAULT 0,
  "sender_fullname" varchar(255) NOT NULL,
  "sender_phone" varchar(32) NOT NULL,
  "sender_phone2" varchar(32),
  "receiver_fullname" varchar(255) NOT NULL,
  "receiver_phone" varchar(32) NOT NULL,
  "receiver_phone2" varchar(32),
  "parcel_content" varchar(255) NOT NULL,
  "parcel_value_psw" bigint NOT NULL DEFAULT 0,
  "call_sender" boolean NOT NULL DEFAULT false,
  "expires_at" timestamp NOT NULL,
  "claimed_by" varchar(25) REFERENCES "users"("id"),
  "claimed_at" timestamp,
  "completed_by" varchar(25) REFERENCES "users"("id"),
  "completed_at" timestamp,
  "booking_id" varchar(25) REFERENCES "bookings"("id"),
  "parcel_id" varchar(25) REFERENCES "parcels"("id"),
  "cancelled_by" varchar(25) REFERENCES "users"("id"),
  "cancelled_at" timestamp,
  "cancel_reason" varchar(1000),
  "request_ip" varchar(64),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "self_service_drafts_branch_status_idx"
  ON "self_service_booking_drafts" ("branch_id", "status");
CREATE INDEX IF NOT EXISTS "self_service_drafts_company_idx"
  ON "self_service_booking_drafts" ("company_id");
CREATE INDEX IF NOT EXISTS "self_service_drafts_sender_phone_idx"
  ON "self_service_booking_drafts" ("sender_phone");
CREATE INDEX IF NOT EXISTS "self_service_drafts_status_expires_idx"
  ON "self_service_booking_drafts" ("status", "expires_at");
