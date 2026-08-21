CREATE TABLE IF NOT EXISTS "executive_insights" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"generated_by_user_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"period_from" timestamp NOT NULL,
	"period_to" timestamp NOT NULL,
	"grounding_snapshot" text NOT NULL,
	"narrative" text,
	"provider" varchar(30),
	"succeeded" boolean DEFAULT true NOT NULL,
	"error_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "executive_insights" ADD CONSTRAINT "executive_insights_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "executive_insights" ADD CONSTRAINT "executive_insights_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "executive_insights" ADD CONSTRAINT "executive_insights_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executive_insights_company_created_at_idx" ON "executive_insights" USING btree ("company_id","created_at");
