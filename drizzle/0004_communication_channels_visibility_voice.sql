ALTER TABLE "comm_channels"
  ADD COLUMN "channel_type" varchar(20) NOT NULL DEFAULT 'text',
  ADD COLUMN "visibility" varchar(20) NOT NULL DEFAULT 'public',
  ADD COLUMN "thread_id" varchar(25),
  ADD COLUMN "max_participants" integer,
  ADD COLUMN "is_archived" boolean NOT NULL DEFAULT false,
  ADD COLUMN "archived_at" timestamp;

ALTER TABLE "comm_channels"
  ADD CONSTRAINT "comm_channels_thread_id_comm_threads_id_fk"
  FOREIGN KEY ("thread_id") REFERENCES "public"."comm_threads"("id")
  ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "comm_channels_company_type_idx"
  ON "comm_channels" ("company_id", "channel_type");

CREATE INDEX IF NOT EXISTS "comm_channels_company_visibility_idx"
  ON "comm_channels" ("company_id", "visibility");
