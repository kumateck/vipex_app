ALTER TABLE "leave_types"
ADD COLUMN IF NOT EXISTS "color_hex" varchar(7) NOT NULL DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS "calendar_priority" smallint NOT NULL DEFAULT 0;

ALTER TABLE "leave_requests"
ADD COLUMN IF NOT EXISTS "selection_mode" smallint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "week_start_date" timestamp,
ADD COLUMN IF NOT EXISTS "week_count" integer,
ADD COLUMN IF NOT EXISTS "swap_lock_until" timestamp;

CREATE INDEX IF NOT EXISTS "leave_requests_company_range_idx"
  ON "leave_requests" USING btree ("company_id", "date_from", "date_to");

CREATE TABLE IF NOT EXISTS "leave_swaps" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "requester_employee_id" varchar(25) NOT NULL,
  "requester_leave_request_id" varchar(25) NOT NULL,
  "target_employee_id" varchar(25) NOT NULL,
  "target_leave_request_id" varchar(25) NOT NULL,
  "requester_original_from" timestamp NOT NULL,
  "requester_original_to" timestamp NOT NULL,
  "target_original_from" timestamp NOT NULL,
  "target_original_to" timestamp NOT NULL,
  "requester_proposed_from" timestamp NOT NULL,
  "requester_proposed_to" timestamp NOT NULL,
  "target_proposed_from" timestamp NOT NULL,
  "target_proposed_to" timestamp NOT NULL,
  "status" smallint NOT NULL DEFAULT 0,
  "peer_confirmed_by" varchar(25),
  "peer_confirmed_at" timestamp,
  "approved_by" varchar(25),
  "approved_at" timestamp,
  "rejected_by" varchar(25),
  "rejected_at" timestamp,
  "rejection_reason" text,
  "created_by" varchar(25),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_requester_employee_id_employees_id_fk"
  FOREIGN KEY ("requester_employee_id") REFERENCES "public"."employees"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_requester_leave_request_id_leave_requests_id_fk"
  FOREIGN KEY ("requester_leave_request_id") REFERENCES "public"."leave_requests"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_target_employee_id_employees_id_fk"
  FOREIGN KEY ("target_employee_id") REFERENCES "public"."employees"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_target_leave_request_id_leave_requests_id_fk"
  FOREIGN KEY ("target_leave_request_id") REFERENCES "public"."leave_requests"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_peer_confirmed_by_users_id_fk"
  FOREIGN KEY ("peer_confirmed_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_approved_by_users_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_rejected_by_users_id_fk"
  FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "leave_swaps" ADD CONSTRAINT "leave_swaps_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "leave_swaps_company_status_idx"
  ON "leave_swaps" USING btree ("company_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "leave_swaps_requester_idx"
  ON "leave_swaps" USING btree ("requester_employee_id", "created_at");
CREATE INDEX IF NOT EXISTS "leave_swaps_target_idx"
  ON "leave_swaps" USING btree ("target_employee_id", "created_at");
