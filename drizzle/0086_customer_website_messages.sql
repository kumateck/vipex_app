-- Customer website messages have independent storage and workflow.
CREATE TABLE "website_contact_messages" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "reference" varchar(32) NOT NULL,
  "type" varchar(20) NOT NULL CONSTRAINT "website_contact_type_check" CHECK ("type" IN ('enquiry', 'complaint', 'feedback')),
  "name" varchar(120) NOT NULL,
  "phone" varchar(32) NOT NULL,
  "email" varchar(254),
  "branch" varchar(120),
  "tracking_code" varchar(50),
  "message" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'new' CONSTRAINT "website_contact_status_check" CHECK ("status" IN ('new', 'in_progress', 'resolved', 'spam')),
  "updated_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "website_contact_reference_uq" ON "website_contact_messages" ("reference");
CREATE INDEX "website_contact_company_created_idx" ON "website_contact_messages" ("company_id", "created_at", "id");
CREATE INDEX "website_contact_company_status_idx" ON "website_contact_messages" ("company_id", "status", "created_at");
--> statement-breakpoint
CREATE TABLE "website_contact_message_events" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "message_id" varchar(25) NOT NULL REFERENCES "website_contact_messages"("id"),
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id"),
  "from_status" varchar(20),
  "to_status" varchar(20) NOT NULL,
  "note" text,
  "performed_by" varchar(25) REFERENCES "users"("id"),
  "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "website_contact_events_message_idx" ON "website_contact_message_events" ("company_id", "message_id", "created_at");
