CREATE TABLE "leave_types" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "code" varchar(50),
  "name" varchar(255) NOT NULL,
  "is_paid" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "leave_types_company_idx"
  ON "leave_types" USING btree ("company_id");
CREATE UNIQUE INDEX "leave_types_company_lower_name_uq"
  ON "leave_types" USING btree ("company_id", lower("name"));
CREATE UNIQUE INDEX "leave_types_company_code_uq"
  ON "leave_types" USING btree ("company_id", "code");

CREATE TABLE "leave_requests" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "employee_id" varchar(25) NOT NULL REFERENCES "employees"("id"),
  "leave_type_id" varchar(25) NOT NULL REFERENCES "leave_types"("id"),
  "date_from" timestamp NOT NULL,
  "date_to" timestamp NOT NULL,
  "days_count" integer DEFAULT 1 NOT NULL,
  "reason" text,
  "status" smallint DEFAULT 0 NOT NULL,
  "approved_by" varchar(25) REFERENCES "users"("id"),
  "approved_at" timestamp,
  "rejection_reason" text,
  "created_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "leave_requests_company_idx"
  ON "leave_requests" USING btree ("company_id");
CREATE INDEX "leave_requests_employee_idx"
  ON "leave_requests" USING btree ("employee_id", "date_from");
CREATE INDEX "leave_requests_company_status_idx"
  ON "leave_requests" USING btree ("company_id", "status");
