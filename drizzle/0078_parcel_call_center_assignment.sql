-- Repair databases built from migrations: this field existed in the application
-- schema without a corresponding SQL migration. Preserve existing assignments.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
SET LOCAL statement_timeout = '15s';
--> statement-breakpoint
DO $migration$
DECLARE
  assignment_attnum smallint;
  user_id_attnum smallint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.parcels'::regclass
      AND attname = 'call_center_assigned_to_user_id' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.parcels
      ADD COLUMN call_center_assigned_to_user_id varchar(25);
  END IF;

  SELECT attnum INTO assignment_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.parcels'::regclass
    AND attname = 'call_center_assigned_to_user_id' AND NOT attisdropped;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.parcels'::regclass AND attnum = assignment_attnum
      AND atttypid = 'varchar'::regtype AND atttypmod = 29 AND NOT attnotnull
  ) THEN
    RAISE EXCEPTION 'Expected nullable parcels.call_center_assigned_to_user_id varchar(25); review schema drift';
  END IF;

  SELECT attnum INTO user_id_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.users'::regclass AND attname = 'id' AND NOT attisdropped;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'
      AND conkey = ARRAY[assignment_attnum]
      AND confrelid = 'public.users'::regclass AND confkey = ARRAY[user_id_attnum]
      AND confupdtype = 'a' AND confdeltype = 'a' AND NOT condeferrable
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.parcels'::regclass AND contype = 'f'
        AND assignment_attnum = ANY(conkey)
    ) THEN
      RAISE EXCEPTION 'Conflicting call-center assignment foreign key; review schema drift';
    END IF;

    -- Enforce new writes without scanning old parcels under the ALTER lock.
    -- Validate existing rows separately after this migration commits.
    ALTER TABLE public.parcels
      ADD CONSTRAINT parcels_call_center_assigned_to_user_id_users_id_fk
      FOREIGN KEY (call_center_assigned_to_user_id) REFERENCES public.users(id)
      NOT VALID;
  END IF;
END
$migration$;
--> statement-breakpoint
RESET statement_timeout;
--> statement-breakpoint
RESET lock_timeout;
