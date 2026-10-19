SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
CREATE TABLE "registered_devices" (
  "id" varchar(25) PRIMARY KEY,
  "user_id" varchar(25) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" varchar(25) NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "kind" varchar(16) NOT NULL CHECK ("kind" IN ('mobile', 'desktop')),
  "secret_hash" varchar(64) NOT NULL UNIQUE,
  "status" varchar(24) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'revoked', 'blocked', 'permanently_denied')),
  "device_name" varchar(160) NOT NULL,
  "model" varchar(120),
  "os_name" varchar(40) NOT NULL,
  "os_version" varchar(80),
  "app_version" varchar(80),
  "user_agent" text,
  "requested_ip" varchar(64),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" varchar(25) REFERENCES "users"("id") ON DELETE SET NULL,
  "review_reason" text,
  "last_seen_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "registered_devices_company_status_idx" ON "registered_devices" ("company_id", "status");
--> statement-breakpoint
CREATE INDEX "registered_devices_user_idx" ON "registered_devices" ("user_id");
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "device_id" varchar(25) REFERENCES "registered_devices"("id");
--> statement-breakpoint
CREATE INDEX "refresh_tokens_device_idx" ON "refresh_tokens" ("device_id");
--> statement-breakpoint
RESET lock_timeout;
