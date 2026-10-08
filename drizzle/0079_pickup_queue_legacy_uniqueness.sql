-- Migration 0011 replaced lifetime parcel uniqueness with daily active-ticket
-- uniqueness. Repair environments whose ledger advanced but retained the old key.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
SET LOCAL statement_timeout = '15s';
--> statement-breakpoint
DO $migration$
DECLARE
  legacy_index oid := to_regclass('public.pickup_queues_parcel_uq');
  constraint_name text;
  definition record;
  expected record;
BEGIN
  IF legacy_index IS NULL THEN RETURN; END IF;
  -- Hold a short lock while checking and dropping so the replacement indexes
  -- cannot disappear between the safety checks and removal of the legacy key.
  LOCK TABLE public.pickup_queues IN ACCESS EXCLUSIVE MODE;

  SELECT i.indrelid, i.indisunique, i.indisvalid, i.indpred,
    ARRAY(SELECT a.attname::text FROM unnest(i.indkey) WITH ORDINALITY k(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
      ORDER BY k.ord) AS columns
  INTO definition FROM pg_index i WHERE i.indexrelid = legacy_index;
  IF definition.indrelid IS DISTINCT FROM to_regclass('public.pickup_queues')
    OR NOT definition.indisunique OR NOT definition.indisvalid
    OR definition.indpred IS NOT NULL OR definition.columns IS DISTINCT FROM ARRAY['parcel_id']::text[]
  THEN
    RAISE EXCEPTION 'Unexpected pickup_queues_parcel_uq definition; review schema drift';
  END IF;

  FOR expected IN SELECT * FROM (VALUES
    ('pickup_queues_open_parcel_daily_uq', ARRAY['parcel_id', 'queue_date']::text[], 'ended_atISNULL'),
    ('pickup_queues_daily_code_uq', ARRAY['branch_id', 'location_id', 'queue_date', 'queue_number']::text[], NULL)
  ) AS required(name, columns, predicate)
  LOOP
    SELECT i.indisunique, i.indisvalid, i.indisready,
      regexp_replace(pg_get_expr(i.indpred, i.indrelid), '[()[:space:]]', '', 'g') AS predicate,
      ARRAY(SELECT a.attname::text FROM unnest(i.indkey) WITH ORDINALITY k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        ORDER BY k.ord) AS columns
    INTO definition FROM pg_index i
    WHERE i.indexrelid = to_regclass('public.' || expected.name)
      AND i.indrelid = 'public.pickup_queues'::regclass;
    IF NOT FOUND OR NOT definition.indisunique OR NOT definition.indisvalid OR NOT definition.indisready
      OR definition.columns IS DISTINCT FROM expected.columns
      OR definition.predicate IS DISTINCT FROM expected.predicate
    THEN
      RAISE EXCEPTION 'Required daily uniqueness index % is missing or incompatible; refusing to remove legacy key', expected.name;
    END IF;
  END LOOP;

  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conindid = legacy_index AND conrelid = 'public.pickup_queues'::regclass AND contype = 'u';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.pickup_queues DROP CONSTRAINT %I', constraint_name);
  ELSE
    DROP INDEX public.pickup_queues_parcel_uq;
  END IF;
END
$migration$;
--> statement-breakpoint
RESET statement_timeout;
--> statement-breakpoint
RESET lock_timeout;
