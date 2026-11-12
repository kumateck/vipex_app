CREATE INDEX "parcels_receiving_office_idx"
  ON "parcels" ("receiving_office_id")
  WHERE "receiving_office_id" IS NOT NULL;
--> statement-breakpoint
DROP TRIGGER "locations_seed_receiving_office" ON "locations";
--> statement-breakpoint
CREATE TRIGGER "locations_seed_receiving_office"
AFTER INSERT ON "locations"
FOR EACH ROW EXECUTE FUNCTION "seed_receiving_office"();
--> statement-breakpoint
CREATE TRIGGER "locations_enable_receiving_office"
AFTER UPDATE OF can_receive, is_deleted ON "locations"
FOR EACH ROW
WHEN (NEW.can_receive AND NOT NEW.is_deleted AND (NOT OLD.can_receive OR OLD.is_deleted))
EXECUTE FUNCTION "seed_receiving_office"();
