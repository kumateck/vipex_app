-- Drizzle runs migrations in one transaction. Keep this migration metadata-only;
-- backfill existing rows separately in small committed batches.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
ALTER TABLE "parcels"
  ADD COLUMN "sender_name_snapshot" varchar(255),
  ADD COLUMN "receiver_name_snapshot" varchar(255),
  ADD COLUMN "second_receiver_name_snapshot" varchar(255);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION set_parcel_customer_name_snapshots()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT fullname INTO NEW.sender_name_snapshot
    FROM customers
    WHERE id = NEW.sender_id AND company_id = NEW.company_id;
    SELECT fullname INTO NEW.receiver_name_snapshot
    FROM customers
    WHERE id = NEW.receiver_id AND company_id = NEW.company_id;
    IF NEW.second_receiver_id IS NOT NULL THEN
      SELECT fullname INTO NEW.second_receiver_name_snapshot
      FROM customers
      WHERE id = NEW.second_receiver_id AND company_id = NEW.company_id;
    ELSE
      NEW.second_receiver_name_snapshot := NULL;
    END IF;
  ELSE
    IF NEW.sender_id IS DISTINCT FROM OLD.sender_id OR OLD.sender_name_snapshot IS NULL THEN
      SELECT fullname INTO NEW.sender_name_snapshot
      FROM customers
      WHERE id = NEW.sender_id AND company_id = NEW.company_id;
    ELSE
      NEW.sender_name_snapshot := OLD.sender_name_snapshot;
    END IF;
    IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id OR OLD.receiver_name_snapshot IS NULL THEN
      SELECT fullname INTO NEW.receiver_name_snapshot
      FROM customers
      WHERE id = NEW.receiver_id AND company_id = NEW.company_id;
    ELSE
      NEW.receiver_name_snapshot := OLD.receiver_name_snapshot;
    END IF;
    IF NEW.second_receiver_id IS NULL THEN
      NEW.second_receiver_name_snapshot := NULL;
    ELSIF NEW.second_receiver_id IS DISTINCT FROM OLD.second_receiver_id
       OR OLD.second_receiver_name_snapshot IS NULL THEN
      SELECT fullname INTO NEW.second_receiver_name_snapshot
      FROM customers
      WHERE id = NEW.second_receiver_id AND company_id = NEW.company_id;
    ELSE
      NEW.second_receiver_name_snapshot := OLD.second_receiver_name_snapshot;
    END IF;
  END IF;

  IF NULLIF(BTRIM(NEW.sender_name_snapshot), '') IS NULL
     OR NULLIF(BTRIM(NEW.receiver_name_snapshot), '') IS NULL
     OR (NEW.second_receiver_id IS NOT NULL AND NULLIF(BTRIM(NEW.second_receiver_name_snapshot), '') IS NULL) THEN
    RAISE EXCEPTION 'Parcel customer names could not be resolved for company %', NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER parcels_customer_name_snapshots_trigger
BEFORE INSERT OR UPDATE ON parcels
FOR EACH ROW EXECUTE FUNCTION set_parcel_customer_name_snapshots();
--> statement-breakpoint
RESET lock_timeout;
