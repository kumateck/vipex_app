CREATE TABLE IF NOT EXISTS "fleet_maintenance_parts" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25),
  "sku" varchar(100) NOT NULL,
  "name" varchar(255) NOT NULL,
  "category" varchar(100),
  "unit" varchar(30) NOT NULL DEFAULT 'unit',
  "qty_on_hand" double precision NOT NULL DEFAULT 0,
  "reorder_level" double precision NOT NULL DEFAULT 0,
  "average_unit_cost_psw" bigint NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "note" text,
  "created_by" varchar(25),
  "updated_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_maintenance_parts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_parts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_maintenance_parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_maintenance_parts_company_idx" ON "fleet_maintenance_parts" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_parts_branch_idx" ON "fleet_maintenance_parts" USING btree ("branch_id");
CREATE INDEX IF NOT EXISTS "fleet_maintenance_parts_company_active_idx" ON "fleet_maintenance_parts" USING btree ("company_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_maintenance_parts_company_sku_uq" ON "fleet_maintenance_parts" USING btree ("company_id", "sku");

CREATE TABLE IF NOT EXISTS "fleet_maintenance_part_movements" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "part_id" varchar(25) NOT NULL,
  "work_order_id" varchar(25),
  "quantity" double precision NOT NULL,
  "unit_cost_psw" bigint NOT NULL DEFAULT 0,
  "movement_type" smallint NOT NULL DEFAULT 0,
  "note" text,
  "moved_by" varchar(25),
  "moved_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_part_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_part_movements_part_id_fleet_maintenance_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."fleet_maintenance_parts"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_part_movements_work_order_id_fleet_maintenance_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."fleet_maintenance_work_orders"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_part_movements_moved_by_users_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_part_movements_company_idx" ON "fleet_maintenance_part_movements" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_part_movements_part_idx" ON "fleet_maintenance_part_movements" USING btree ("part_id");
CREATE INDEX IF NOT EXISTS "fleet_part_movements_work_order_idx" ON "fleet_maintenance_part_movements" USING btree ("work_order_id");
CREATE INDEX IF NOT EXISTS "fleet_part_movements_moved_at_idx" ON "fleet_maintenance_part_movements" USING btree ("company_id", "moved_at");

CREATE TABLE IF NOT EXISTS "fleet_compliance_incidents" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25),
  "vehicle_id" varchar(25),
  "employee_id" varchar(25),
  "incident_type" smallint NOT NULL DEFAULT 0,
  "severity" smallint NOT NULL DEFAULT 0,
  "occurred_at" timestamp NOT NULL,
  "location_label" varchar(255),
  "description" text NOT NULL,
  "action_taken" text,
  "resolved_at" timestamp,
  "reported_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_compliance_incidents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_compliance_incidents_trip_id_fleet_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_compliance_incidents_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_compliance_incidents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_compliance_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_company_idx" ON "fleet_compliance_incidents" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_type_idx" ON "fleet_compliance_incidents" USING btree ("company_id", "incident_type");
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_severity_idx" ON "fleet_compliance_incidents" USING btree ("company_id", "severity");
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_occurred_idx" ON "fleet_compliance_incidents" USING btree ("company_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_employee_idx" ON "fleet_compliance_incidents" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "fleet_compliance_incidents_vehicle_idx" ON "fleet_compliance_incidents" USING btree ("vehicle_id");

CREATE TABLE IF NOT EXISTS "fleet_policy_acknowledgments" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "employee_id" varchar(25),
  "user_id" varchar(25),
  "policy_code" varchar(100) NOT NULL,
  "policy_version" varchar(30) NOT NULL,
  "status" smallint NOT NULL DEFAULT 0,
  "acknowledged_at" timestamp DEFAULT now() NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_policy_ack_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_policy_ack_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_policy_ack_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "fleet_policy_ack_company_idx" ON "fleet_policy_acknowledgments" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_policy_ack_employee_idx" ON "fleet_policy_acknowledgments" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "fleet_policy_ack_user_idx" ON "fleet_policy_acknowledgments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "fleet_policy_ack_policy_idx" ON "fleet_policy_acknowledgments" USING btree ("company_id", "policy_code", "policy_version");
CREATE UNIQUE INDEX IF NOT EXISTS "fleet_policy_ack_company_subject_policy_uq"
  ON "fleet_policy_acknowledgments" USING btree ("company_id", "employee_id", "user_id", "policy_code", "policy_version");
