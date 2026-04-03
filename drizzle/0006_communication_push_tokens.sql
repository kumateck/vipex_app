CREATE TABLE IF NOT EXISTS "comm_push_tokens" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "user_id" varchar(25) NOT NULL,
  "token" varchar(255) NOT NULL,
  "platform" varchar(20) NOT NULL DEFAULT 'unknown',
  "is_active" boolean NOT NULL DEFAULT true,
  "last_seen_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "comm_push_tokens"
  ADD CONSTRAINT "comm_push_tokens_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "comm_push_tokens"
  ADD CONSTRAINT "comm_push_tokens_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "comm_push_tokens_company_user_idx"
  ON "comm_push_tokens" ("company_id", "user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_push_tokens_token_uq"
  ON "comm_push_tokens" ("token");
