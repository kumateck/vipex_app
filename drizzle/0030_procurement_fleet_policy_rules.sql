CREATE TABLE IF NOT EXISTS "procurement_fleet_policies" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "preferred_supplier_id" varchar(25),
  "demand_urgency" smallint DEFAULT 1 NOT NULL,
  "replenish_multiplier" integer DEFAULT 1 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'procurement_fleet_policies'
      AND constraint_name = 'procurement_fleet_policies_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "procurement_fleet_policies"
      ADD CONSTRAINT "procurement_fleet_policies_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'procurement_fleet_policies'
      AND constraint_name = 'procurement_fleet_policies_branch_id_branches_id_fk'
  ) THEN
    ALTER TABLE "procurement_fleet_policies"
      ADD CONSTRAINT "procurement_fleet_policies_branch_id_branches_id_fk"
      FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'procurement_fleet_policies'
      AND constraint_name = 'procurement_fleet_policies_preferred_supplier_id_procurement_suppliers_id_fk'
  ) THEN
    ALTER TABLE "procurement_fleet_policies"
      ADD CONSTRAINT "procurement_fleet_policies_preferred_supplier_id_procurement_suppliers_id_fk"
      FOREIGN KEY ("preferred_supplier_id") REFERENCES "public"."procurement_suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'procurement_fleet_policies'
      AND constraint_name = 'procurement_fleet_policies_created_by_users_id_fk'
  ) THEN
    ALTER TABLE "procurement_fleet_policies"
      ADD CONSTRAINT "procurement_fleet_policies_created_by_users_id_fk"
      FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "procurement_fleet_policies_company_idx"
  ON "procurement_fleet_policies" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "procurement_fleet_policies_company_active_idx"
  ON "procurement_fleet_policies" USING btree ("company_id","is_active");
CREATE INDEX IF NOT EXISTS "procurement_fleet_policies_company_branch_idx"
  ON "procurement_fleet_policies" USING btree ("company_id","branch_id");
CREATE INDEX IF NOT EXISTS "procurement_fleet_policies_supplier_idx"
  ON "procurement_fleet_policies" USING btree ("preferred_supplier_id");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_fleet_policies_company_branch_uq"
  ON "procurement_fleet_policies" USING btree ("company_id","branch_id");
