ALTER TABLE "branches" ADD COLUMN "use_pickup_queue" boolean DEFAULT false NOT NULL;

CREATE TABLE "pickup_queues" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "branch_id" varchar(25) NOT NULL,
  "parcel_id" varchar(25) NOT NULL,
  "payment_bucket" varchar(2) NOT NULL,
  "queue_date" timestamp NOT NULL,
  "queue_number" integer NOT NULL,
  "queue_code" varchar(32) NOT NULL,
  "picker_staff_id" varchar(25),
  "id_card_type_id" varchar(25),
  "id_card_number" varchar(255),
  "queued_by" varchar(25) NOT NULL,
  "queued_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  "ended_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_parcel_id_parcels_id_fk"
  FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_picker_staff_id_users_id_fk"
  FOREIGN KEY ("picker_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_id_card_type_id_cards_id_fk"
  FOREIGN KEY ("id_card_type_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_queued_by_users_id_fk"
  FOREIGN KEY ("queued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pickup_queues"
  ADD CONSTRAINT "pickup_queues_ended_by_users_id_fk"
  FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

CREATE UNIQUE INDEX "pickup_queues_parcel_uq" ON "pickup_queues" USING btree ("parcel_id");
CREATE UNIQUE INDEX "pickup_queues_daily_code_uq" ON "pickup_queues" USING btree ("branch_id","queue_date","payment_bucket","queue_number");
CREATE INDEX "pickup_queues_branch_queued_at_idx" ON "pickup_queues" USING btree ("branch_id","queued_at");
CREATE UNIQUE INDEX "pickup_queues_code_uq" ON "pickup_queues" USING btree ("queue_code");
