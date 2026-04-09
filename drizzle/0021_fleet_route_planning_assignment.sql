CREATE TABLE IF NOT EXISTS "fleet_route_plans" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "name" varchar(255) NOT NULL,
  "code" varchar(64),
  "origin_label" varchar(255),
  "destination_label" varchar(255),
  "distance_km" double precision,
  "estimated_duration_min" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_route_plans_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_route_plans_branch_id_branches_id_fk"
    FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_route_plans_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_route_plans_company_idx"
  ON "fleet_route_plans" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_route_plans_company_active_idx"
  ON "fleet_route_plans" USING btree ("company_id", "is_active");
CREATE INDEX IF NOT EXISTS "fleet_route_plans_branch_idx"
  ON "fleet_route_plans" USING btree ("branch_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_route_plans_company_lower_name_uq"
  ON "fleet_route_plans" USING btree ("company_id", lower("name"));

CREATE TABLE IF NOT EXISTS "fleet_route_plan_stops" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "route_plan_id" varchar(25) NOT NULL,
  "sequence_no" integer NOT NULL,
  "label" varchar(255) NOT NULL,
  "address" varchar(500),
  "latitude" double precision,
  "longitude" double precision,
  "planned_arrival_offset_min" integer,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_route_plan_stops_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_route_plan_stops_route_plan_id_fleet_route_plans_id_fk"
    FOREIGN KEY ("route_plan_id") REFERENCES "public"."fleet_route_plans"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_route_plan_stops_company_idx"
  ON "fleet_route_plan_stops" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_route_plan_stops_route_plan_idx"
  ON "fleet_route_plan_stops" USING btree ("route_plan_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_route_plan_stops_route_sequence_uq"
  ON "fleet_route_plan_stops" USING btree ("route_plan_id", "sequence_no");

ALTER TABLE "fleet_trips"
  ADD COLUMN IF NOT EXISTS "route_plan_id" varchar(25);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fleet_trips_route_plan_id_fleet_route_plans_id_fk'
      AND table_name = 'fleet_trips'
  ) THEN
    ALTER TABLE "fleet_trips"
      ADD CONSTRAINT "fleet_trips_route_plan_id_fleet_route_plans_id_fk"
      FOREIGN KEY ("route_plan_id") REFERENCES "public"."fleet_route_plans"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "fleet_trips_route_plan_idx"
  ON "fleet_trips" USING btree ("route_plan_id");
