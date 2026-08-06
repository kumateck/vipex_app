CREATE TABLE IF NOT EXISTS "comm_channel_read_state" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "channel_id" varchar(25) NOT NULL,
  "user_id" varchar(25) NOT NULL,
  "last_read_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "comm_channel_read_state"
  ADD CONSTRAINT "comm_channel_read_state_channel_id_comm_channels_id_fk"
  FOREIGN KEY ("channel_id") REFERENCES "public"."comm_channels"("id")
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "comm_channel_read_state"
  ADD CONSTRAINT "comm_channel_read_state_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "comm_channel_read_state_channel_idx"
  ON "comm_channel_read_state" ("channel_id");

CREATE INDEX IF NOT EXISTS "comm_channel_read_state_user_idx"
  ON "comm_channel_read_state" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_channel_read_state_channel_user_uq"
  ON "comm_channel_read_state" ("channel_id", "user_id");
