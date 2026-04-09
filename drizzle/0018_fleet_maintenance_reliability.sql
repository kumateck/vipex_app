CREATE TABLE IF NOT EXISTS "fleet_maintenance_plans" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "interval_unit" smallint NOT NULL DEFAULT 1,
  "interval_value" integer NOT NULL DEFAULT 30,
  "last_service_at" timestamp,
  "last_service_odometer_km" integer,
  "next_due_at" timestamp,
  "next_due_odometer_km" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_maintenance_plans_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_plans_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_plans_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "fleet_maintenance_work_orders" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "plan_id" varchar(25),
  "work_order_no" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "opened_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "started_odometer_km" integer,
  "completed_odometer_km" integer,
  "estimated_cost_psw" bigint NOT NULL DEFAULT 0,
  "actual_cost_psw" bigint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "created_by" varchar(25),
  "updated_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_maintenance_work_orders_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_work_orders_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_work_orders_plan_id_fleet_maintenance_plans_id_fk"
    FOREIGN KEY ("plan_id") REFERENCES "public"."fleet_maintenance_plans"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_work_orders_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_work_orders_updated_by_users_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "fleet_vehicle_downtime_events" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "vehicle_id" varchar(25) NOT NULL,
  "work_order_id" varchar(25),
  "reason" varchar(255) NOT NULL,
  "note" text,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  "created_by" varchar(25),
  "closed_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_vehicle_downtime_events_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_downtime_events_vehicle_id_fleet_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_downtime_events_work_order_id_fleet_maintenance_work_orders_id_fk"
    FOREIGN KEY ("work_order_id") REFERENCES "public"."fleet_maintenance_work_orders"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_downtime_events_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_vehicle_downtime_events_closed_by_users_id_fk"
    FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_maintenance_plans_company_idx"
  ON "fleet_maintenance_plans" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_plans_vehicle_idx"
  ON "fleet_maintenance_plans" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_plans_due_date_idx"
  ON "fleet_maintenance_plans" USING btree ("company_id", "next_due_at");

CREATE INDEX IF NOT EXISTS "fleet_maintenance_work_orders_company_idx"
  ON "fleet_maintenance_work_orders" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_work_orders_vehicle_idx"
  ON "fleet_maintenance_work_orders" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_work_orders_status_idx"
  ON "fleet_maintenance_work_orders" USING btree ("company_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_maintenance_work_orders_company_work_order_no_uq"
  ON "fleet_maintenance_work_orders" USING btree ("company_id", "work_order_no");

CREATE INDEX IF NOT EXISTS "fleet_vehicle_downtime_company_idx"
  ON "fleet_vehicle_downtime_events" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_downtime_vehicle_idx"
  ON "fleet_vehicle_downtime_events" USING btree ("vehicle_id");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_downtime_started_at_idx"
  ON "fleet_vehicle_downtime_events" USING btree ("company_id", "started_at");
CREATE INDEX IF NOT EXISTS "fleet_vehicle_downtime_ended_at_idx"
  ON "fleet_vehicle_downtime_events" USING btree ("company_id", "ended_at");
