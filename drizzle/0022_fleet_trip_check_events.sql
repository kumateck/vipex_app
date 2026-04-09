CREATE TABLE IF NOT EXISTS "fleet_trip_events" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "trip_id" varchar(25) NOT NULL,
  "event_type" smallint NOT NULL DEFAULT 0,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "odometer_km" integer,
  "latitude" double precision,
  "longitude" double precision,
  "location_label" varchar(255),
  "note" text,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fleet_trip_events_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_events_trip_id_fleet_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."fleet_trips"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "fleet_trip_events_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fleet_trip_events_company_idx"
  ON "fleet_trip_events" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_events_trip_idx"
  ON "fleet_trip_events" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "fleet_trip_events_company_trip_occurred_idx"
  ON "fleet_trip_events" USING btree ("company_id", "trip_id", "occurred_at");
