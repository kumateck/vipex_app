-- Hotfix migration to align mixed/partially-migrated environments.
-- Safe to run multiple times.

-- Fleet vehicle registry columns
ALTER TABLE "fleet_vehicles"
  ADD COLUMN IF NOT EXISTS "year" integer,
  ADD COLUMN IF NOT EXISTS "vin" varchar(64),
  ADD COLUMN IF NOT EXISTS "ownership_type" smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lessor_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "lease_start_at" timestamp,
  ADD COLUMN IF NOT EXISTS "lease_end_at" timestamp,
  ADD COLUMN IF NOT EXISTS "fuel_type" smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "expected_km_per_liter" double precision,
  ADD COLUMN IF NOT EXISTS "tank_capacity_liters" double precision,
  ADD COLUMN IF NOT EXISTS "payload_capacity_kg" double precision,
  ADD COLUMN IF NOT EXISTS "cargo_capacity_cbm" double precision,
  ADD COLUMN IF NOT EXISTS "lifecycle_status" smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "insurance_expiry_at" timestamp,
  ADD COLUMN IF NOT EXISTS "roadworthy_expiry_at" timestamp;

-- Fleet vehicle documents child table
CREATE TABLE IF NOT EXISTS "fleet_vehicle_documents" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "document_type" varchar(100) NOT NULL,
  "document_number" varchar(100),
  "issuer" varchar(255),
  "issued_at" timestamp,
  "expires_at" timestamp,
  "file_url" varchar(500),
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_vehicle_documents'
         AND constraint_name = 'fleet_vehicle_documents_company_id_companies_id_fk'
     ) THEN
    ALTER TABLE "fleet_vehicle_documents"
      ADD CONSTRAINT "fleet_vehicle_documents_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fleet_vehicles')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_vehicle_documents'
         AND constraint_name = 'fleet_vehicle_documents_vehicle_id_fleet_vehicles_id_fk'
     ) THEN
    ALTER TABLE "fleet_vehicle_documents"
      ADD CONSTRAINT "fleet_vehicle_documents_vehicle_id_fleet_vehicles_id_fk"
      FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_vehicle_documents'
         AND constraint_name = 'fleet_vehicle_documents_created_by_users_id_fk'
     ) THEN
    ALTER TABLE "fleet_vehicle_documents"
      ADD CONSTRAINT "fleet_vehicle_documents_created_by_users_id_fk"
      FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_company_idx"
  ON "fleet_vehicle_documents" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_vehicle_idx"
  ON "fleet_vehicle_documents" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_documents_expiry_idx"
  ON "fleet_vehicle_documents" USING btree ("company_id", "expires_at");

-- Fleet trips baseline table (for environments where foundational migration was skipped)
CREATE TABLE IF NOT EXISTS "fleet_trips" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "trip_no" varchar(50) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "route_plan_id" varchar(25),
  "driver_employee_id" varchar(25) NOT NULL,
  "planned_start_at" timestamp,
  "planned_end_at" timestamp,
  "started_at" timestamp,
  "ended_at" timestamp,
  "start_odometer_km" integer,
  "end_odometer_km" integer,
  "note" text,
  "status" smallint DEFAULT 0 NOT NULL,
  "created_by" varchar(25),
  "updated_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_company_id_companies_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_branch_id_branches_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_branch_id_branches_id_fk"
      FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fleet_vehicles')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_vehicle_id_fleet_vehicles_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_vehicle_id_fleet_vehicles_id_fk"
      FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fleet_route_plans')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_route_plan_id_fleet_route_plans_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_route_plan_id_fleet_route_plans_id_fk"
      FOREIGN KEY ("route_plan_id") REFERENCES "public"."fleet_route_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_driver_employee_id_employees_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_driver_employee_id_employees_id_fk"
      FOREIGN KEY ("driver_employee_id") REFERENCES "public"."employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_created_by_users_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_created_by_users_id_fk"
      FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'fleet_trips'
         AND constraint_name = 'fleet_trips_updated_by_users_id_fk'
     ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_updated_by_users_id_fk"
      FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "fleet_trips_company_idx" ON "fleet_trips" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_company_status_idx" ON "fleet_trips" USING btree ("company_id", "status");
CREATE INDEX IF NOT EXISTS "fleet_trips_vehicle_idx" ON "fleet_trips" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_route_plan_idx" ON "fleet_trips" USING btree ("route_plan_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_driver_idx" ON "fleet_trips" USING btree ("driver_employee_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_branch_idx" ON "fleet_trips" USING btree ("branch_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_trips_company_trip_no_uq"
  ON "fleet_trips" USING btree ("company_id", "trip_no");

-- Procurement demands table
CREATE TABLE IF NOT EXISTS "procurement_demands" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "demand_no" varchar(50) NOT NULL,
  "source_module" varchar(50) NOT NULL,
  "source_entity_type" varchar(100),
  "source_entity_id" varchar(25),
  "dedupe_key" varchar(200),
  "item_code" varchar(100) NOT NULL,
  "item_name" varchar(255) NOT NULL,
  "unit" varchar(30) DEFAULT 'unit' NOT NULL,
  "quantity" bigint DEFAULT 1 NOT NULL,
  "estimated_unit_cost_psw" bigint DEFAULT 0 NOT NULL,
  "estimated_total_psw" bigint DEFAULT 0 NOT NULL,
  "urgency" smallint DEFAULT 1 NOT NULL,
  "needed_by" timestamp,
  "status" smallint DEFAULT 0 NOT NULL,
  "note" text,
  "metadata_json" text,
  "requested_by_user_id" varchar(25) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'procurement_demands'
         AND constraint_name = 'procurement_demands_company_id_companies_id_fk'
     ) THEN
    ALTER TABLE "procurement_demands"
      ADD CONSTRAINT "procurement_demands_company_id_companies_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'procurement_demands'
         AND constraint_name = 'procurement_demands_branch_id_branches_id_fk'
     ) THEN
    ALTER TABLE "procurement_demands"
      ADD CONSTRAINT "procurement_demands_branch_id_branches_id_fk"
      FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_name = 'procurement_demands'
         AND constraint_name = 'procurement_demands_requested_by_user_id_users_id_fk'
     ) THEN
    ALTER TABLE "procurement_demands"
      ADD CONSTRAINT "procurement_demands_requested_by_user_id_users_id_fk"
      FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "procurement_demands_company_idx" ON "procurement_demands" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "procurement_demands_company_status_idx"
  ON "procurement_demands" USING btree ("company_id", "status");
CREATE INDEX IF NOT EXISTS "procurement_demands_company_source_idx"
  ON "procurement_demands" USING btree ("company_id", "source_module", "source_entity_type", "source_entity_id");
CREATE INDEX IF NOT EXISTS "procurement_demands_branch_idx" ON "procurement_demands" USING btree ("branch_id");
CREATE INDEX IF NOT EXISTS "procurement_demands_dedupe_idx"
  ON "procurement_demands" USING btree ("company_id", "dedupe_key");
CREATE UNIQUE INDEX IF NOT EXISTS "procurement_demands_company_demand_no_uq"
  ON "procurement_demands" USING btree ("company_id", "demand_no");
