CREATE TABLE IF NOT EXISTS "notification_providers" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "channel" varchar(16) NOT NULL,
  "provider_key" varchar(64) NOT NULL,
  "name" varchar(255) NOT NULL,
  "config_json" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "channel" varchar(16) NOT NULL,
  "code" varchar(64) NOT NULL,
  "name" varchar(255) NOT NULL,
  "subject" varchar(255),
  "body" text NOT NULL,
  "variables_json" jsonb,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_campaigns" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "name" varchar(255) NOT NULL,
  "event_code" varchar(80),
  "channel" varchar(16) NOT NULL,
  "template_id" varchar(25),
  "subject_override" varchar(255),
  "body_override" text,
  "audience_type" varchar(64) NOT NULL,
  "status" smallint DEFAULT 0 NOT NULL,
  "scheduled_at" timestamp,
  "submitted_by" varchar(25),
  "submitted_at" timestamp,
  "approved_by" varchar(25),
  "approved_at" timestamp,
  "rejected_by" varchar(25),
  "rejected_at" timestamp,
  "approval_note" text,
  "sent_by" varchar(25),
  "sent_at" timestamp,
  "created_by" varchar(25),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_dispatches" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "campaign_id" varchar(25),
  "channel" varchar(16) NOT NULL,
  "provider_id" varchar(25),
  "provider_key" varchar(64),
  "recipient_type" varchar(32) NOT NULL,
  "recipient_id" varchar(25),
  "recipient_name" varchar(255),
  "recipient_address" varchar(255) NOT NULL,
  "subject" varchar(255),
  "body" text NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "provider_message_id" varchar(255),
  "error_message" text,
  "metadata_json" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "notification_providers"
    ADD CONSTRAINT "notification_providers_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_providers"
    ADD CONSTRAINT "notification_providers_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_templates"
    ADD CONSTRAINT "notification_templates_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_templates"
    ADD CONSTRAINT "notification_templates_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_template_id_notification_templates_id_fk"
    FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_submitted_by_users_id_fk"
    FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_approved_by_users_id_fk"
    FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_rejected_by_users_id_fk"
    FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_sent_by_users_id_fk"
    FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_dispatches"
    ADD CONSTRAINT "notification_dispatches_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_dispatches"
    ADD CONSTRAINT "notification_dispatches_campaign_id_notification_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_dispatches"
    ADD CONSTRAINT "notification_dispatches_provider_id_notification_providers_id_fk"
    FOREIGN KEY ("provider_id") REFERENCES "public"."notification_providers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "notification_providers_company_channel_idx"
  ON "notification_providers" USING btree ("company_id","channel");

CREATE INDEX IF NOT EXISTS "notification_providers_company_default_idx"
  ON "notification_providers" USING btree ("company_id","channel","is_default");

CREATE UNIQUE INDEX IF NOT EXISTS "notification_providers_company_channel_provider_uq"
  ON "notification_providers" USING btree ("company_id","channel", lower("provider_key"));

CREATE INDEX IF NOT EXISTS "notification_templates_company_channel_idx"
  ON "notification_templates" USING btree ("company_id","channel");

CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_company_channel_code_uq"
  ON "notification_templates" USING btree ("company_id","channel", lower("code"));

CREATE INDEX IF NOT EXISTS "notification_campaigns_company_status_idx"
  ON "notification_campaigns" USING btree ("company_id","status");

CREATE INDEX IF NOT EXISTS "notification_campaigns_company_created_idx"
  ON "notification_campaigns" USING btree ("company_id","created_at");

CREATE INDEX IF NOT EXISTS "notification_dispatches_company_created_idx"
  ON "notification_dispatches" USING btree ("company_id","created_at");

CREATE INDEX IF NOT EXISTS "notification_dispatches_campaign_idx"
  ON "notification_dispatches" USING btree ("campaign_id");

CREATE INDEX IF NOT EXISTS "notification_dispatches_company_status_idx"
  ON "notification_dispatches" USING btree ("company_id","status","channel");


-- Added module tables missing from the original 0001 migration
-- Safe for reruns: CREATE TABLE IF NOT EXISTS, duplicate-safe FKs, IF NOT EXISTS indexes
CREATE TABLE IF NOT EXISTS "comm_call_participants" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"call_session_id" varchar(25) NOT NULL,
	"user_id" varchar(25),
	"joined_at" timestamp,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_call_recordings" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"call_session_id" varchar(25) NOT NULL,
	"recording_key" varchar(500) NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_call_sessions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"thread_id" varchar(25),
	"channel_id" varchar(25),
	"initiator_user_id" varchar(25),
	"call_type" varchar(20) DEFAULT 'audio' NOT NULL,
	"status" varchar(20) DEFAULT 'ringing' NOT NULL,
	"livekit_room_name" varchar(255),
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_channel_members" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"channel_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"member_role" varchar(20) DEFAULT 'member',
	"joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_channels" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_call_enabled" boolean DEFAULT false NOT NULL,
	"is_announcement_only" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_engagement_requests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"requester_user_id" varchar(25) NOT NULL,
	"target_user_id" varchar(25) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reason_code" varchar(80),
	"reason_note" text,
	"linked_entity_type" varchar(50),
	"linked_entity_id" varchar(25),
	"scope" varchar(20) DEFAULT 'temporary' NOT NULL,
	"approved_by" varchar(25),
	"approved_at" timestamp,
	"declined_by" varchar(25),
	"declined_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_group_members" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"group_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"member_role" varchar(20) DEFAULT 'member',
	"joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_groups" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_message_attachments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"message_id" varchar(25) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_messages" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"thread_id" varchar(25) NOT NULL,
	"sender_user_id" varchar(25),
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"body" text,
	"metadata_json" jsonb,
	"reply_to_message_id" varchar(25),
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_by" varchar(25),
	"deleted_at" timestamp,
	"delete_reason" text
);

CREATE TABLE IF NOT EXISTS "comm_presence" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_read_receipts" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"message_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_thread_participants" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"thread_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"role_in_thread" varchar(20),
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "comm_threads" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"thread_type" varchar(32) NOT NULL,
	"title" varchar(255),
	"is_private" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_by" varchar(25),
	"deleted_at" timestamp,
	"delete_reason" text
);

CREATE TABLE IF NOT EXISTS "cs_conversation_messages" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(25) NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_user_id" varchar(25),
	"body" text,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cs_conversations" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"customer_id" varchar(25),
	"ticket_id" varchar(25),
	"channel" varchar(30) DEFAULT 'portal_chat' NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cs_feedback" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"ticket_id" varchar(25) NOT NULL,
	"customer_id" varchar(25),
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cs_sla_policies" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"first_response_minutes" integer DEFAULT 30 NOT NULL,
	"resolution_minutes" integer DEFAULT 240 NOT NULL,
	"escalation_minutes" integer DEFAULT 120 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cs_ticket_events" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(25) NOT NULL,
	"event_type" varchar(60) NOT NULL,
	"event_note" text,
	"from_status" varchar(30),
	"to_status" varchar(30),
	"performed_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cs_tickets" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"conversation_id" varchar(25),
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"channel" varchar(30) DEFAULT 'portal_chat' NOT NULL,
	"subject" varchar(255),
	"description" text,
	"tracking_code" varchar(50),
	"booking_code" varchar(50),
	"parcel_id" varchar(25),
	"owner_user_id" varchar(25),
	"owner_queue" varchar(100),
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"first_response_due_at" timestamp,
	"resolution_due_at" timestamp,
	"escalation_due_at" timestamp,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "procurement_purchase_requests" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"request_no" varchar(50) NOT NULL,
	"supplier_id" varchar(25),
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount_psw" bigint DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"requested_by_user_id" varchar(25) NOT NULL,
	"approved_by_user_id" varchar(25),
	"rejected_by_user_id" varchar(25),
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "procurement_suppliers" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"telephone" varchar(50),
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fleet_fuel_logs" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"vehicle_id" varchar(25) NOT NULL,
	"log_no" varchar(50) NOT NULL,
	"liters" double precision NOT NULL,
	"fuel_cost_psw" bigint DEFAULT 0 NOT NULL,
	"odometer_km" integer,
	"station_name" varchar(255),
	"note" text,
	"status" smallint DEFAULT 1 NOT NULL,
	"logged_by_user_id" varchar(25) NOT NULL,
	"approved_by_user_id" varchar(25),
	"rejected_by_user_id" varchar(25),
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fleet_vehicles" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25),
	"plate_number" varchar(50) NOT NULL,
	"model" varchar(255) NOT NULL,
	"assigned_driver_user_id" varchar(25),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reconciliation_bank_settlements" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"branch_id" varchar(25) NOT NULL,
	"settlement_no" varchar(60) NOT NULL,
	"settlement_date" timestamp NOT NULL,
	"bank_reference" varchar(120),
	"expected_amount_psw" bigint DEFAULT 0 NOT NULL,
	"banked_amount_psw" bigint DEFAULT 0 NOT NULL,
	"variance_psw" bigint DEFAULT 0 NOT NULL,
	"notes" text,
	"status" smallint DEFAULT 0 NOT NULL,
	"submitted_by_user_id" varchar(25) NOT NULL,
	"approved_by_user_id" varchar(25),
	"rejected_by_user_id" varchar(25),
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "it_support_ticket_events" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(25) NOT NULL,
	"event_type" varchar(60) NOT NULL,
	"event_note" text,
	"from_status" varchar(30),
	"to_status" varchar(30),
	"performed_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "it_support_tickets" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"company_id" varchar(25) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"category" varchar(60) DEFAULT 'general' NOT NULL,
	"branch_id" varchar(25),
	"location_id" varchar(25),
	"requester_user_id" varchar(25) NOT NULL,
	"assigned_to_user_id" varchar(25),
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" varchar(25),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "comm_call_participants" ADD CONSTRAINT "comm_call_participants_call_session_id_comm_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."comm_call_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_participants" ADD CONSTRAINT "comm_call_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_recordings" ADD CONSTRAINT "comm_call_recordings_call_session_id_comm_call_sessions_id_fk" FOREIGN KEY ("call_session_id") REFERENCES "public"."comm_call_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_sessions" ADD CONSTRAINT "comm_call_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_sessions" ADD CONSTRAINT "comm_call_sessions_thread_id_comm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."comm_threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_sessions" ADD CONSTRAINT "comm_call_sessions_channel_id_comm_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."comm_channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_call_sessions" ADD CONSTRAINT "comm_call_sessions_initiator_user_id_users_id_fk" FOREIGN KEY ("initiator_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channel_members" ADD CONSTRAINT "comm_channel_members_channel_id_comm_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."comm_channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channel_members" ADD CONSTRAINT "comm_channel_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channels" ADD CONSTRAINT "comm_channels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channels" ADD CONSTRAINT "comm_channels_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channels" ADD CONSTRAINT "comm_channels_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_channels" ADD CONSTRAINT "comm_channels_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_engagement_requests" ADD CONSTRAINT "comm_engagement_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_engagement_requests" ADD CONSTRAINT "comm_engagement_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_engagement_requests" ADD CONSTRAINT "comm_engagement_requests_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_engagement_requests" ADD CONSTRAINT "comm_engagement_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_engagement_requests" ADD CONSTRAINT "comm_engagement_requests_declined_by_users_id_fk" FOREIGN KEY ("declined_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_group_members" ADD CONSTRAINT "comm_group_members_group_id_comm_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."comm_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_group_members" ADD CONSTRAINT "comm_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_groups" ADD CONSTRAINT "comm_groups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_groups" ADD CONSTRAINT "comm_groups_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_groups" ADD CONSTRAINT "comm_groups_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_groups" ADD CONSTRAINT "comm_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_message_attachments" ADD CONSTRAINT "comm_message_attachments_message_id_comm_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."comm_messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_messages" ADD CONSTRAINT "comm_messages_thread_id_comm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."comm_threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_messages" ADD CONSTRAINT "comm_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_messages" ADD CONSTRAINT "comm_messages_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_presence" ADD CONSTRAINT "comm_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_read_receipts" ADD CONSTRAINT "comm_read_receipts_message_id_comm_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."comm_messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_read_receipts" ADD CONSTRAINT "comm_read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_thread_participants" ADD CONSTRAINT "comm_thread_participants_thread_id_comm_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."comm_threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_thread_participants" ADD CONSTRAINT "comm_thread_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_threads" ADD CONSTRAINT "comm_threads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_threads" ADD CONSTRAINT "comm_threads_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_threads" ADD CONSTRAINT "comm_threads_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_threads" ADD CONSTRAINT "comm_threads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "comm_threads" ADD CONSTRAINT "comm_threads_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversation_messages" ADD CONSTRAINT "cs_conversation_messages_conversation_id_cs_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."cs_conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversation_messages" ADD CONSTRAINT "cs_conversation_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversations" ADD CONSTRAINT "cs_conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversations" ADD CONSTRAINT "cs_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversations" ADD CONSTRAINT "cs_conversations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversations" ADD CONSTRAINT "cs_conversations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_conversations" ADD CONSTRAINT "cs_conversations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_feedback" ADD CONSTRAINT "cs_feedback_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_feedback" ADD CONSTRAINT "cs_feedback_ticket_id_cs_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."cs_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_feedback" ADD CONSTRAINT "cs_feedback_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_sla_policies" ADD CONSTRAINT "cs_sla_policies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_sla_policies" ADD CONSTRAINT "cs_sla_policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_ticket_events" ADD CONSTRAINT "cs_ticket_events_ticket_id_cs_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."cs_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_ticket_events" ADD CONSTRAINT "cs_ticket_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_conversation_id_cs_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."cs_conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cs_tickets" ADD CONSTRAINT "cs_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_supplier_id_procurement_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."procurement_suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_purchase_requests" ADD CONSTRAINT "procurement_purchase_requests_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_suppliers" ADD CONSTRAINT "procurement_suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "procurement_suppliers" ADD CONSTRAINT "procurement_suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_vehicle_id_fleet_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet_vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_logged_by_user_id_users_id_fk" FOREIGN KEY ("logged_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_fuel_logs" ADD CONSTRAINT "fleet_fuel_logs_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_assigned_driver_user_id_users_id_fk" FOREIGN KEY ("assigned_driver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reconciliation_bank_settlements" ADD CONSTRAINT "reconciliation_bank_settlements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reconciliation_bank_settlements" ADD CONSTRAINT "reconciliation_bank_settlements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reconciliation_bank_settlements" ADD CONSTRAINT "reconciliation_bank_settlements_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reconciliation_bank_settlements" ADD CONSTRAINT "reconciliation_bank_settlements_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reconciliation_bank_settlements" ADD CONSTRAINT "reconciliation_bank_settlements_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_ticket_events" ADD CONSTRAINT "it_support_ticket_events_ticket_id_it_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."it_support_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_ticket_events" ADD CONSTRAINT "it_support_ticket_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "it_support_tickets" ADD CONSTRAINT "it_support_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "comm_call_participants_call_idx" ON "comm_call_participants" USING btree ("call_session_id");

CREATE INDEX IF NOT EXISTS "comm_call_recordings_session_idx" ON "comm_call_recordings" USING btree ("call_session_id");

CREATE INDEX IF NOT EXISTS "comm_call_sessions_company_created_idx" ON "comm_call_sessions" USING btree ("company_id","created_at");

CREATE INDEX IF NOT EXISTS "comm_channel_members_channel_idx" ON "comm_channel_members" USING btree ("channel_id");

CREATE INDEX IF NOT EXISTS "comm_channel_members_user_idx" ON "comm_channel_members" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_channel_members_channel_user_uq" ON "comm_channel_members" USING btree ("channel_id","user_id");

CREATE INDEX IF NOT EXISTS "comm_channels_company_idx" ON "comm_channels" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "comm_engagement_requests_target_status_idx" ON "comm_engagement_requests" USING btree ("target_user_id","status");

CREATE INDEX IF NOT EXISTS "comm_engagement_requests_requester_idx" ON "comm_engagement_requests" USING btree ("requester_user_id");

CREATE INDEX IF NOT EXISTS "comm_group_members_group_idx" ON "comm_group_members" USING btree ("group_id");

CREATE INDEX IF NOT EXISTS "comm_group_members_user_idx" ON "comm_group_members" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_group_members_group_user_uq" ON "comm_group_members" USING btree ("group_id","user_id");

CREATE INDEX IF NOT EXISTS "comm_groups_company_idx" ON "comm_groups" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "comm_message_attachments_message_idx" ON "comm_message_attachments" USING btree ("message_id");

CREATE INDEX IF NOT EXISTS "comm_messages_thread_created_idx" ON "comm_messages" USING btree ("thread_id","created_at");

CREATE INDEX IF NOT EXISTS "comm_messages_sender_idx" ON "comm_messages" USING btree ("sender_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_presence_user_uq" ON "comm_presence" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "comm_read_receipts_message_idx" ON "comm_read_receipts" USING btree ("message_id");

CREATE INDEX IF NOT EXISTS "comm_read_receipts_user_idx" ON "comm_read_receipts" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_read_receipts_message_user_uq" ON "comm_read_receipts" USING btree ("message_id","user_id");

CREATE INDEX IF NOT EXISTS "comm_thread_participants_thread_idx" ON "comm_thread_participants" USING btree ("thread_id");

CREATE INDEX IF NOT EXISTS "comm_thread_participants_user_idx" ON "comm_thread_participants" USING btree ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "comm_thread_participants_thread_user_uq" ON "comm_thread_participants" USING btree ("thread_id","user_id");

CREATE INDEX IF NOT EXISTS "comm_threads_company_last_message_idx" ON "comm_threads" USING btree ("company_id","last_message_at");

CREATE INDEX IF NOT EXISTS "cs_conversation_messages_conversation_idx" ON "cs_conversation_messages" USING btree ("conversation_id");

CREATE INDEX IF NOT EXISTS "cs_conversations_company_idx" ON "cs_conversations" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "cs_conversations_customer_idx" ON "cs_conversations" USING btree ("customer_id");

CREATE INDEX IF NOT EXISTS "cs_feedback_company_idx" ON "cs_feedback" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "cs_feedback_ticket_idx" ON "cs_feedback" USING btree ("ticket_id");

CREATE INDEX IF NOT EXISTS "cs_sla_policies_company_idx" ON "cs_sla_policies" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "cs_ticket_events_ticket_idx" ON "cs_ticket_events" USING btree ("ticket_id");

CREATE INDEX IF NOT EXISTS "cs_tickets_company_status_priority_idx" ON "cs_tickets" USING btree ("company_id","status","priority");

CREATE INDEX IF NOT EXISTS "cs_tickets_owner_status_idx" ON "cs_tickets" USING btree ("owner_user_id","status");

CREATE INDEX IF NOT EXISTS "cs_tickets_tracking_idx" ON "cs_tickets" USING btree ("tracking_code");

CREATE INDEX IF NOT EXISTS "procurement_purchase_requests_company_idx" ON "procurement_purchase_requests" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "procurement_purchase_requests_company_status_idx" ON "procurement_purchase_requests" USING btree ("company_id","status");

CREATE INDEX IF NOT EXISTS "procurement_purchase_requests_supplier_idx" ON "procurement_purchase_requests" USING btree ("supplier_id");

CREATE UNIQUE INDEX IF NOT EXISTS "procurement_purchase_requests_company_request_no_uq" ON "procurement_purchase_requests" USING btree ("company_id","request_no");

CREATE INDEX IF NOT EXISTS "procurement_suppliers_company_idx" ON "procurement_suppliers" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "procurement_suppliers_company_active_idx" ON "procurement_suppliers" USING btree ("company_id","is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "procurement_suppliers_company_lower_name_uq" ON "procurement_suppliers" USING btree ("company_id",lower("name"));

CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_company_idx" ON "fleet_fuel_logs" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_company_status_idx" ON "fleet_fuel_logs" USING btree ("company_id","status");

CREATE INDEX IF NOT EXISTS "fleet_fuel_logs_vehicle_idx" ON "fleet_fuel_logs" USING btree ("vehicle_id");

CREATE UNIQUE INDEX IF NOT EXISTS "fleet_fuel_logs_company_log_no_uq" ON "fleet_fuel_logs" USING btree ("company_id","log_no");

CREATE INDEX IF NOT EXISTS "fleet_vehicles_company_idx" ON "fleet_vehicles" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "fleet_vehicles_company_active_idx" ON "fleet_vehicles" USING btree ("company_id","is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "fleet_vehicles_company_lower_plate_uq" ON "fleet_vehicles" USING btree ("company_id",lower("plate_number"));

CREATE INDEX IF NOT EXISTS "reconciliation_bank_settlements_company_idx" ON "reconciliation_bank_settlements" USING btree ("company_id");

CREATE INDEX IF NOT EXISTS "reconciliation_bank_settlements_company_status_idx" ON "reconciliation_bank_settlements" USING btree ("company_id","status");

CREATE INDEX IF NOT EXISTS "reconciliation_bank_settlements_branch_date_idx" ON "reconciliation_bank_settlements" USING btree ("branch_id","settlement_date");

CREATE UNIQUE INDEX IF NOT EXISTS "reconciliation_bank_settlements_company_no_uq" ON "reconciliation_bank_settlements" USING btree ("company_id","settlement_no");

CREATE INDEX IF NOT EXISTS "it_support_ticket_events_ticket_idx" ON "it_support_ticket_events" USING btree ("ticket_id");

CREATE INDEX IF NOT EXISTS "it_support_ticket_events_created_at_idx" ON "it_support_ticket_events" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "it_support_tickets_company_status_priority_idx" ON "it_support_tickets" USING btree ("company_id","status","priority");

CREATE INDEX IF NOT EXISTS "it_support_tickets_company_requester_idx" ON "it_support_tickets" USING btree ("company_id","requester_user_id");

CREATE INDEX IF NOT EXISTS "it_support_tickets_company_assignee_idx" ON "it_support_tickets" USING btree ("company_id","assigned_to_user_id");

CREATE INDEX IF NOT EXISTS "it_support_tickets_created_at_idx" ON "it_support_tickets" USING btree ("created_at");

