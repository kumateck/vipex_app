CREATE TABLE "customer_credit_allocations" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "customer_id" varchar(25) NOT NULL,
  "charge_transaction_id" varchar(25) NOT NULL,
  "payment_transaction_id" varchar(25) NOT NULL,
  "amount_psw" bigint NOT NULL,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "customer_credit_allocations"
  ADD CONSTRAINT "customer_credit_allocations_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "customer_credit_allocations"
  ADD CONSTRAINT "customer_credit_allocations_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "customer_credit_allocations"
  ADD CONSTRAINT "customer_credit_allocations_charge_transaction_id_customer_credit_transactions_id_fk"
  FOREIGN KEY ("charge_transaction_id") REFERENCES "public"."customer_credit_transactions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "customer_credit_allocations"
  ADD CONSTRAINT "customer_credit_allocations_payment_transaction_id_customer_credit_transactions_id_fk"
  FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."customer_credit_transactions"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "customer_credit_allocations_customer_idx" ON "customer_credit_allocations" USING btree ("customer_id");
CREATE INDEX "customer_credit_allocations_company_idx" ON "customer_credit_allocations" USING btree ("company_id");
CREATE INDEX "customer_credit_allocations_charge_idx" ON "customer_credit_allocations" USING btree ("charge_transaction_id");
CREATE INDEX "customer_credit_allocations_payment_idx" ON "customer_credit_allocations" USING btree ("payment_transaction_id");
CREATE UNIQUE INDEX "customer_credit_allocations_charge_payment_uq" ON "customer_credit_allocations" USING btree ("charge_transaction_id", "payment_transaction_id");
