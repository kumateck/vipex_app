CREATE TABLE "branches" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" smallint DEFAULT 1 NOT NULL,
	"telephone" varchar(255),
	"address" varchar(255),
	"email" varchar(255),
	"use_pickup_queue" boolean DEFAULT false NOT NULL,
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
	"use_accounting" boolean DEFAULT false NOT NULL,
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
CREATE TABLE "role_permissions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"role_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"permission" varchar(255) NOT NULL,
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
CREATE TABLE "uploads" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"model_type" varchar(80) NOT NULL,
	"model_id" varchar(80) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"object_key" varchar(500) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"size_bytes" double precision NOT NULL,
	"uploaded_by" varchar(25),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"telephone" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"employee_id" varchar(25),
	"password" varchar(255),
	"status" smallint DEFAULT 1 NOT NULL,
	"role_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"location_id" varchar(25),
	"user_type" smallint DEFAULT 0 NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"tax_report_confirmation" boolean DEFAULT false NOT NULL,
	"reset_token" varchar(255),
	"reset_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"front_image_url" text,
	"back_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_credit_allocations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"customer_id" varchar(25) NOT NULL,
	"charge_transaction_id" varchar(25) NOT NULL,
	"payment_transaction_id" varchar(25) NOT NULL,
	"amount_psw" bigint NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_credit_transactions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"customer_id" varchar(25) NOT NULL,
	"source_type" smallint DEFAULT 2 NOT NULL,
	"transaction_type" smallint DEFAULT 0 NOT NULL,
	"reference_id" varchar(255),
	"signed_amount_psw" bigint NOT NULL,
	"notes" varchar(1000),
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"customer_type" smallint DEFAULT 0 NOT NULL,
	"credit_eligible" boolean DEFAULT false NOT NULL,
	"credit_limit_psw" bigint DEFAULT 0 NOT NULL,
	"payment_terms_days" integer DEFAULT 0 NOT NULL,
	"is_nia_verified" boolean DEFAULT false NOT NULL,
	"logged_to_government" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_id" varchar(25) NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "parcel_internal_transfer_items" (
	"transfer_id" varchar(25) NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"status" smallint DEFAULT 0 NOT NULL,
	"parcel_details" varchar(255) NOT NULL,
	"parcel_content" varchar(255) NOT NULL,
	"parcel_value_psw" bigint DEFAULT 0 NOT NULL,
	"charge_psw" bigint DEFAULT 0 NOT NULL,
	"card_id" varchar(25),
	"card_number" varchar(255),
	"second_card_id" varchar(25),
	"second_card_number" varchar(255),
	"pickup_location_id" varchar(25),
	"planned_tobepaid_psw" bigint DEFAULT 0 NOT NULL,
	"method" smallint DEFAULT 0 NOT NULL,
	"tax_report_confirmation" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_by" varchar(25),
	"deleted_at" timestamp,
	"delete_reason" varchar(1000),
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
	"signature_image" text,
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
	"void_reason" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_approval_policies" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"policy_code" varchar(60) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_limit_psw" bigint DEFAULT 0 NOT NULL,
	"auto_authorize_below_threshold" boolean DEFAULT true NOT NULL,
	"requires_head_office_approval" boolean DEFAULT false NOT NULL,
	"applies_to_funding_source" smallint,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_to_bank_transfers" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"location_id" varchar(25),
	"company_bank_account_id" varchar(25) NOT NULL,
	"amount_psw" bigint NOT NULL,
	"reference_no" varchar(100),
	"recorded_by_user_id" varchar(25),
	"approved_by_user_id" varchar(25),
	"journal_entry_id" varchar(25),
	"transferred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"label" varchar(255),
	"account_class" smallint DEFAULT 0 NOT NULL,
	"parent_account_id" varchar(25),
	"is_postable" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_bank_accounts" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"account_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"bank_name" varchar(255),
	"branch_name" varchar(255),
	"account_number_masked" varchar(100),
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_cash_confirmations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"location_id" varchar(25),
	"cashier_user_id" varchar(25),
	"accountant_user_id" varchar(25),
	"confirmation_date" timestamp NOT NULL,
	"expected_cash_psw" bigint DEFAULT 0 NOT NULL,
	"counted_cash_psw" bigint DEFAULT 0 NOT NULL,
	"shortage_psw" bigint DEFAULT 0 NOT NULL,
	"overage_psw" bigint DEFAULT 0 NOT NULL,
	"notes" varchar(1000),
	"status" smallint DEFAULT 0 NOT NULL,
	"journal_entry_id" varchar(25),
	"confirmed_at" timestamp,
	"posted_at" timestamp,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_id" varchar(25) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_requests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"location_id" varchar(25),
	"expense_category_id" varchar(25) NOT NULL,
	"amount_psw" bigint NOT NULL,
	"funding_source" smallint DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"purpose" varchar(1000) NOT NULL,
	"reference_no" varchar(100),
	"requested_by_user_id" varchar(25) NOT NULL,
	"recorded_by_user_id" varchar(25) NOT NULL,
	"approved_by_user_id" varchar(25),
	"paid_by_user_id" varchar(25),
	"company_bank_account_id" varchar(25),
	"journal_entry_id" varchar(25),
	"approval_reason" varchar(1000),
	"rejection_reason" varchar(1000),
	"paid_at" timestamp,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_batches" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_type" smallint DEFAULT 0 NOT NULL,
	"source_id" varchar(60),
	"batch_date" timestamp DEFAULT now() NOT NULL,
	"description" varchar(500),
	"posted_by" varchar(25),
	"posted_at" timestamp,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"batch_id" varchar(25) NOT NULL,
	"source_type" smallint DEFAULT 0 NOT NULL,
	"source_id" varchar(60),
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"memo" varchar(500),
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"recorded_by_user_id" varchar(25),
	"approved_by_user_id" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"entry_id" varchar(25) NOT NULL,
	"account_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"recorded_by_user_id" varchar(25),
	"debit_psw" bigint DEFAULT 0 NOT NULL,
	"credit_psw" bigint DEFAULT 0 NOT NULL,
	"description" varchar(500),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_journal_entries" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"policy_code" varchar(60),
	"threshold_psw" bigint DEFAULT 0 NOT NULL,
	"total_debit_psw" bigint DEFAULT 0 NOT NULL,
	"total_credit_psw" bigint DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"memo" varchar(500),
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"recorded_by_user_id" varchar(25),
	"approved_by_user_id" varchar(25),
	"approval_reason" varchar(1000),
	"rejection_reason" varchar(1000),
	"posted_batch_id" varchar(25),
	"posted_entry_id" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_journal_entry_lines" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"manual_entry_id" varchar(25) NOT NULL,
	"account_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"debit_psw" bigint DEFAULT 0 NOT NULL,
	"credit_psw" bigint DEFAULT 0 NOT NULL,
	"description" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_service_charges" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"payment_id" varchar(25) NOT NULL,
	"parcel_id" varchar(25) NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"service_charge_id" varchar(25) NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"settled_psw" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petty_cash_funds" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"account_id" varchar(25) NOT NULL,
	"target_float_psw" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petty_cash_replenishments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"petty_cash_fund_id" varchar(25) NOT NULL,
	"company_bank_account_id" varchar(25) NOT NULL,
	"amount_psw" bigint NOT NULL,
	"approved_by_user_id" varchar(25),
	"recorded_by_user_id" varchar(25),
	"journal_entry_id" varchar(25),
	"reference_no" varchar(100),
	"notes" varchar(1000),
	"replenished_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_charges" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"payable_account_id" varchar(25),
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "tax_filing_audit_logs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"tax_journal_item_id" varchar(25) NOT NULL,
	"action" varchar(80) NOT NULL,
	"old_status" smallint,
	"new_status" smallint,
	"reason" text,
	"acted_by_user_id" varchar(25),
	"acted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_filing_periods" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_from" timestamp NOT NULL,
	"date_to" timestamp NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"notes" varchar(1000),
	"created_by_user_id" varchar(25),
	"submitted_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_filing_runs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"filing_period_id" varchar(25) NOT NULL,
	"generated_by_user_id" varchar(25),
	"report_snapshot_json" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_journal_items" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"location_id" varchar(25),
	"source_type" smallint DEFAULT 5 NOT NULL,
	"source_id" varchar(60),
	"journal_entry_id" varchar(25),
	"tax_profile_id" varchar(25),
	"posting_date" timestamp DEFAULT now() NOT NULL,
	"tax_base_psw" bigint DEFAULT 0 NOT NULL,
	"tax_total_psw" bigint DEFAULT 0 NOT NULL,
	"vat_psw" bigint DEFAULT 0 NOT NULL,
	"getfund_psw" bigint DEFAULT 0 NOT NULL,
	"nhil_psw" bigint DEFAULT 0 NOT NULL,
	"covid_psw" bigint DEFAULT 0 NOT NULL,
	"filing_status" smallint DEFAULT 0 NOT NULL,
	"filing_period_id" varchar(25),
	"excluded_reason" text,
	"recorded_by_user_id" varchar(25),
	"reviewed_by_user_id" varchar(25),
	"filed_by_user_id" varchar(25),
	"reviewed_at" timestamp,
	"filed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "company_modules" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"module_code" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"enabled_at" timestamp,
	"disabled_at" timestamp,
	"configured_by" varchar(25),
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_catalog" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_core" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
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
CREATE TABLE "attendance_records" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"attendance_date" timestamp NOT NULL,
	"check_in_at" timestamp,
	"check_out_at" timestamp,
	"minutes_worked" integer,
	"status" smallint DEFAULT 0 NOT NULL,
	"source" varchar(50),
	"notes" text,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(50),
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"issued_at" timestamp,
	"expires_at" timestamp,
	"notes" text,
	"uploaded_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_job_assignments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"department_id" varchar(25),
	"job_title_id" varchar(25),
	"manager_employee_id" varchar(25),
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"reason" varchar(255),
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_number" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"profile_image_url" text,
	"telephone" varchar(30) NOT NULL,
	"alternate_phone" varchar(30),
	"date_of_birth" timestamp,
	"gender" smallint DEFAULT 3,
	"marital_status" varchar(50),
	"national_id_type" smallint,
	"national_id_number" varchar(100),
	"tax_id" varchar(100),
	"ssnit_number" varchar(100),
	"address" varchar(255),
	"city" varchar(100),
	"country" varchar(100),
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(30),
	"payment_method" varchar(30),
	"bank_name" varchar(255),
	"bank_account_name" varchar(255),
	"bank_account_number" varchar(100),
	"mobile_money_number" varchar(30),
	"employment_status" smallint DEFAULT 0 NOT NULL,
	"employment_type" smallint DEFAULT 0 NOT NULL,
	"hire_date" timestamp NOT NULL,
	"confirmation_date" timestamp,
	"termination_date" timestamp,
	"termination_reason" text,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"department_id" varchar(25),
	"job_title_id" varchar(25),
	"reporting_officer_title_id" varchar(25),
	"officer_employee_id" varchar(25),
	"manager_employee_id" varchar(25),
	"has_user_account" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_titles" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"department_id" varchar(25),
	"code" varchar(50),
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"leave_type_id" varchar(25) NOT NULL,
	"date_from" timestamp NOT NULL,
	"date_to" timestamp NOT NULL,
	"days_count" integer DEFAULT 1 NOT NULL,
	"reason" text,
	"manager_approval_status" smallint DEFAULT 0 NOT NULL,
	"manager_approved_by" varchar(25),
	"manager_approved_at" timestamp,
	"manager_rejection_reason" text,
	"status" smallint DEFAULT 0 NOT NULL,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(50),
	"name" varchar(255) NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "deduction_types" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_statutory" boolean DEFAULT false NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "earning_types" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_compensation" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"payroll_group_id" varchar(25) NOT NULL,
	"pay_type" smallint DEFAULT 0 NOT NULL,
	"currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
	"base_pay_psw" bigint DEFAULT 0 NOT NULL,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"tax_profile_id" varchar(25),
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_compensation_items" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"employee_compensation_id" varchar(25) NOT NULL,
	"item_type" smallint DEFAULT 0 NOT NULL,
	"earning_type_id" varchar(25),
	"deduction_type_id" varchar(25),
	"calculation_type" smallint DEFAULT 0 NOT NULL,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"percentage_basis" varchar(50),
	"is_recurring" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_groups" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"pay_frequency" smallint DEFAULT 0 NOT NULL,
	"currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_manual_adjustments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_period_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"item_type" smallint DEFAULT 0 NOT NULL,
	"earning_type_id" varchar(25),
	"deduction_type_id" varchar(25),
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"is_taxable" boolean DEFAULT false NOT NULL,
	"approval_status" smallint DEFAULT 0 NOT NULL,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_overtime_entries" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_period_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"overtime_minutes" bigint DEFAULT 0 NOT NULL,
	"rate_per_hour_psw" bigint DEFAULT 0 NOT NULL,
	"multiplier_pct" bigint DEFAULT 100 NOT NULL,
	"approval_status" smallint DEFAULT 0 NOT NULL,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_group_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"payment_date" timestamp,
	"status" smallint DEFAULT 0 NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_run_employees" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_run_id" varchar(25) NOT NULL,
	"employee_id" varchar(25) NOT NULL,
	"employee_number_snapshot" varchar(50) NOT NULL,
	"employee_name_snapshot" varchar(255) NOT NULL,
	"branch_id_snapshot" varchar(25),
	"department_name_snapshot" varchar(255),
	"job_title_name_snapshot" varchar(255),
	"base_pay_psw" bigint DEFAULT 0 NOT NULL,
	"gross_pay_psw" bigint DEFAULT 0 NOT NULL,
	"total_deductions_psw" bigint DEFAULT 0 NOT NULL,
	"net_pay_psw" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(10) DEFAULT 'GHS' NOT NULL,
	"status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_run_items" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_run_employee_id" varchar(25) NOT NULL,
	"item_type" smallint NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"is_taxable" boolean DEFAULT false NOT NULL,
	"source" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_period_id" varchar(25) NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"started_by" varchar(25),
	"started_at" timestamp,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"journal_batch_id" varchar(25),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"payroll_run_employee_id" varchar(25) NOT NULL,
	"payslip_number" varchar(50) NOT NULL,
	"issued_at" timestamp,
	"delivery_status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
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
CREATE TABLE "parcel_content_catalog" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price_psw" integer DEFAULT 0 NOT NULL,
	"tax_inclusive" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcel_detail_catalog" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(25),
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
CREATE TABLE "consignment_configs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"auto_grouping_mode" smallint DEFAULT 0 NOT NULL,
	"min_parcel_count" integer DEFAULT 5 NOT NULL,
	"max_parcel_count" integer DEFAULT 50 NOT NULL,
	"max_weight_kg" smallint DEFAULT 100 NOT NULL,
	"grouping_schedule" json,
	"max_wait_minutes" integer DEFAULT 120 NOT NULL,
	"source_branch_id" varchar(25),
	"destination_branch_id" varchar(25),
	"preferred_shipping_time" varchar(10),
	"max_transit_time_hours" integer DEFAULT 48 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consignment_manifests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"consignment_id" varchar(25) NOT NULL,
	"manifest_number" varchar(255) NOT NULL,
	"total_parcels" integer NOT NULL,
	"total_weight" smallint,
	"total_value_psw" bigint NOT NULL,
	"carrier_name" varchar(255),
	"vehicle_number" varchar(50),
	"driver_name" varchar(255),
	"driver_contact" varchar(50),
	"route_description" varchar(500),
	"estimated_departure_time" timestamp,
	"estimated_arrival_time" timestamp,
	"actual_departure_time" timestamp,
	"actual_arrival_time" timestamp,
	"status" smallint DEFAULT 0 NOT NULL,
	"quality_checked_by" varchar(25),
	"quality_checked_at" timestamp,
	"quality_notes" varchar(1000),
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consignment_suggestions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"source_branch_id" varchar(25) NOT NULL,
	"destination_branch_id" varchar(25) NOT NULL,
	"parcel_ids" json NOT NULL,
	"suggested_groupings" json NOT NULL,
	"total_value_psw" bigint NOT NULL,
	"total_weight" smallint,
	"parcel_count" integer NOT NULL,
	"efficiency_score" smallint,
	"status" varchar(20) DEFAULT 'PENDING',
	"reviewed_by" varchar(25),
	"reviewed_at" timestamp,
	"notes" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "consignment_tracking_events" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"consignment_id" varchar(25) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_location" varchar(255),
	"event_description" varchar(1000),
	"latitude" varchar(20),
	"longitude" varchar(20),
	"photo_url" varchar(500),
	"document_url" varchar(500),
	"event_time" timestamp NOT NULL,
	"recorded_by" varchar(25),
	"metadata" json
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cards" ADD CONSTRAINT "customer_cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cards" ADD CONSTRAINT "customer_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_allocations" ADD CONSTRAINT "customer_credit_allocations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_allocations" ADD CONSTRAINT "customer_credit_allocations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_allocations" ADD CONSTRAINT "customer_credit_allocations_charge_transaction_id_customer_credit_transactions_id_fk" FOREIGN KEY ("charge_transaction_id") REFERENCES "public"."customer_credit_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_allocations" ADD CONSTRAINT "customer_credit_allocations_payment_transaction_id_customer_credit_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."customer_credit_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_items" ADD CONSTRAINT "consignment_items_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_destination_id_branches_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignments" ADD CONSTRAINT "consignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_holders" ADD CONSTRAINT "parcel_internal_holders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfer_items" ADD CONSTRAINT "parcel_internal_transfer_items_transfer_id_parcel_internal_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."parcel_internal_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfer_items" ADD CONSTRAINT "parcel_internal_transfer_items_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_source_location_id_locations_id_fk" FOREIGN KEY ("source_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_destination_location_id_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_transferred_by_users_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_internal_transfers" ADD CONSTRAINT "parcel_internal_transfers_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_source_id_branches_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_destination_id_branches_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_sender_id_customers_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_receiver_id_customers_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_second_receiver_id_customers_id_fk" FOREIGN KEY ("second_receiver_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_second_card_id_cards_id_fk" FOREIGN KEY ("second_card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_attendant_id_users_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bookings" ADD CONSTRAINT "pending_bookings_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_picker_staff_id_users_id_fk" FOREIGN KEY ("picker_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_id_card_type_id_cards_id_fk" FOREIGN KEY ("id_card_type_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_queued_by_users_id_fk" FOREIGN KEY ("queued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_queues" ADD CONSTRAINT "pickup_queues_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "payments" ADD CONSTRAINT "payments_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_approval_policies" ADD CONSTRAINT "accounting_approval_policies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_approval_policies" ADD CONSTRAINT "accounting_approval_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_company_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("company_bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_to_bank_transfers" ADD CONSTRAINT "cash_to_bank_transfers_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_bank_accounts" ADD CONSTRAINT "company_bank_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_bank_accounts" ADD CONSTRAINT "company_bank_accounts_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_bank_accounts" ADD CONSTRAINT "company_bank_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_cashier_user_id_users_id_fk" FOREIGN KEY ("cashier_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_accountant_user_id_users_id_fk" FOREIGN KEY ("accountant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cash_confirmations" ADD CONSTRAINT "daily_cash_confirmations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_expense_category_id_expense_categories_id_fk" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_company_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("company_bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_batches" ADD CONSTRAINT "journal_batches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_batches" ADD CONSTRAINT "journal_batches_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_batches" ADD CONSTRAINT "journal_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_batch_id_journal_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."journal_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_posted_batch_id_journal_batches_id_fk" FOREIGN KEY ("posted_batch_id") REFERENCES "public"."journal_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entries" ADD CONSTRAINT "manual_journal_entries_posted_entry_id_journal_entries_id_fk" FOREIGN KEY ("posted_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entry_lines" ADD CONSTRAINT "manual_journal_entry_lines_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entry_lines" ADD CONSTRAINT "manual_journal_entry_lines_manual_entry_id_manual_journal_entries_id_fk" FOREIGN KEY ("manual_entry_id") REFERENCES "public"."manual_journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entry_lines" ADD CONSTRAINT "manual_journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entry_lines" ADD CONSTRAINT "manual_journal_entry_lines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_journal_entry_lines" ADD CONSTRAINT "manual_journal_entry_lines_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_service_charges" ADD CONSTRAINT "payment_service_charges_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_service_charges" ADD CONSTRAINT "payment_service_charges_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_service_charges" ADD CONSTRAINT "payment_service_charges_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_service_charges" ADD CONSTRAINT "payment_service_charges_service_charge_id_service_charges_id_fk" FOREIGN KEY ("service_charge_id") REFERENCES "public"."service_charges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_petty_cash_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("petty_cash_fund_id") REFERENCES "public"."petty_cash_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_company_bank_account_id_company_bank_accounts_id_fk" FOREIGN KEY ("company_bank_account_id") REFERENCES "public"."company_bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_replenishments" ADD CONSTRAINT "petty_cash_replenishments_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_payable_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("payable_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_charges" ADD CONSTRAINT "service_charges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_components" ADD CONSTRAINT "tax_components_profile_id_tax_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_audit_logs" ADD CONSTRAINT "tax_filing_audit_logs_tax_journal_item_id_tax_journal_items_id_fk" FOREIGN KEY ("tax_journal_item_id") REFERENCES "public"."tax_journal_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_audit_logs" ADD CONSTRAINT "tax_filing_audit_logs_acted_by_user_id_users_id_fk" FOREIGN KEY ("acted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_periods" ADD CONSTRAINT "tax_filing_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_periods" ADD CONSTRAINT "tax_filing_periods_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_runs" ADD CONSTRAINT "tax_filing_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_runs" ADD CONSTRAINT "tax_filing_runs_filing_period_id_tax_filing_periods_id_fk" FOREIGN KEY ("filing_period_id") REFERENCES "public"."tax_filing_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filing_runs" ADD CONSTRAINT "tax_filing_runs_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_filing_period_id_tax_filing_periods_id_fk" FOREIGN KEY ("filing_period_id") REFERENCES "public"."tax_filing_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_journal_items" ADD CONSTRAINT "tax_journal_items_filed_by_user_id_users_id_fk" FOREIGN KEY ("filed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_configured_by_users_id_fk" FOREIGN KEY ("configured_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_job_assignments" ADD CONSTRAINT "employee_job_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_reporting_officer_title_id_job_titles_id_fk" FOREIGN KEY ("reporting_officer_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_titles" ADD CONSTRAINT "job_titles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_titles" ADD CONSTRAINT "job_titles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_titles" ADD CONSTRAINT "job_titles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_manager_approved_by_users_id_fk" FOREIGN KEY ("manager_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "deduction_types" ADD CONSTRAINT "deduction_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earning_types" ADD CONSTRAINT "earning_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_payroll_group_id_payroll_groups_id_fk" FOREIGN KEY ("payroll_group_id") REFERENCES "public"."payroll_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_tax_profile_id_tax_profiles_id_fk" FOREIGN KEY ("tax_profile_id") REFERENCES "public"."tax_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation_items" ADD CONSTRAINT "employee_compensation_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation_items" ADD CONSTRAINT "employee_compensation_items_employee_compensation_id_employee_compensation_id_fk" FOREIGN KEY ("employee_compensation_id") REFERENCES "public"."employee_compensation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation_items" ADD CONSTRAINT "employee_compensation_items_earning_type_id_earning_types_id_fk" FOREIGN KEY ("earning_type_id") REFERENCES "public"."earning_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation_items" ADD CONSTRAINT "employee_compensation_items_deduction_type_id_deduction_types_id_fk" FOREIGN KEY ("deduction_type_id") REFERENCES "public"."deduction_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_groups" ADD CONSTRAINT "payroll_groups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_groups" ADD CONSTRAINT "payroll_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_earning_type_id_earning_types_id_fk" FOREIGN KEY ("earning_type_id") REFERENCES "public"."earning_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_deduction_type_id_deduction_types_id_fk" FOREIGN KEY ("deduction_type_id") REFERENCES "public"."deduction_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_manual_adjustments" ADD CONSTRAINT "payroll_manual_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_overtime_entries" ADD CONSTRAINT "payroll_overtime_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_overtime_entries" ADD CONSTRAINT "payroll_overtime_entries_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_overtime_entries" ADD CONSTRAINT "payroll_overtime_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_overtime_entries" ADD CONSTRAINT "payroll_overtime_entries_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_overtime_entries" ADD CONSTRAINT "payroll_overtime_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_payroll_group_id_payroll_groups_id_fk" FOREIGN KEY ("payroll_group_id") REFERENCES "public"."payroll_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_payroll_run_employee_id_payroll_run_employees_id_fk" FOREIGN KEY ("payroll_run_employee_id") REFERENCES "public"."payroll_run_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_journal_batch_id_journal_batches_id_fk" FOREIGN KEY ("journal_batch_id") REFERENCES "public"."journal_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_employee_id_payroll_run_employees_id_fk" FOREIGN KEY ("payroll_run_employee_id") REFERENCES "public"."payroll_run_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_receipts" ADD CONSTRAINT "generated_receipts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_receipts" ADD CONSTRAINT "generated_receipts_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_calculations" ADD CONSTRAINT "payment_calculations_payment_rule_id_payment_rules_id_fk" FOREIGN KEY ("payment_rule_id") REFERENCES "public"."payment_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_source_branch_id_branches_id_fk" FOREIGN KEY ("source_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_rules" ADD CONSTRAINT "payment_rules_destination_branch_id_branches_id_fk" FOREIGN KEY ("destination_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_content_catalog" ADD CONSTRAINT "parcel_content_catalog_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_content_catalog" ADD CONSTRAINT "parcel_content_catalog_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_detail_catalog" ADD CONSTRAINT "parcel_detail_catalog_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_detail_catalog" ADD CONSTRAINT "parcel_detail_catalog_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "consignment_configs" ADD CONSTRAINT "consignment_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_configs" ADD CONSTRAINT "consignment_configs_source_branch_id_branches_id_fk" FOREIGN KEY ("source_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_configs" ADD CONSTRAINT "consignment_configs_destination_branch_id_branches_id_fk" FOREIGN KEY ("destination_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_manifests" ADD CONSTRAINT "consignment_manifests_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_manifests" ADD CONSTRAINT "consignment_manifests_quality_checked_by_users_id_fk" FOREIGN KEY ("quality_checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_suggestions" ADD CONSTRAINT "consignment_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_tracking_events" ADD CONSTRAINT "consignment_tracking_events_consignment_id_consignments_id_fk" FOREIGN KEY ("consignment_id") REFERENCES "public"."consignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consignment_tracking_events" ADD CONSTRAINT "consignment_tracking_events_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_company_idx" ON "branches" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_company_lower_name_uq" ON "branches" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "locations_company_idx" ON "locations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "locations_branch_idx" ON "locations" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_branch_lower_name_uq" ON "locations" USING btree ("branch_id",lower("name"));--> statement-breakpoint
CREATE INDEX "roles_company_idx" ON "roles" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_company_lower_name_uq" ON "roles" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "uploads_company_model_idx" ON "uploads" USING btree ("company_id","model_type","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uploads_object_key_uq" ON "uploads" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "users_company_employee_idx" ON "users" USING btree ("company_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_company_lower_email_uq" ON "users" USING btree ("company_id",lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_employee_id_uq" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "warehouses_company_idx" ON "warehouses" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "warehouses_branch_idx" ON "warehouses" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_branch_lower_name_uq" ON "warehouses" USING btree ("branch_id",lower("name"));--> statement-breakpoint
CREATE INDEX "customer_credit_allocations_customer_idx" ON "customer_credit_allocations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_credit_allocations_company_idx" ON "customer_credit_allocations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "customer_credit_allocations_charge_idx" ON "customer_credit_allocations" USING btree ("charge_transaction_id");--> statement-breakpoint
CREATE INDEX "customer_credit_allocations_payment_idx" ON "customer_credit_allocations" USING btree ("payment_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_credit_allocations_charge_payment_uq" ON "customer_credit_allocations" USING btree ("charge_transaction_id","payment_transaction_id");--> statement-breakpoint
CREATE INDEX "customer_credit_transactions_customer_idx" ON "customer_credit_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_credit_transactions_company_idx" ON "customer_credit_transactions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "customer_credit_transactions_created_idx" ON "customer_credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customers_fullname_idx" ON "customers" USING btree ("fullname");--> statement-breakpoint
CREATE INDEX "customers_telephone_idx" ON "customers" USING btree ("telephone");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_company_telephone_active_uq" ON "customers" USING btree ("company_id","telephone") WHERE "customers"."is_deleted" = false AND "customers"."telephone" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_company_telephone2_active_uq" ON "customers" USING btree ("company_id","telephone2") WHERE "customers"."is_deleted" = false AND "customers"."telephone2" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "bookings_created_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_items_uq" ON "consignment_items" USING btree ("consignment_id","parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_items_parcel_active_uq" ON "consignment_items" USING btree ("parcel_id") WHERE "consignment_items"."removed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "consignments_daily_serial_uq" ON "consignments" USING btree ("company_id","source_id","consignment_date","serial_for_day");--> statement-breakpoint
CREATE INDEX "consignments_route_idx" ON "consignments" USING btree ("source_id","destination_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_holders_branch_idx" ON "parcel_internal_holders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_holders_location_idx" ON "parcel_internal_holders" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_holders_warehouse_idx" ON "parcel_internal_holders" USING btree ("warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_internal_transfer_items_uq" ON "parcel_internal_transfer_items" USING btree ("transfer_id","parcel_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_transfer_items_parcel_idx" ON "parcel_internal_transfer_items" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_transfers_branch_status_idx" ON "parcel_internal_transfers" USING btree ("branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_internal_transfers_reference_uq" ON "parcel_internal_transfers" USING btree ("reference_no");--> statement-breakpoint
CREATE INDEX "parcel_internal_transfers_dest_location_idx" ON "parcel_internal_transfers" USING btree ("destination_location_id");--> statement-breakpoint
CREATE INDEX "parcel_internal_transfers_dest_warehouse_idx" ON "parcel_internal_transfers" USING btree ("destination_warehouse_id");--> statement-breakpoint
CREATE INDEX "parcels_booking_id_idx" ON "parcels" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "parcels_booking_code_idx" ON "parcels" USING btree ("booking_code");--> statement-breakpoint
CREATE UNIQUE INDEX "parcels_company_tracking_uq" ON "parcels" USING btree ("company_id","tracking_code");--> statement-breakpoint
CREATE INDEX "parcels_sender_idx" ON "parcels" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "parcels_receiver_idx" ON "parcels" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "parcels_status_idx" ON "parcels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pending_bookings_company_idx" ON "pending_bookings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_branch_idx" ON "pending_bookings" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_attendant_idx" ON "pending_bookings" USING btree ("attendant_id");--> statement-breakpoint
CREATE INDEX "pending_bookings_status_idx" ON "pending_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pending_bookings_expires_idx" ON "pending_bookings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pending_bookings_created_idx" ON "pending_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pickup_queues_parcel_uq" ON "pickup_queues" USING btree ("parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pickup_queues_daily_code_uq" ON "pickup_queues" USING btree ("branch_id","queue_date","payment_bucket","queue_number");--> statement-breakpoint
CREATE INDEX "pickup_queues_branch_queued_at_idx" ON "pickup_queues" USING btree ("branch_id","queued_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pickup_queues_code_uq" ON "pickup_queues" USING btree ("queue_code");--> statement-breakpoint
CREATE INDEX "deliveries_parcel_idx" ON "deliveries" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "deliveries_mode_idx" ON "deliveries" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "deliveries_status_idx" ON "deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_parcel_idx" ON "payments" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "payments_cashier_idx" ON "payments" USING btree ("cashier_user_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" USING btree ("cashier_type");--> statement-breakpoint
CREATE INDEX "payments_received_at_idx" ON "payments" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "payments_branch_idx" ON "payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "payments_component_idx" ON "payments" USING btree ("component");--> statement-breakpoint
CREATE INDEX "accounting_approval_policies_company_idx" ON "accounting_approval_policies" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_approval_policies_company_code_uq" ON "accounting_approval_policies" USING btree ("company_id","policy_code");--> statement-breakpoint
CREATE INDEX "cash_to_bank_transfers_company_idx" ON "cash_to_bank_transfers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cash_to_bank_transfers_branch_idx" ON "cash_to_bank_transfers" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "chart_of_accounts_company_idx" ON "chart_of_accounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "chart_of_accounts_class_idx" ON "chart_of_accounts" USING btree ("company_id","account_class");--> statement-breakpoint
CREATE UNIQUE INDEX "chart_of_accounts_company_code_uq" ON "chart_of_accounts" USING btree ("company_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "chart_of_accounts_company_lower_name_uq" ON "chart_of_accounts" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "company_bank_accounts_company_idx" ON "company_bank_accounts" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "company_bank_accounts_company_lower_name_uq" ON "company_bank_accounts" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "daily_cash_confirmations_company_idx" ON "daily_cash_confirmations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "daily_cash_confirmations_branch_date_idx" ON "daily_cash_confirmations" USING btree ("branch_id","confirmation_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_cash_confirmations_scope_uq" ON "daily_cash_confirmations" USING btree ("company_id","branch_id","location_id","cashier_user_id","confirmation_date");--> statement-breakpoint
CREATE INDEX "expense_categories_company_idx" ON "expense_categories" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_company_code_uq" ON "expense_categories" USING btree ("company_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_company_lower_name_uq" ON "expense_categories" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "expense_requests_company_idx" ON "expense_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "expense_requests_branch_status_idx" ON "expense_requests" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "expense_requests_category_idx" ON "expense_requests" USING btree ("expense_category_id");--> statement-breakpoint
CREATE INDEX "journal_batches_company_idx" ON "journal_batches" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "journal_batches_source_idx" ON "journal_batches" USING btree ("company_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "journal_entries_company_idx" ON "journal_entries" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "journal_entries_batch_idx" ON "journal_entries" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "journal_entries_branch_date_idx" ON "journal_entries" USING btree ("branch_id","entry_date");--> statement-breakpoint
CREATE INDEX "journal_lines_company_idx" ON "journal_lines" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "journal_lines_entry_idx" ON "journal_lines" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "journal_lines_account_idx" ON "journal_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "journal_lines_branch_account_idx" ON "journal_lines" USING btree ("branch_id","account_id");--> statement-breakpoint
CREATE INDEX "manual_journal_entries_company_idx" ON "manual_journal_entries" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "manual_journal_entries_company_status_idx" ON "manual_journal_entries" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "manual_journal_entries_branch_date_idx" ON "manual_journal_entries" USING btree ("branch_id","entry_date");--> statement-breakpoint
CREATE INDEX "manual_journal_entry_lines_company_idx" ON "manual_journal_entry_lines" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "manual_journal_entry_lines_entry_idx" ON "manual_journal_entry_lines" USING btree ("manual_entry_id");--> statement-breakpoint
CREATE INDEX "manual_journal_entry_lines_account_idx" ON "manual_journal_entry_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "payment_service_charges_company_idx" ON "payment_service_charges" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payment_service_charges_payment_idx" ON "payment_service_charges" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_service_charges_parcel_idx" ON "payment_service_charges" USING btree ("parcel_id");--> statement-breakpoint
CREATE INDEX "payment_service_charges_charge_idx" ON "payment_service_charges" USING btree ("service_charge_id");--> statement-breakpoint
CREATE INDEX "petty_cash_funds_company_idx" ON "petty_cash_funds" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "petty_cash_funds_branch_uq" ON "petty_cash_funds" USING btree ("company_id","branch_id");--> statement-breakpoint
CREATE INDEX "petty_cash_replenishments_company_idx" ON "petty_cash_replenishments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "petty_cash_replenishments_branch_idx" ON "petty_cash_replenishments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "service_charges_company_idx" ON "service_charges" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "service_charges_active_idx" ON "service_charges" USING btree ("company_id","active");--> statement-breakpoint
CREATE INDEX "service_charges_effective_idx" ON "service_charges" USING btree ("company_id","effective_from","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "service_charges_company_lower_code_uq" ON "service_charges" USING btree ("company_id",lower("code"));--> statement-breakpoint
CREATE INDEX "tax_components_profile_idx" ON "tax_components" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "tax_filing_audit_logs_item_idx" ON "tax_filing_audit_logs" USING btree ("tax_journal_item_id");--> statement-breakpoint
CREATE INDEX "tax_filing_periods_company_idx" ON "tax_filing_periods" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tax_filing_periods_status_idx" ON "tax_filing_periods" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "tax_filing_runs_company_idx" ON "tax_filing_runs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tax_filing_runs_period_idx" ON "tax_filing_runs" USING btree ("filing_period_id");--> statement-breakpoint
CREATE INDEX "tax_journal_items_company_idx" ON "tax_journal_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tax_journal_items_branch_date_idx" ON "tax_journal_items" USING btree ("branch_id","posting_date");--> statement-breakpoint
CREATE INDEX "tax_journal_items_status_idx" ON "tax_journal_items" USING btree ("company_id","filing_status");--> statement-breakpoint
CREATE INDEX "tax_journal_items_source_idx" ON "tax_journal_items" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "tax_profiles_company_idx" ON "tax_profiles" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_modules_company_idx" ON "company_modules" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_modules_company_enabled_idx" ON "company_modules" USING btree ("company_id","is_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "company_modules_company_module_code_uq" ON "company_modules" USING btree ("company_id","module_code");--> statement-breakpoint
CREATE UNIQUE INDEX "module_catalog_lower_code_uq" ON "module_catalog" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "pr_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pr_expires_idx" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_token_hash_uq" ON "password_resets" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "rt_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rt_expires_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rt_token_hash_uq" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "attendance_records_company_date_idx" ON "attendance_records" USING btree ("company_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_records_branch_date_idx" ON "attendance_records" USING btree ("branch_id","attendance_date");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_employee_date_uq" ON "attendance_records" USING btree ("employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "departments_company_idx" ON "departments" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_company_lower_name_uq" ON "departments" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "departments_company_code_uq" ON "departments" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_idx" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_job_assignments_employee_idx" ON "employee_job_assignments" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "employee_job_assignments_company_branch_idx" ON "employee_job_assignments" USING btree ("company_id","branch_id");--> statement-breakpoint
CREATE INDEX "employees_company_idx" ON "employees" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employees_company_status_idx" ON "employees" USING btree ("company_id","employment_status");--> statement-breakpoint
CREATE INDEX "employees_company_branch_idx" ON "employees" USING btree ("company_id","branch_id");--> statement-breakpoint
CREATE INDEX "employees_company_department_idx" ON "employees" USING btree ("company_id","department_id");--> statement-breakpoint
CREATE INDEX "employees_manager_idx" ON "employees" USING btree ("manager_employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_employee_number_uq" ON "employees" USING btree ("company_id","employee_number");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_lower_email_uq" ON "employees" USING btree ("company_id",lower("email"));--> statement-breakpoint
CREATE INDEX "job_titles_company_idx" ON "job_titles" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_titles_company_lower_name_uq" ON "job_titles" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "job_titles_company_code_uq" ON "job_titles" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "leave_requests_company_idx" ON "leave_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_idx" ON "leave_requests" USING btree ("employee_id","date_from");--> statement-breakpoint
CREATE INDEX "leave_requests_company_status_idx" ON "leave_requests" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "leave_types_company_idx" ON "leave_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_company_lower_name_uq" ON "leave_types" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "leave_types_company_code_uq" ON "leave_types" USING btree ("company_id","code");--> statement-breakpoint
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
CREATE INDEX "deduction_types_company_idx" ON "deduction_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deduction_types_company_code_uq" ON "deduction_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "earning_types_company_idx" ON "earning_types" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "earning_types_company_code_uq" ON "earning_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "employee_compensation_employee_idx" ON "employee_compensation" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "employee_compensation_company_group_idx" ON "employee_compensation" USING btree ("company_id","payroll_group_id");--> statement-breakpoint
CREATE INDEX "employee_compensation_items_comp_idx" ON "employee_compensation_items" USING btree ("employee_compensation_id");--> statement-breakpoint
CREATE INDEX "payroll_groups_company_idx" ON "payroll_groups" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_groups_company_lower_name_uq" ON "payroll_groups" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "payroll_manual_adjustments_cycle_employee_idx" ON "payroll_manual_adjustments" USING btree ("payroll_period_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_manual_adjustments_company_cycle_idx" ON "payroll_manual_adjustments" USING btree ("company_id","payroll_period_id");--> statement-breakpoint
CREATE INDEX "payroll_overtime_entries_cycle_employee_idx" ON "payroll_overtime_entries" USING btree ("payroll_period_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_overtime_entries_company_cycle_idx" ON "payroll_overtime_entries" USING btree ("company_id","payroll_period_id");--> statement-breakpoint
CREATE INDEX "payroll_periods_company_status_idx" ON "payroll_periods" USING btree ("company_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_periods_group_window_uq" ON "payroll_periods" USING btree ("payroll_group_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "payroll_run_employees_company_employee_idx" ON "payroll_run_employees" USING btree ("company_id","employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_run_employees_run_employee_uq" ON "payroll_run_employees" USING btree ("payroll_run_id","employee_id");--> statement-breakpoint
CREATE INDEX "payroll_run_items_run_employee_type_idx" ON "payroll_run_items" USING btree ("payroll_run_employee_id","item_type");--> statement-breakpoint
CREATE INDEX "payroll_runs_period_status_idx" ON "payroll_runs" USING btree ("payroll_period_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payslips_company_number_uq" ON "payslips" USING btree ("company_id","payslip_number");--> statement-breakpoint
CREATE UNIQUE INDEX "payslips_run_employee_uq" ON "payslips" USING btree ("payroll_run_employee_id");--> statement-breakpoint
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
CREATE INDEX "parcel_content_catalog_company_idx" ON "parcel_content_catalog" USING btree ("company_id","active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_content_catalog_company_lower_name_uq" ON "parcel_content_catalog" USING btree ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "parcel_detail_catalog_company_idx" ON "parcel_detail_catalog" USING btree ("company_id","active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_detail_catalog_company_lower_name_uq" ON "parcel_detail_catalog" USING btree ("company_id",lower("name"));--> statement-breakpoint
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
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "consignment_configs_company_idx" ON "consignment_configs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "consignment_configs_route_idx" ON "consignment_configs" USING btree ("source_branch_id","destination_branch_id");--> statement-breakpoint
CREATE INDEX "consignment_configs_mode_idx" ON "consignment_configs" USING btree ("auto_grouping_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_configs_company_route_uq" ON "consignment_configs" USING btree ("company_id","source_branch_id","destination_branch_id");--> statement-breakpoint
CREATE INDEX "consignment_manifests_consignment_idx" ON "consignment_manifests" USING btree ("consignment_id");--> statement-breakpoint
CREATE INDEX "consignment_manifests_status_idx" ON "consignment_manifests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "consignment_manifests_manifest_number_uq" ON "consignment_manifests" USING btree ("manifest_number");--> statement-breakpoint
CREATE INDEX "consignment_suggestions_source_branch_idx" ON "consignment_suggestions" USING btree ("source_branch_id");--> statement-breakpoint
CREATE INDEX "consignment_suggestions_destination_branch_idx" ON "consignment_suggestions" USING btree ("destination_branch_id");--> statement-breakpoint
CREATE INDEX "consignment_suggestions_status_idx" ON "consignment_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consignment_suggestions_efficiency_idx" ON "consignment_suggestions" USING btree ("efficiency_score");--> statement-breakpoint
CREATE INDEX "consignment_tracking_events_consignment_idx" ON "consignment_tracking_events" USING btree ("consignment_id");--> statement-breakpoint
CREATE INDEX "consignment_tracking_events_event_type_idx" ON "consignment_tracking_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "consignment_tracking_events_event_time_idx" ON "consignment_tracking_events" USING btree ("event_time");

--> statement-breakpoint
-- Source: scripts/enable_pgcrypto.sql
-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;


--> statement-breakpoint
-- Source: scripts/updated_at_triggers.sql
-- Suppress NOTICE messages like "does not exist, skipping"
set client_min_messages = warning;

-- Function and triggers to auto-update "updated_at" on row UPDATEs
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create/replace triggers for every base table that has an "updated_at" column
do $$
declare
  row_rec record;
begin
  for row_rec in
    select c.table_schema, c.table_name
    from information_schema.columns c
    join information_schema.tables tbl
      on tbl.table_schema = c.table_schema
     and tbl.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and tbl.table_type = 'BASE TABLE'
    order by c.table_name
  loop
    execute format(
      'drop trigger if exists trg_%I_updated_at on %I.%I;',
      row_rec.table_name,
      row_rec.table_schema,
      row_rec.table_name
    );

    execute format(
      'create trigger trg_%I_updated_at before update on %I.%I for each row execute function set_updated_at();',
      row_rec.table_name,
      row_rec.table_schema,
      row_rec.table_name
    );
  end loop;
end $$;
