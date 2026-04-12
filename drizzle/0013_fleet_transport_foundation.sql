-- Fleet transport foundation bootstrap.
-- Required for environments where base fleet tables were not present.
-- Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS "fleet_vehicles" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "plate_number" varchar(50) NOT NULL,
  "model" varchar(255) NOT NULL,
  "year" integer,
  "vin" varchar(64),
  "ownership_type" smallint NOT NULL DEFAULT 0,
  "lessor_name" varchar(255),
  "lease_start_at" timestamp,
  "lease_end_at" timestamp,
  "fuel_type" smallint NOT NULL DEFAULT 1,
  "expected_km_per_liter" double precision,
  "tank_capacity_liters" double precision,
  "payload_capacity_kg" double precision,
  "cargo_capacity_cbm" double precision,
  "lifecycle_status" smallint NOT NULL DEFAULT 0,
  "insurance_expiry_at" timestamp,
  "roadworthy_expiry_at" timestamp,
  "assigned_driver_user_id" varchar(25),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_vehicles_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicles_branch_id_branches_id_fk"
    FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicles_assigned_driver_user_id_users_id_fk"
    FOREIGN KEY ("assigned_driver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicles_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_vehicles_company_idx"
  ON "fleet_vehicles" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicles_company_active_idx"
  ON "fleet_vehicles" USING btree ("company_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_vehicles_company_lower_plate_uq"
  ON "fleet_vehicles" USING btree ("company_id", lower("plate_number"));

CREATE TABLE IF NOT EXISTS "fleet_fuel_logs" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "vehicle_id" varchar(25) NOT NULL,
  "log_no" varchar(50) NOT NULL,
  "liters" double precision NOT NULL,
  "fuel_cost_psw" bigint NOT NULL DEFAULT 0,
  "odometer_km" integer,
  "station_name" varchar(255),
  "note" text,
  "status" smallint NOT NULL DEFAULT 1,
  "logged_by_user_id" varchar(25) NOT NULL,
  "approved_by_user_id" varchar(25),
  "rejected_by_user_id" varchar(25),
  "rejection_reason" text,
  "approved_at" timestamp,
  "rejected_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_fuel_logs_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_fuel_logs_branch_id_branches_id_fk"
    FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_fuel_logs_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_fuel_logs_logged_by_user_id_users_id_fk"
    FOREIGN KEY ("logged_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_fuel_logs_approved_by_user_id_users_id_fk"
    FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_fuel_logs_rejected_by_user_id_users_id_fk"
    FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_company_idx"
  ON "fleet_fuel_logs" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_company_status_idx"
  ON "fleet_fuel_logs" USING btree ("company_id", "status");
CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_vehicle_idx"
  ON "fleet_fuel_logs" USING btree ("vehicle_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_fuel_logs_company_log_no_uq"
  ON "fleet_fuel_logs" USING btree ("company_id", "log_no");

CREATE TABLE IF NOT EXISTS "fleet_trips" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "trip_no" varchar(50) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "driver_employee_id" varchar(25) NOT NULL,
  "planned_start_at" timestamp,
  "planned_end_at" timestamp,
  "started_at" timestamp,
  "ended_at" timestamp,
  "start_odometer_km" integer,
  "end_odometer_km" integer,
  "note" text,
  "status" smallint NOT NULL DEFAULT 0,
  "created_by" varchar(25),
  "updated_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trips_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trips_branch_id_branches_id_fk"
    FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trips_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trips_driver_employee_id_employees_id_fk"
    FOREIGN KEY ("driver_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trips_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trips_updated_by_users_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_trips_company_idx"
  ON "fleet_trips" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_company_status_idx"
  ON "fleet_trips" USING btree ("company_id", "status");
CREATE INDEX IF NOT EXISTS "fleet_trips_vehicle_idx"
  ON "fleet_trips" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_driver_idx"
  ON "fleet_trips" USING btree ("driver_employee_id");
CREATE INDEX IF NOT EXISTS "fleet_trips_branch_idx"
  ON "fleet_trips" USING btree ("branch_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_trips_company_trip_no_uq"
  ON "fleet_trips" USING btree ("company_id", "trip_no");

CREATE TABLE IF NOT EXISTS "fleet_trip_crew_assignments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25) NOT NULL,
  "employee_id" varchar(25) NOT NULL,
  "role" varchar(100) NOT NULL DEFAULT 'crew',
  "assigned_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trip_crew_assignments_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_crew_assignments_trip_id_fleet_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_crew_assignments_employee_id_employees_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_crew_assignments_assigned_by_users_id_fk"
    FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_trip_crew_company_idx"
  ON "fleet_trip_crew_assignments" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_crew_trip_idx"
  ON "fleet_trip_crew_assignments" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_crew_employee_idx"
  ON "fleet_trip_crew_assignments" USING btree ("employee_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_trip_crew_company_trip_employee_uq"
  ON "fleet_trip_crew_assignments" USING btree ("company_id", "trip_id", "employee_id");
