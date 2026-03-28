CREATE TABLE "service_charges" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(60) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "amount_psw" bigint DEFAULT 0 NOT NULL,
  "taxable" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "payable_account_id" varchar(25) REFERENCES "chart_of_accounts"("id"),
  "effective_from" timestamp DEFAULT now() NOT NULL,
  "effective_to" timestamp,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "service_charges_company_lower_code_uq"
  ON "service_charges" ("company_id", lower("code"));
CREATE INDEX "service_charges_company_idx"
  ON "service_charges" ("company_id");
CREATE INDEX "service_charges_active_idx"
  ON "service_charges" ("company_id", "active");
CREATE INDEX "service_charges_effective_idx"
  ON "service_charges" ("company_id", "effective_from", "effective_to");

CREATE TABLE "payment_service_charges" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "payment_id" varchar(25) NOT NULL REFERENCES "payments"("id"),
  "parcel_id" varchar(25) NOT NULL REFERENCES "parcels"("id"),
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "service_charge_id" varchar(25) NOT NULL REFERENCES "service_charges"("id"),
  "code" varchar(60) NOT NULL,
  "name" varchar(255) NOT NULL,
  "amount_psw" bigint DEFAULT 0 NOT NULL,
  "taxable" boolean DEFAULT false NOT NULL,
  "settled_psw" bigint DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payment_service_charges_company_idx"
  ON "payment_service_charges" ("company_id");
CREATE INDEX "payment_service_charges_payment_idx"
  ON "payment_service_charges" ("payment_id");
CREATE INDEX "payment_service_charges_parcel_idx"
  ON "payment_service_charges" ("parcel_id");
CREATE INDEX "payment_service_charges_charge_idx"
  ON "payment_service_charges" ("service_charge_id");
