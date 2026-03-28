CREATE TABLE IF NOT EXISTS "parcel_content_catalog" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "description" text,
  "base_price_psw" integer NOT NULL DEFAULT 0,
  "tax_inclusive" boolean NOT NULL DEFAULT true,
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "parcel_detail_catalog" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "name" varchar(255) NOT NULL,
  "description" text,
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "parcel_content_catalog_company_idx"
  ON "parcel_content_catalog" ("company_id", "active", "sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "parcel_content_catalog_company_lower_name_uq"
  ON "parcel_content_catalog" ("company_id", lower("name"));

CREATE INDEX IF NOT EXISTS "parcel_detail_catalog_company_idx"
  ON "parcel_detail_catalog" ("company_id", "active", "sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "parcel_detail_catalog_company_lower_name_uq"
  ON "parcel_detail_catalog" ("company_id", lower("name"));
