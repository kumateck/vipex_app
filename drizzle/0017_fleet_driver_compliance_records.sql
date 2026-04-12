CREATE TABLE IF NOT EXISTS "fleet_driver_compliance_records" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "employee_id" varchar(25) NOT NULL,
  "compliance_type" smallint NOT NULL DEFAULT 0,
  "document_number" varchar(100),
  "issuer" varchar(255),
  "issued_at" timestamp,
  "expires_at" timestamp,
  "file_url" varchar(500),
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_driver_compliance_records_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_driver_compliance_records_employee_id_employees_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_driver_compliance_records_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_driver_compliance_company_idx"
  ON "fleet_driver_compliance_records" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_driver_compliance_employee_idx"
  ON "fleet_driver_compliance_records" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "fleet_driver_compliance_expiry_idx"
  ON "fleet_driver_compliance_records" USING btree ("company_id", "expires_at");
