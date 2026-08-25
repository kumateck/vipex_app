ALTER TABLE "self_service_booking_drafts"
  ADD COLUMN IF NOT EXISTS "sender_customer_id" varchar(25) REFERENCES "customers"("id"),
  ADD COLUMN IF NOT EXISTS "receiver_customer_id" varchar(25) REFERENCES "customers"("id");
