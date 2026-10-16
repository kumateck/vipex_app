ALTER TABLE "parcel_receiver_otps" ADD COLUMN IF NOT EXISTS "channel" varchar(16) NOT NULL DEFAULT 'sms';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_dispatches_provider_message_idx" ON "notification_dispatches" USING btree ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;
