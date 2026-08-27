CREATE TABLE IF NOT EXISTS "parcel_sticker_prints" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "branch_id" varchar(25) REFERENCES "branches"("id"),
  "parcel_id" varchar(25) REFERENCES "parcels"("id"),
  "booking_code" varchar(255) NOT NULL,
  "tracking_code" varchar(255) NOT NULL,
  "copies" integer NOT NULL DEFAULT 1,
  "printed_by" varchar(25) REFERENCES "users"("id"),
  "printed_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "parcel_sticker_prints_company_printed_at_idx"
  ON "parcel_sticker_prints" ("company_id", "printed_at");
CREATE INDEX IF NOT EXISTS "parcel_sticker_prints_branch_printed_at_idx"
  ON "parcel_sticker_prints" ("branch_id", "printed_at");
CREATE INDEX IF NOT EXISTS "parcel_sticker_prints_parcel_idx"
  ON "parcel_sticker_prints" ("parcel_id");
