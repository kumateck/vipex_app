ALTER TABLE "customers"
ADD COLUMN "customer_type" smallint DEFAULT 0 NOT NULL,
ADD COLUMN "credit_eligible" boolean DEFAULT false NOT NULL,
ADD COLUMN "credit_limit_psw" bigint DEFAULT 0 NOT NULL,
ADD COLUMN "payment_terms_days" integer DEFAULT 0 NOT NULL;

CREATE TABLE "customer_credit_transactions" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "customer_id" varchar(25) NOT NULL,
  "source_type" smallint DEFAULT 2 NOT NULL,
  "transaction_type" smallint DEFAULT 0 NOT NULL,
  "reference_id" varchar(255),
  "signed_amount_psw" bigint NOT NULL,
  "notes" varchar(1000),
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "customer_credit_transactions"
  ADD CONSTRAINT "customer_credit_transactions_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "customer_credit_transactions"
  ADD CONSTRAINT "customer_credit_transactions_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "customer_credit_transactions_customer_idx" ON "customer_credit_transactions" USING btree ("customer_id");
CREATE INDEX "customer_credit_transactions_company_idx" ON "customer_credit_transactions" USING btree ("company_id");
CREATE INDEX "customer_credit_transactions_created_idx" ON "customer_credit_transactions" USING btree ("created_at");
