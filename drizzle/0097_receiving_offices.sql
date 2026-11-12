CREATE TABLE "receiving_offices" (
  "id" varchar(25) PRIMARY KEY,
  "location_id" varchar(25) NOT NULL REFERENCES "locations" ("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "receiving_offices_location_name_uq"
  ON "receiving_offices" ("location_id", lower("name"));
--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "receiving_office_id" varchar(25)
  REFERENCES "receiving_offices" ("id");
--> statement-breakpoint
INSERT INTO "receiving_offices" ("id", "location_id", "name")
SELECT substr(md5(l.id || ':receiving-office:' || n), 1, 25), l.id, 'Office ' || n
FROM "locations" l
JOIN "branches" b ON b.id = l.branch_id AND b.company_id = l.company_id
CROSS JOIN LATERAL generate_series(
  1, CASE WHEN lower(btrim(b.name)) = 'kumasi'
    AND lower(regexp_replace(btrim(l.name), '[[:space:]]+', ' ', 'g')) = 'anloga junction'
    THEN 4 ELSE 1 END
) n
WHERE l.can_receive AND NOT l.is_deleted;
--> statement-breakpoint
CREATE FUNCTION "seed_receiving_office"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.can_receive AND NOT NEW.is_deleted
    AND NOT EXISTS (SELECT 1 FROM receiving_offices WHERE location_id = NEW.id)
  THEN
    INSERT INTO receiving_offices (id, location_id, name)
    SELECT substr(md5(NEW.id || ':receiving-office:' || n), 1, 25), NEW.id, 'Office ' || n
    FROM generate_series(1, CASE
      WHEN lower(regexp_replace(btrim(NEW.name), '[[:space:]]+', ' ', 'g')) = 'anloga junction'
        AND EXISTS (
          SELECT 1 FROM branches b WHERE b.id = NEW.branch_id
            AND b.company_id = NEW.company_id AND lower(btrim(b.name)) = 'kumasi'
        )
      THEN 4 ELSE 1 END) n;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "locations_seed_receiving_office"
AFTER INSERT OR UPDATE OF can_receive, is_deleted ON "locations"
FOR EACH ROW EXECUTE FUNCTION "seed_receiving_office"();
--> statement-breakpoint
CREATE FUNCTION "clear_relocated_parcel_office"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.pickup_location_id IS DISTINCT FROM OLD.pickup_location_id
      OR NEW.destination_id IS DISTINCT FROM OLD.destination_id)
    AND NEW.receiving_office_id IS NOT DISTINCT FROM OLD.receiving_office_id
  THEN
    NEW.receiving_office_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "parcels_clear_relocated_office"
BEFORE UPDATE OF pickup_location_id, destination_id ON "parcels"
FOR EACH ROW EXECUTE FUNCTION "clear_relocated_parcel_office"();
--> statement-breakpoint
UPDATE "parcels" p
SET "receiving_office_id" = o.id
FROM "receiving_offices" o
JOIN "locations" l ON l.id = o.location_id
WHERE p.pickup_location_id = l.id
  AND p.company_id = l.company_id
  AND p.destination_id = l.branch_id
  AND p.status IN (3, 4, 5, 7, 8, 12)
  AND NOT p.is_deleted
  AND p.deleted_at IS NULL
  AND p.confirmed_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "receiving_offices" other
    WHERE other.location_id = o.location_id AND other.id <> o.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM "parcel_internal_holders" h
    WHERE h.parcel_id = p.id AND (
      h.branch_id <> p.destination_id OR h.warehouse_id IS NOT NULL
      OR (h.location_id IS NOT NULL AND h.location_id <> p.pickup_location_id)
    )
  );
