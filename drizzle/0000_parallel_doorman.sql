CREATE TABLE "branches" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"telephone" varchar(255),
	"address" varchar(255),
	"email" varchar(255),
	"latitude" double precision,
	"longitude" double precision,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"tin" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"permission" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"perm_type" varchar(255) NOT NULL,
	"perm_icon" varchar(255),
	"perm_parent" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"role_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"permission_id" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statuses" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"type" smallint DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"telephone" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"status" smallint DEFAULT 1 NOT NULL,
	"role_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"tax_report_confirmation" boolean DEFAULT false NOT NULL,
	"reset_token" varchar(255),
	"reset_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_cards" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"customer_id" varchar(25) NOT NULL,
	"card_id" varchar(25) NOT NULL,
	"card_number" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"telephone" varchar(255),
	"telephone2" varchar(255),
	"address" varchar(255),
	"email" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"sender_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_id" varchar(25) NOT NULL,
	"status_id" varchar(25) NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cashier_session_id" varchar(25)
);
--> statement-breakpoint
CREATE TABLE "consignment_items" (
	"consignment_id" varchar(25) NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "consignments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_id" varchar(25) NOT NULL,
	"destination_id" varchar(25) NOT NULL,
	"consignment_date" timestamp NOT NULL,
	"serial_for_day" integer NOT NULL,
	"code" varchar(255) NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_id" varchar(25) NOT NULL,
	"destination_id" varchar(25) NOT NULL,
	"booking_id" varchar(25) NOT NULL,
	"booking_code" varchar(255) NOT NULL,
	"tracking_code" varchar(255) NOT NULL,
	"sender_id" varchar(25) NOT NULL,
	"receiver_id" varchar(25) NOT NULL,
	"second_receiver_id" varchar(25),
	"status_id" varchar(25) NOT NULL,
	"parcel_details" varchar(255) NOT NULL,
	"parcel_content" varchar(255) NOT NULL,
	"parcel_value_psw" bigint DEFAULT 0 NOT NULL,
	"card_id" varchar(25),
	"card_number" varchar(255),
	"second_card_id" varchar(25),
	"second_card_number" varchar(255),
	"pickup_location_id" varchar(25),
	"planned_tobepaid_psw" bigint DEFAULT 0 NOT NULL,
	"method" smallint DEFAULT 0 NOT NULL,
	"tax_report_confirmation" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"received_by" varchar(25),
	"received_at" timestamp,
	"confirmed_by" varchar(25),
	"confirmed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cashier_session_id" varchar(25)
);
--> statement-breakpoint
CREATE TABLE "pending_bookings" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"booking_data" json NOT NULL,
	"payment_responsibility" smallint DEFAULT 0 NOT NULL,
	"sender_amount_psw" bigint DEFAULT 0 NOT NULL,
	"recipient_amount_psw" bigint DEFAULT 0 NOT NULL,
	"attendant_id" varchar(25) NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"cancelled_by" varchar(25),
	"cancel_reason" text
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"mode" smallint DEFAULT 0 NOT NULL,
	"status" varchar(30) DEFAULT 'QUEUED' NOT NULL,
	"office_location_id" varchar(25),
	"dropoff_address" varchar(255),
	"front_desk_user_id" varchar(25),
	"delivery_user_id" varchar(25),
	"rider_user_id" varchar(25),
	"receiver_called_confirmed_by" varchar(25),
	"receiver_called_confirmed_at" timestamp,
	"charge_psw" bigint DEFAULT 0 NOT NULL,
	"amount_paid_psw" bigint DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"delivered_at" timestamp,
	"confirmed_by" varchar(25),
	"confirmed_at" timestamp,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cashier_session_id" varchar(25)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"component" smallint DEFAULT 0 NOT NULL,
	"payer" smallint DEFAULT 0 NOT NULL,
	"cashier_type" smallint DEFAULT 0 NOT NULL,
	"method" smallint DEFAULT 0 NOT NULL,
	"cashier_user_id" varchar(25) NOT NULL,
	"gross_amount_psw" bigint NOT NULL,
	"net_amount_psw" bigint NOT NULL,
	"vat_psw" bigint NOT NULL,
	"getfund_psw" bigint NOT NULL,
	"nhil_psw" bigint NOT NULL,
	"covid_psw" bigint NOT NULL,
	"tax_total_psw" bigint NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"notes" varchar(1000),
	"receipt_no" varchar(255),
	"voided_at" timestamp,
	"voided_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_components" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"profile_id" varchar(25) NOT NULL,
	"key" varchar(50) NOT NULL,
	"numerator" bigint NOT NULL,
	"denominator" bigint NOT NULL,
	"inclusive" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_profiles" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"replaced_by_hash" varchar(64),
	"user_agent" text,
	"ip" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "inventory_locations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"category_id" varchar(25),
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"unit_of_measure" smallint DEFAULT 0 NOT NULL,
	"min_stock_level" bigint DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"product_id" varchar(25) NOT NULL,
	"location_id" varchar(25) NOT NULL,
	"reason" smallint NOT NULL,
	"quantity_change" bigint NOT NULL,
	"notes" text,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_levels" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"product_id" varchar(25) NOT NULL,
	"location_id" varchar(25) NOT NULL,
	"quantity" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"product_id" varchar(25) NOT NULL,
	"location_id" varchar(25) NOT NULL,
	"movement_type" smallint NOT NULL,
	"quantity" bigint NOT NULL,
	"reference_id" varchar(25),
	"reference_type" varchar(50),
	"notes" text,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"product_id" varchar(25) NOT NULL,
	"from_location_id" varchar(25) NOT NULL,
	"to_location_id" varchar(25) NOT NULL,
	"quantity" bigint NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_by" varchar(25),
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_receipts" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"type" smallint NOT NULL,
	"reference_id" varchar(25) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"receipt_number" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"printed_at" timestamp,
	"printed_by" varchar(25),
	"print_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_templates" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"type" smallint NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"template" text NOT NULL,
	"print_settings" json,
	"default_settings" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_calculations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_branch_id" varchar(25) NOT NULL,
	"destination_branch_id" varchar(25) NOT NULL,
	"parcel_value_psw" bigint NOT NULL,
	"weight" smallint,
	"distance_km" smallint,
	"total_charge_psw" bigint NOT NULL,
	"base_charge_psw" bigint NOT NULL,
	"delivery_fee_psw" bigint NOT NULL,
	"service_charge_psw" bigint NOT NULL,
	"insurance_psw" bigint NOT NULL,
	"sender_amount_psw" bigint NOT NULL,
	"recipient_amount_psw" bigint NOT NULL,
	"vat_psw" bigint NOT NULL,
	"getfund_psw" bigint NOT NULL,
	"nhil_psw" bigint NOT NULL,
	"covid_psw" bigint NOT NULL,
	"tax_total_psw" bigint NOT NULL,
	"payment_rule_id" varchar(25),
	"calculation_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_rules" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_charge_psw" bigint DEFAULT 0 NOT NULL,
	"delivery_fee_basis" smallint DEFAULT 3 NOT NULL,
	"delivery_fee_psw" bigint DEFAULT 0 NOT NULL,
	"service_charge_psw" bigint DEFAULT 0 NOT NULL,
	"insurance_required" boolean DEFAULT false NOT NULL,
	"insurance_rate" smallint,
	"insurance_min_psw" bigint DEFAULT 0,
	"split_payment_type" smallint DEFAULT 0 NOT NULL,
	"split_percentage" smallint,
	"split_fixed_sender_psw" bigint DEFAULT 0,
	"split_fixed_recipient_psw" bigint DEFAULT 0,
	"source_branch_id" varchar(25),
	"destination_branch_id" varchar(25),
	"distance_km" smallint,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_weight" smallint,
	"max_weight" smallint,
	"min_amount_psw" bigint DEFAULT 0,
	"max_amount_psw" bigint,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashier_session_types" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"session_type" varchar(50) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashier_sessions_enhanced" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"cashier_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"shift_type_id" varchar(25),
	"scheduled_start_time" timestamp NOT NULL,
	"scheduled_end_time" timestamp NOT NULL,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"is_cross_day_shift" boolean DEFAULT false NOT NULL,
	"break_start_times" json,
	"break_end_times" json,
	"total_break_minutes" integer DEFAULT 0 NOT NULL,
	"opening_balance_psw" bigint DEFAULT 0 NOT NULL,
	"closing_balance_psw" bigint,
	"expected_closing_balance_psw" bigint,
	"variance_psw" bigint DEFAULT 0,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"cash_transactions" integer DEFAULT 0 NOT NULL,
	"mobile_money_transactions" integer DEFAULT 0 NOT NULL,
	"card_transactions" integer DEFAULT 0 NOT NULL,
	"average_transaction_value" smallint,
	"customer_count" integer DEFAULT 0 NOT NULL,
	"parcels_processed" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'SCHEDULED' NOT NULL,
	"status_reason" varchar(500),
	"handover_to_cashier_id" varchar(25),
	"handover_time" timestamp,
	"handover_notes" varchar(1000),
	"handover_confirmed_by" varchar(25),
	"handover_confirmed_at" timestamp,
	"compliance_notes" varchar(1000),
	"audit_score" smallint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_swaps" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"original_session_id" varchar(25) NOT NULL,
	"replacement_session_id" varchar(25) NOT NULL,
	"swap_time" timestamp NOT NULL,
	"swap_reason" varchar(500),
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"gap_start_time" timestamp,
	"gap_end_time" timestamp,
	"gap_duration_minutes" integer,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"notes" varchar(1000),
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"shift_type_id" varchar(25),
	"name" varchar(255) NOT NULL,
	"weekly_schedule" json,
	"start_date" varchar(20),
	"end_date" varchar(20),
	"rotation_pattern" varchar(50),
	"priority" smallint DEFAULT 5 NOT NULL,
	"max_consecutive_days" smallint DEFAULT 6 NOT NULL,
	"requires_weekend_coverage" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_types" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"standard_duration_hours" smallint DEFAULT 8 NOT NULL,
	"max_duration_hours" smallint DEFAULT 24 NOT NULL,
	"allow_cross_day" boolean DEFAULT true NOT NULL,
	"break_duration_minutes" smallint DEFAULT 30 NOT NULL,
	"breaks_per_shift" smallint DEFAULT 1 NOT NULL,
	"requires_cashier_count" boolean DEFAULT true NOT NULL,
	"handover_checklist" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"actor_user_id" varchar(25),
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(25),
	"action" varchar(120) NOT NULL,
	"message" varchar(1000),
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cards" ADD CONSTRAINT "customer_cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cards" ADD CONSTRAINT "customer_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sender_id_customers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_destination_id_branches_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_destination_id_branches_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_sender_id_customers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_receiver_id_customers_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_second_receiver_id_customers_id_fk" FOREIGN KEY ("second_receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_second_card_id_cards_id_fk" FOREIGN KEY ("second_card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_attendant_id_users_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_office_location_id_locations_id_fk" FOREIGN KEY ("office_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_front_desk_user_id_users_id_fk" FOREIGN KEY ("front_desk_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_delivery_user_id_users_id_fk" FOREIGN KEY ("delivery_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_rider_user_id_users_id_fk" FOREIGN KEY ("rider_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_receiver_called_confirmed_by_users_id_fk" FOREIGN KEY ("receiver_called_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_cashier_user_id_users_id_fk" FOREIGN KEY ("cashier_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_components" ADD CONSTRAINT "tax_components_profile_id_tax_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_location_id_inventory_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_location_id_inventory_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_receipts" ADD CONSTRAINT "generated_receipts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_receipts" ADD CONSTRAINT "generated_receipts_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_calculations" ADD CONSTRAINT "payment_calculations_payment_rule_id_payment_rules_id_fk" FOREIGN KEY ("payment_rule_id") REFERENCES "public"."payment_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_source_branch_id_branches_id_fk" FOREIGN KEY ("source_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_destination_branch_id_branches_id_fk" FOREIGN KEY ("destination_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashier_sessions_enhanced" ADD CONSTRAINT "cashier_sessions_enhanced_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashier_sessions_enhanced" ADD CONSTRAINT "cashier_sessions_enhanced_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashier_sessions_enhanced" ADD CONSTRAINT "cashier_sessions_enhanced_shift_type_id_shift_types_id_fk" FOREIGN KEY ("shift_type_id") REFERENCES "public"."shift_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashier_sessions_enhanced" ADD CONSTRAINT "cashier_sessions_enhanced_handover_to_cashier_id_users_id_fk" FOREIGN KEY ("handover_to_cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashier_sessions_enhanced" ADD CONSTRAINT "cashier_sessions_enhanced_handover_confirmed_by_users_id_fk" FOREIGN KEY ("handover_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swaps" ADD CONSTRAINT "shift_swaps_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swaps" ADD CONSTRAINT "shift_swaps_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swaps" ADD CONSTRAINT "shift_swaps_original_session_id_users_id_fk" FOREIGN KEY ("original_session_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swaps" ADD CONSTRAINT "shift_swaps_replacement_session_id_users_id_fk" FOREIGN KEY ("replacement_session_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swaps" ADD CONSTRAINT "shift_swaps_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_shift_type_id_shift_types_id_fk" FOREIGN KEY ("shift_type_id") REFERENCES "public"."shift_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_types" ADD CONSTRAINT "shift_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_company_idx" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_company_lower_name_uq" ON "branches" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "locations_company_idx" ON "locations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "locations_branch_idx" ON "locations" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_branch_lower_name_uq" ON "locations" USING btree ("branch_id",lower("name"));--> statement-breakpoint
CREATE INDEX "permissions_company_idx" ON "permissions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "roles_company_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_lower_name_uq" ON "roles" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "statuses_company_idx" ON "statuses" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "statuses_company_lower_name_uq" ON "statuses" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "customers_fullname_idx" ON "customers" USING btree ("fullname");--> statement-breakpoint
CREATE INDEX "customers_telephone_idx" ON "customers" USING btree ("telephone");--> statement-breakpoint
CREATE INDEX "bookings_sender_idx" ON "bookings" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "bookings_created_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_items_uq" ON "consignment_items" USING btree ("consignment_id","parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_items_parcel_active_uq" ON "consignment_items" USING btree ("parcel_id") WHERE "consignment_items"."removed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "consignments_daily_serial_uq" ON "consignments" USING btree ("company_id","source_id","consignment_date","serial_for_day");--> statement-breakpoint
CREATE INDEX "consignments_route_idx" ON "consignments" USING btree ("source_id","destination_id");--> statement-breakpoint
CREATE INDEX "parcels_booking_id_idx" ON "parcels" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "parcels_booking_code_idx" ON "parcels" USING btree ("booking_code");--> statement-breakpoint
CREATE UNIQUE INDEX "parcels_company_tracking_uq" ON "parcels" USING btree ("company_id","tracking_code");--> statement-breakpoint
CREATE INDEX "parcels_sender_idx" ON "parcels" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "parcels_receiver_idx" ON "parcels" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "parcels_status_idx" ON "parcels" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_company_idx" ON "pending_bookings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_branch_idx" ON "pending_bookings" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_attendant_idx" ON "pending_bookings" USING btree ("attendant_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_status_idx" ON "pending_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pending_bookings_expires_idx" ON "pending_bookings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pending_bookings_created_idx" ON "pending_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deliveries_parcel_idx" ON "deliveries" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "deliveries_mode_idx" ON "deliveries" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "deliveries_status_idx" ON "deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_parcel_idx" ON "payments" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "payments_cashier_idx" ON "payments" USING btree ("cashier_user_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" USING btree ("cashier_type");--> statement-breakpoint
CREATE INDEX "payments_received_at_idx" ON "payments" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "payments_branch_idx" ON "payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "payments_component_idx" ON "payments" USING btree ("component");--> statement-breakpoint
CREATE INDEX "tax_components_profile_idx" ON "tax_components" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "tax_profiles_company_idx" ON "tax_profiles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pr_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pr_expires_idx" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_token_hash_uq" ON "password_resets" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "rt_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rt_expires_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rt_token_hash_uq" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "inventory_locations_company_idx" ON "inventory_locations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inventory_locations_branch_idx" ON "inventory_locations" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_locations_branch_lower_name_uq" ON "inventory_locations" USING btree ("branch_id",lower("name"));--> statement-breakpoint
CREATE INDEX "product_categories_company_idx" ON "product_categories" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_company_lower_name_uq" ON "product_categories" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "products_company_idx" ON "products" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_company_sku_uq" ON "products" USING btree ("company_id",lower("sku"));--> statement-breakpoint
CREATE INDEX "stock_adjustments_company_idx" ON "stock_adjustments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stock_adjustments_product_idx" ON "stock_adjustments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_adjustments_location_idx" ON "stock_adjustments" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "stock_adjustments_created_idx" ON "stock_adjustments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_levels_company_idx" ON "stock_levels" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stock_levels_product_idx" ON "stock_levels" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_levels_location_idx" ON "stock_levels" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_levels_product_location_uq" ON "stock_levels" USING btree ("product_id","location_id");--> statement-breakpoint
CREATE INDEX "stock_movements_company_idx" ON "stock_movements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_location_idx" ON "stock_movements" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "stock_movements_created_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_reference_idx" ON "stock_movements" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_company_idx" ON "stock_transfers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_product_idx" ON "stock_transfers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_from_location_idx" ON "stock_transfers" USING btree ("from_location_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_to_location_idx" ON "stock_transfers" USING btree ("to_location_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_transfers_created_idx" ON "stock_transfers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "generated_receipts_company_idx" ON "generated_receipts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "generated_receipts_type_idx" ON "generated_receipts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "generated_receipts_reference_idx" ON "generated_receipts" USING btree ("reference_id","reference_type");--> statement-breakpoint
CREATE INDEX "generated_receipts_receipt_number_idx" ON "generated_receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "generated_receipts_receipt_number_uq" ON "generated_receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "receipt_templates_company_idx" ON "receipt_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "receipt_templates_type_idx" ON "receipt_templates" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_templates_company_type_uq" ON "receipt_templates" USING btree ("company_id","type");--> statement-breakpoint
CREATE INDEX "payment_calculations_company_idx" ON "payment_calculations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payment_calculations_route_idx" ON "payment_calculations" USING btree ("source_branch_id","destination_branch_id");--> statement-breakpoint
CREATE INDEX "payment_calculations_hash_idx" ON "payment_calculations" USING btree ("calculation_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_calculations_hash_uq" ON "payment_calculations" USING btree ("calculation_hash");--> statement-breakpoint
CREATE INDEX "payment_rules_company_idx" ON "payment_rules" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payment_rules_route_idx" ON "payment_rules" USING btree ("source_branch_id","destination_branch_id");--> statement-breakpoint
CREATE INDEX "payment_rules_active_idx" ON "payment_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payment_rules_weight_range_idx" ON "payment_rules" USING btree ("min_weight","max_weight");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_rules_company_route_uq" ON "payment_rules" USING btree ("company_id","source_branch_id","destination_branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cashier_session_types_session_type_uq" ON "cashier_session_types" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_cashier_idx" ON "cashier_sessions_enhanced" USING btree ("cashier_id");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_branch_idx" ON "cashier_sessions_enhanced" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_shift_type_idx" ON "cashier_sessions_enhanced" USING btree ("shift_type_id");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_status_idx" ON "cashier_sessions_enhanced" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_scheduled_start_idx" ON "cashier_sessions_enhanced" USING btree ("scheduled_start_time");--> statement-breakpoint
CREATE INDEX "cashier_sessions_enhanced_cross_day_idx" ON "cashier_sessions_enhanced" USING btree ("is_cross_day_shift");--> statement-breakpoint
CREATE INDEX "shift_swaps_company_idx" ON "shift_swaps" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shift_swaps_branch_idx" ON "shift_swaps" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "shift_swaps_original_session_idx" ON "shift_swaps" USING btree ("original_session_id");--> statement-breakpoint
CREATE INDEX "shift_swaps_status_idx" ON "shift_swaps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shift_swaps_swap_time_idx" ON "shift_swaps" USING btree ("swap_time");--> statement-breakpoint
CREATE INDEX "shift_templates_company_idx" ON "shift_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "shift_templates_branch_idx" ON "shift_templates" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "shift_templates_shift_type_idx" ON "shift_templates" USING btree ("shift_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_templates_company_branch_name_uq" ON "shift_templates" USING btree ("company_id","branch_id","name");--> statement-breakpoint
CREATE INDEX "shift_types_company_idx" ON "shift_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_types_company_name_uq" ON "shift_types" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "audit_logs_company_idx" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");