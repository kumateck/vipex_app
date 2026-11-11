ALTER TABLE parcels
  ADD COLUMN handover_note varchar(1000),
  ADD COLUMN handover_note_cleared_at timestamp;
--> statement-breakpoint
CREATE FUNCTION preserve_parcel_handover_note_clearance() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.handover_note_cleared_at IS NOT NULL THEN
    NEW.handover_note_cleared_at := OLD.handover_note_cleared_at;
  ELSIF OLD.status IN (6, 10, 11) OR NEW.status IN (6, 10, 11) THEN
    NEW.handover_note_cleared_at := now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER parcels_handover_note_clearance
BEFORE UPDATE ON parcels
FOR EACH ROW EXECUTE FUNCTION preserve_parcel_handover_note_clearance();
