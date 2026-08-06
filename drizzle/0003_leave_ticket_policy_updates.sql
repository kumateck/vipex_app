ALTER TABLE "job_titles"
ADD COLUMN IF NOT EXISTS "default_leave_days" integer NOT NULL DEFAULT 0;

ALTER TABLE "leave_types"
ADD COLUMN IF NOT EXISTS "min_advance_days" integer NOT NULL DEFAULT 0;

ALTER TABLE "leave_types"
ADD COLUMN IF NOT EXISTS "allow_emergency_same_day" boolean NOT NULL DEFAULT true;

ALTER TABLE "leave_requests"
ADD COLUMN IF NOT EXISTS "is_emergency" boolean NOT NULL DEFAULT false;
