CREATE TABLE IF NOT EXISTS "help_assistant_queries" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"provider" varchar(30),
	"matched_guide_ids" text,
	"succeeded" boolean DEFAULT true NOT NULL,
	"error_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "help_assistant_queries" ADD CONSTRAINT "help_assistant_queries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "help_assistant_queries" ADD CONSTRAINT "help_assistant_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_assistant_queries_company_created_at_idx" ON "help_assistant_queries" USING btree ("company_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_assistant_queries_user_idx" ON "help_assistant_queries" USING btree ("user_id");
