ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "can_send" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "can_receive" boolean NOT NULL DEFAULT true;
