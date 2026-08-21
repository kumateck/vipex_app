CREATE TABLE IF NOT EXISTS "ai_chat_conversations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"title" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"tool_invocations" text,
	"provider" varchar(30),
	"hit_iteration_cap" boolean DEFAULT false NOT NULL,
	"succeeded" boolean DEFAULT true NOT NULL,
	"error_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_conversation_id_ai_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_chat_conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_conversations_company_user_idx" ON "ai_chat_conversations" USING btree ("company_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_messages_conversation_created_at_idx" ON "ai_chat_messages" USING btree ("conversation_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_chat_messages_company_created_at_idx" ON "ai_chat_messages" USING btree ("company_id","created_at");
