CREATE TABLE "warehouses" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" varchar(500),
  "active" boolean DEFAULT true NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "created_by" varchar(25) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "warehouses_company_idx" ON "warehouses" USING btree ("company_id");
CREATE INDEX "warehouses_branch_idx" ON "warehouses" USING btree ("branch_id");
CREATE UNIQUE INDEX "warehouses_branch_lower_name_uq" ON "warehouses" USING btree ("branch_id", lower("name"));

CREATE TABLE "parcel_internal_holders" (
  "parcel_id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25) NOT NULL,
  "holder_type" smallint DEFAULT 0 NOT NULL,
  "location_id" varchar(25),
  "warehouse_id" varchar(25),
  "updated_by" varchar(25) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "parcel_internal_holders_branch_idx" ON "parcel_internal_holders" USING btree ("branch_id");
CREATE INDEX "parcel_internal_holders_location_idx" ON "parcel_internal_holders" USING btree ("location_id");
CREATE INDEX "parcel_internal_holders_warehouse_idx" ON "parcel_internal_holders" USING btree ("warehouse_id");

CREATE TABLE "parcel_internal_transfers" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25) NOT NULL,
  "reference_no" varchar(64),
  "source_holder_type" smallint DEFAULT 0 NOT NULL,
  "source_location_id" varchar(25),
  "source_warehouse_id" varchar(25),
  "destination_holder_type" smallint DEFAULT 1 NOT NULL,
  "destination_location_id" varchar(25),
  "destination_warehouse_id" varchar(25),
  "notes" text,
  "status" smallint DEFAULT 0 NOT NULL,
  "transferred_by" varchar(25) NOT NULL,
  "transferred_at" timestamp DEFAULT now() NOT NULL,
  "acknowledged_by" varchar(25),
  "acknowledged_at" timestamp,
  "cancelled_by" varchar(25),
  "cancelled_at" timestamp,
  "cancel_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_source_location_id_locations_id_fk" FOREIGN KEY ("source_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_destination_location_id_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_transferred_by_users_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "parcel_internal_transfers_branch_status_idx" ON "parcel_internal_transfers" USING btree ("branch_id", "status");
CREATE UNIQUE INDEX "parcel_internal_transfers_reference_uq" ON "parcel_internal_transfers" USING btree ("reference_no");
CREATE INDEX "parcel_internal_transfers_dest_location_idx" ON "parcel_internal_transfers" USING btree ("destination_location_id");
CREATE INDEX "parcel_internal_transfers_dest_warehouse_idx" ON "parcel_internal_transfers" USING btree ("destination_warehouse_id");

CREATE TABLE "parcel_internal_transfer_items" (
  "transfer_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "added_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "parcel_internal_transfer_items" ADD CONSTRAINT "parcel_internal_transfer_items_transfer_id_parcel_internal_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."parcel_internal_transfers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "parcel_internal_transfer_items" ADD CONSTRAINT "parcel_internal_transfer_items_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "parcel_internal_transfer_items_uq" ON "parcel_internal_transfer_items" USING btree ("transfer_id", "parcel_id");
CREATE INDEX "parcel_internal_transfer_items_parcel_idx" ON "parcel_internal_transfer_items" USING btree ("parcel_id");
