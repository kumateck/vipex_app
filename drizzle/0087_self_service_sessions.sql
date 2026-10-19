-- Durable, single-use booking sessions shared by every backend instance.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
CREATE TABLE "self_service_sessions" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "payload" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "self_service_sessions_expiry_idx" ON "self_service_sessions" ("expires_at");
