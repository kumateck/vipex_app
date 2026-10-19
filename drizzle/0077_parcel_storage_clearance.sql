CREATE TABLE IF NOT EXISTS "parcel_storage_clearance_requests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"requested_days" integer NOT NULL,
	"accrued_days_at_request" integer NOT NULL,
	"daily_rate_psw" bigint NOT NULL,
	"requested_amount_psw" bigint NOT NULL,
	"clear_all" boolean DEFAULT false NOT NULL,
	"reason" text NOT NULL,
	"evidence_url" text,
	"requested_by" varchar(25) NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"approval_note" text,
	"returned_by" varchar(25),
	"returned_at" timestamp,
	"return_note" text,
	"rejected_by" varchar(25),
	"rejected_at" timestamp,
	"rejection_note" text,
	"executed_by" varchar(25),
	"executed_at" timestamp,
	"executed_days" integer,
	"executed_amount_psw" bigint,
	"accounting_journal_entry_id" varchar(25),
	"accounting_posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_returned_by_users_id_fk" FOREIGN KEY ("returned_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parcel_storage_clearance_requests" ADD CONSTRAINT "parcel_storage_clearance_requests_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parcel_storage_clearance_company_status_idx" ON "parcel_storage_clearance_requests" USING btree ("company_id","status","requested_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parcel_storage_clearance_parcel_requested_idx" ON "parcel_storage_clearance_requests" USING btree ("parcel_id","requested_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "parcel_storage_clearance_one_open_idx" ON "parcel_storage_clearance_requests" ("parcel_id") WHERE "status" IN (0, 1, 2);
