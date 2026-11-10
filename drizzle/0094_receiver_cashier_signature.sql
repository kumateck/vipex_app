ALTER TABLE "branches" ADD COLUMN "require_receiver_cashier_signature" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "pending_receiver_handover" jsonb;
--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_pending_receiver_handover_check"
  CHECK ("pending_receiver_handover" IS NULL OR (
    "status" = 5 AND "confirmed_at" IS NULL AND NOT "is_deleted"
    AND ("pending_receiver_handover"->>'companyId') IS NOT DISTINCT FROM "company_id"
    AND ("pending_receiver_handover"->>'branchId') IS NOT DISTINCT FROM "destination_id"
    AND ("pending_receiver_handover"->>'receiverId') IS NOT DISTINCT FROM "receiver_id"
    AND ("pending_receiver_handover"->>'collectorId') IS NOT DISTINCT FROM
      (CASE WHEN "pending_receiver_handover"->>'handoverTarget' = 'second' THEN "second_receiver_id" ELSE "receiver_id" END)
  ));
--> statement-breakpoint
CREATE INDEX "parcels_pending_receiver_handover_idx" ON "parcels" ("company_id", "destination_id", "id")
  WHERE "pending_receiver_handover" IS NOT NULL;
