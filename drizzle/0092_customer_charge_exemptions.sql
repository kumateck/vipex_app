-- Additive: historical zero charges remain unclassified; no customer or parcel backfill.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS charge_exempt_customer_type smallint;
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS related_staff_id varchar(25) REFERENCES employees(id);
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS related_staff_name_snapshot varchar(255);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_parcel_charge_exemption() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sender_type smallint; receiver_type smallint; staff_name varchar(255);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Lock in a stable order, matching the booking service, against concurrent profile edits.
    PERFORM id FROM customers WHERE id IN (NEW.sender_id, NEW.receiver_id) ORDER BY id FOR SHARE;
    SELECT customer_type INTO sender_type FROM customers
      WHERE id = NEW.sender_id AND company_id = NEW.company_id AND is_deleted = false;
    SELECT customer_type INTO receiver_type FROM customers
      WHERE id = NEW.receiver_id AND company_id = NEW.company_id AND is_deleted = false;
    IF sender_type IS NULL OR receiver_type IS NULL THEN
      RAISE EXCEPTION 'Sender or receiver not found in this company' USING ERRCODE = '23514';
    END IF;
    NEW.charge_exempt_customer_type := CASE
      WHEN sender_type = 5 OR receiver_type = 5 THEN 5
      WHEN receiver_type IN (2,3,4) THEN receiver_type
      WHEN sender_type IN (2,3,4) THEN sender_type ELSE NULL END;
    IF NEW.charge_exempt_customer_type = 5 THEN
      SELECT display_name INTO staff_name FROM employees
        WHERE id = NEW.related_staff_id AND company_id = NEW.company_id
          AND branch_id = NEW.destination_id AND is_deleted = false AND employment_status = 0
        FOR SHARE;
      IF staff_name IS NULL THEN
        RAISE EXCEPTION 'Select active receiving staff at the destination branch' USING ERRCODE = '23514';
      END IF;
      NEW.related_staff_name_snapshot := staff_name;
    ELSIF NEW.related_staff_id IS NOT NULL THEN
      RAISE EXCEPTION 'Related staff is only allowed for Staff parcels' USING ERRCODE = '23514';
    ELSE
      NEW.related_staff_name_snapshot := NULL;
    END IF;
  ELSIF NEW.charge_exempt_customer_type IS DISTINCT FROM OLD.charge_exempt_customer_type
     OR NEW.related_staff_id IS DISTINCT FROM OLD.related_staff_id
     OR NEW.related_staff_name_snapshot IS DISTINCT FROM OLD.related_staff_name_snapshot THEN
    RAISE EXCEPTION 'Booking exemption and receiving staff history cannot be changed' USING ERRCODE = '23514';
  END IF;
  IF NEW.charge_exempt_customer_type IS NOT NULL AND
     (NEW.charge_exempt_customer_type NOT IN (2,3,4,5) OR NEW.charge_psw <> 0
       OR NEW.planned_tobepaid_psw <> 0 OR NEW.method = 4) THEN
    RAISE EXCEPTION 'Exempt parcels cannot accrue charges, receiver balances or credit' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS parcels_charge_exemption_guard ON parcels;
CREATE TRIGGER parcels_charge_exemption_guard BEFORE INSERT OR UPDATE ON parcels
  FOR EACH ROW EXECUTE FUNCTION enforce_parcel_charge_exemption();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_exempt_parcel_financial_charge() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE exemption smallint;
BEGIN
  SELECT charge_exempt_customer_type INTO exemption FROM parcels WHERE id = NEW.parcel_id FOR SHARE;
  IF exemption IS NOT NULL THEN
    IF TG_TABLE_NAME = 'payments' THEN
      RAISE EXCEPTION 'Exempt parcels cannot receive payments for any component' USING ERRCODE = '23514';
    ELSIF NEW.charge_psw <> 0 OR coalesce(NEW.requested_charge_psw, 0) <> 0 OR NEW.amount_paid_psw <> 0
       OR NEW.rider_collected_principal_psw <> 0 OR NEW.rider_collected_delivery_fee_psw <> 0 THEN
      RAISE EXCEPTION 'Exempt parcels cannot accrue delivery fees or rider collections' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS payments_charge_exemption_guard ON payments;
CREATE TRIGGER payments_charge_exemption_guard BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION prevent_exempt_parcel_financial_charge();
DROP TRIGGER IF EXISTS deliveries_charge_exemption_guard ON deliveries;
CREATE TRIGGER deliveries_charge_exemption_guard BEFORE INSERT OR UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION prevent_exempt_parcel_financial_charge();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_exempt_parcel_credit_charge() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM parcels WHERE id = NEW.reference_id AND charge_exempt_customer_type IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Exempt parcels cannot have customer credit entries' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS credit_charge_exemption_guard ON customer_credit_transactions;
CREATE TRIGGER credit_charge_exemption_guard BEFORE INSERT OR UPDATE ON customer_credit_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_exempt_parcel_credit_charge();
