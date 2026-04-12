CREATE TABLE IF NOT EXISTS "fleet_trip_load_matches" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "status" smallint NOT NULL DEFAULT 0,
  "matched_by" varchar(25),
  "matched_at" timestamp DEFAULT now() NOT NULL,
  "loaded_at" timestamp,
  "unloaded_at" timestamp,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trip_load_matches_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_load_matches_trip_id_fleet_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_load_matches_parcel_id_parcels_id_fk"
    FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_load_matches_matched_by_users_id_fk"
    FOREIGN KEY ("matched_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_trip_load_matches_company_idx" ON "fleet_trip_load_matches" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_load_matches_trip_idx" ON "fleet_trip_load_matches" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_load_matches_parcel_idx" ON "fleet_trip_load_matches" USING btree ("parcel_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_load_matches_status_idx" ON "fleet_trip_load_matches" USING btree ("company_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_trip_load_matches_company_trip_parcel_uq" ON "fleet_trip_load_matches" USING btree ("company_id", "trip_id", "parcel_id");

CREATE TABLE IF NOT EXISTS "fleet_trip_telemetry_points" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25) NOT NULL,
  "sampled_at" timestamp DEFAULT now() NOT NULL,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "speed_kph" double precision,
  "heading_deg" double precision,
  "altitude_m" double precision,
  "accuracy_m" double precision,
  "source" varchar(50),
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trip_telemetry_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_telemetry_trip_id_fleet_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_telemetry_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_trip_telemetry_company_idx" ON "fleet_trip_telemetry_points" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_telemetry_trip_idx" ON "fleet_trip_telemetry_points" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_telemetry_trip_sampled_idx" ON "fleet_trip_telemetry_points" USING btree ("trip_id", "sampled_at");

CREATE TABLE IF NOT EXISTS "fleet_trip_status_updates" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25) NOT NULL,
  "status_type" smallint NOT NULL DEFAULT 0,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "location_label" varchar(255),
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trip_status_updates_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_status_updates_trip_id_fleet_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_status_updates_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_trip_status_updates_company_idx" ON "fleet_trip_status_updates" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_status_updates_trip_idx" ON "fleet_trip_status_updates" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_status_updates_trip_occurred_idx" ON "fleet_trip_status_updates" USING btree ("trip_id", "occurred_at");

CREATE TABLE IF NOT EXISTS "fleet_shift_rosters" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "employee_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25),
  "role_type" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "shift_start_at" timestamp NOT NULL,
  "shift_end_at" timestamp NOT NULL,
  "note" text,
  "created_by" varchar(25),
  "updated_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_shift_rosters_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_shift_rosters_branch_id_branches_id_fk"
    FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_shift_rosters_employee_id_employees_id_fk"
    FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_shift_rosters_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_shift_rosters_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_shift_rosters_updated_by_users_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_company_idx" ON "fleet_shift_rosters" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_branch_idx" ON "fleet_shift_rosters" USING btree ("branch_id");
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_employee_idx" ON "fleet_shift_rosters" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_vehicle_idx" ON "fleet_shift_rosters" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_window_idx" ON "fleet_shift_rosters" USING btree ("company_id", "shift_start_at", "shift_end_at");
CREATE INDEX IF NOT EXISTS "fleet_shift_rosters_status_idx" ON "fleet_shift_rosters" USING btree ("company_id", "status");
