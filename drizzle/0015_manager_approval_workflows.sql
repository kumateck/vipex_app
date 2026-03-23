ALTER TABLE "leave_requests"
  ADD COLUMN "manager_approval_status" smallint DEFAULT 0 NOT NULL,
  ADD COLUMN "manager_approved_by" varchar(25) REFERENCES "users"("id"),
  ADD COLUMN "manager_approved_at" timestamp,
  ADD COLUMN "manager_rejection_reason" text;

UPDATE "leave_requests" lr
SET
  "manager_approval_status" = CASE
    WHEN lr."status" = 2 THEN 2
    WHEN lr."status" = 1 THEN 1
    WHEN e."manager_employee_id" IS NULL THEN 1
    ELSE 0
  END,
  "manager_approved_at" = CASE
    WHEN lr."status" IN (1, 2) THEN COALESCE(lr."approved_at", lr."created_at")
    WHEN e."manager_employee_id" IS NULL THEN lr."created_at"
    ELSE NULL
  END,
  "manager_rejection_reason" = CASE
    WHEN lr."status" = 2 THEN lr."rejection_reason"
    ELSE NULL
  END
FROM "employees" e
WHERE e."id" = lr."employee_id";

ALTER TABLE "payroll_overtime_entries"
  ADD COLUMN "approval_status" smallint DEFAULT 0 NOT NULL,
  ADD COLUMN "approved_by" varchar(25) REFERENCES "users"("id"),
  ADD COLUMN "approved_at" timestamp,
  ADD COLUMN "rejection_reason" text;

UPDATE "payroll_overtime_entries"
SET
  "approval_status" = 1,
  "approved_at" = "created_at"
WHERE "approval_status" = 0;

ALTER TABLE "payroll_manual_adjustments"
  ADD COLUMN "approval_status" smallint DEFAULT 0 NOT NULL,
  ADD COLUMN "approved_by" varchar(25) REFERENCES "users"("id"),
  ADD COLUMN "approved_at" timestamp,
  ADD COLUMN "rejection_reason" text;

UPDATE "payroll_manual_adjustments"
SET
  "approval_status" = 1,
  "approved_at" = "created_at"
WHERE "approval_status" = 0;
