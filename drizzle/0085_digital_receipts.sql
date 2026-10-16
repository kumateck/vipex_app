ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "receipt_delivery_channels" text[] NOT NULL DEFAULT '{physical}'::text[];
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "receipt_share_links" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "parcel_id" varchar(25) NOT NULL REFERENCES "parcels"("id"),
  "kind" varchar(32) NOT NULL,
  "payment_id" varchar(25),
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "view_count" integer NOT NULL DEFAULT 0,
  "last_viewed_at" timestamp,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_share_links_token_hash_uq" ON "receipt_share_links" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipt_share_links_parcel_idx" ON "receipt_share_links" USING btree ("parcel_id");
