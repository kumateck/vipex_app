# Communication Module Implementation Checklist

Date: 2026-03-31
Depends on: docs/COMMUNICATION_SUITE_SPEC.md

## Current Implementation Snapshot (2026-03-31)

Implemented now:

1. Schema export and route mounting:
   - `src/db/schemas/communication.ts`
   - `/v1/communication/*`
   - `/v1/customer-service/*`
2. Internal communication backend (DB-backed list/create):
   - threads
   - messages
   - channels
   - groups
   - presence
   - calls
3. Engagement request workflow:
   - create
   - list by incoming/outgoing/all
   - approve
   - decline
4. Customer service backend (DB-backed list/create):
   - conversations
   - tickets
   - feedback
   - SLA policies
5. Module gating:
   - `communication_internal`
   - `communication_customer_service`
   - `communication_calls_livekit`
6. Module dependency rules:
   - `communication_customer_service` requires `customers` and `communication_internal`
   - `communication_calls_livekit` requires `communication_internal`

Still planned:

1. Realtime event bus and websocket fanout
2. Full LiveKit token/session lifecycle endpoints
3. Rich message editing/deletion/read-receipt workflows
4. Frontend communication workspace and customer service consoles
5. Permission catalog expansion for communication-specific fine-grained actions

## 1. Migration Checklist (Schema + Indexes)

Create one migration (or split into two):

1. Internal communication core
2. Customer service communication

### 1.1 Create enums

1. `comm_thread_type`: `direct`, `group`, `channel`, `customer`
2. `comm_message_type`: `text`, `system`, `file`, `image`, `audio`, `video`, `link`
3. `engagement_request_status`: `pending`, `approved`, `declined`, `expired`, `revoked`
4. `engagement_scope`: `temporary`, `permanent`
5. `call_type`: `audio`, `video`, `screenshare`
6. `call_status`: `ringing`, `active`, `ended`, `missed`, `rejected`
7. `ticket_status`: `new`, `open`, `pending_customer`, `pending_internal`, `escalated`, `resolved`, `closed`
8. `ticket_priority`: `low`, `medium`, `high`, `urgent`
9. `ticket_channel`: `portal_chat`, `phone`, `whatsapp`, `email`, `internal`

### 1.2 Create internal chat tables

1. `comm_threads`
   1. `id`, `company_id`, `branch_id`, `location_id`
   2. `thread_type` (enum)
   3. `title` nullable
   4. `is_private` boolean default true
   5. `last_message_at` timestamp nullable
   6. standard audit fields + soft delete
2. `comm_thread_participants`
   1. `id`, `thread_id`, `user_id`
   2. `role_in_thread` nullable (`owner`, `admin`, `member`)
   3. `joined_at`, `left_at` nullable
   4. unique index: `(thread_id, user_id)`
3. `comm_messages`
   1. `id`, `thread_id`, `sender_user_id`
   2. `message_type` (enum)
   3. `body` text nullable
   4. `metadata_json` jsonb nullable
   5. `reply_to_message_id` nullable
   6. `edited_at` nullable
   7. soft delete + delete reason
4. `comm_message_attachments`
   1. `id`, `message_id`
   2. `file_key`, `file_name`, `mime_type`, `size_bytes`
5. `comm_read_receipts`
   1. `id`, `message_id`, `user_id`, `read_at`
   2. unique index: `(message_id, user_id)`
6. `comm_engagement_requests`
   1. `id`, `company_id`, `requester_user_id`, `target_user_id`
   2. `status` enum default `pending`
   3. `reason_code`, `reason_note` nullable
   4. `linked_entity_type`, `linked_entity_id` nullable
   5. `scope` enum default `temporary`
   6. `approved_by`, `approved_at`, `declined_by`, `declined_at` nullable
   7. `expires_at` nullable
7. `comm_groups`
   1. `id`, `company_id`, `branch_id`, `location_id`
   2. `name`, `description` nullable
   3. `created_by`, audit fields
8. `comm_group_members`
   1. `id`, `group_id`, `user_id`, `member_role` nullable
   2. unique index `(group_id, user_id)`
9. `comm_channels`
   1. `id`, `company_id`, `branch_id`, `location_id`
   2. `name`, `description` nullable
   3. `is_call_enabled` boolean default false
   4. `is_announcement_only` boolean default false
   5. `created_by`, audit fields
10. `comm_channel_members`
11. `id`, `channel_id`, `user_id`, `member_role`
12. unique index `(channel_id, user_id)`
13. `comm_presence`
14. `id`, `user_id`, `status` (`online`, `offline`, `away`, `busy`)
15. `last_seen_at`

### 1.3 Create calls tables

1. `comm_call_sessions`
   1. `id`, `company_id`, `thread_id` nullable, `channel_id` nullable
   2. `initiator_user_id`
   3. `call_type`, `status`
   4. `livekit_room_name`, `started_at`, `ended_at` nullable
2. `comm_call_participants`
   1. `id`, `call_session_id`, `user_id`
   2. `joined_at`, `left_at` nullable
3. `comm_call_recordings` (optional)
   1. `id`, `call_session_id`, `recording_key`, `duration_seconds`

### 1.4 Create customer service tables

1. `cs_conversations`
   1. `id`, `company_id`, `customer_id` nullable
   2. `ticket_id` nullable
   3. `channel` enum
   4. `branch_id`, `location_id` nullable
2. `cs_conversation_messages`
   1. `id`, `conversation_id`
   2. `sender_type` (`customer`, `agent`, `system`)
   3. `sender_user_id` nullable
   4. `body`, `metadata_json` nullable
3. `cs_tickets`
   1. `id`, `company_id`, `conversation_id` nullable
   2. `status`, `priority`, `channel`
   3. `subject`, `description` nullable
   4. `tracking_code`, `booking_code`, `parcel_id` nullable
   5. `owner_user_id`, `owner_queue` nullable
   6. `branch_id`, `location_id` nullable
   7. `first_response_due_at`, `resolution_due_at`, `escalation_due_at` nullable
   8. `resolved_at`, `closed_at` nullable
4. `cs_ticket_events`
   1. `id`, `ticket_id`, `event_type`, `event_note` nullable
   2. `from_status`, `to_status` nullable
   3. `performed_by`
5. `cs_sla_policies`
   1. `id`, `company_id`, `name`
   2. `first_response_minutes`, `resolution_minutes`, `escalation_minutes`
   3. `is_active`
6. `cs_feedback`
   1. `id`, `company_id`, `ticket_id`, `customer_id` nullable
   2. `score` int (1-5), `comment` nullable

### 1.5 Index and constraints checklist

1. Add index on `comm_messages(thread_id, created_at desc)`
2. Add index on `comm_threads(company_id, last_message_at desc)`
3. Add index on `comm_engagement_requests(target_user_id, status)`
4. Add index on `cs_tickets(company_id, status, priority, updated_at desc)`
5. Add index on `cs_tickets(owner_user_id, status)`
6. Add index on `cs_tickets(tracking_code)`
7. Add FKs to `users`, `companies`, `branches`, `locations` with safe delete behavior

## 2. Permission Constants Draft

Add these to `src/shared/permissions/constants.ts`.

```ts
export const PermissionKeys = {
  // Communication - Internal
  CanReadCommunicationThreads: 'CanReadCommunicationThreads',
  CanCreateDirectChats: 'CanCreateDirectChats',
  CanCreateGroupChats: 'CanCreateGroupChats',
  CanCreateLocationChannels: 'CanCreateLocationChannels',
  CanCreateBranchChannels: 'CanCreateBranchChannels',
  CanCreateCrossBranchChannels: 'CanCreateCrossBranchChannels',
  CanSendMessages: 'CanSendMessages',
  CanEditOwnMessages: 'CanEditOwnMessages',
  CanDeleteOwnMessages: 'CanDeleteOwnMessages',
  CanModerateChannelMessages: 'CanModerateChannelMessages',
  CanManageChannelMembers: 'CanManageChannelMembers',

  // Communication - Engagement Requests
  CanCreateEngagementRequests: 'CanCreateEngagementRequests',
  CanApproveEngagementRequests: 'CanApproveEngagementRequests',
  CanDeclineEngagementRequests: 'CanDeclineEngagementRequests',
  CanOverrideEngagementRestrictions: 'CanOverrideEngagementRestrictions',

  // Communication - Calls
  CanStartAudioCalls: 'CanStartAudioCalls',
  CanStartVideoCalls: 'CanStartVideoCalls',
  CanShareScreen: 'CanShareScreen',
  CanJoinManagementCallChannels: 'CanJoinManagementCallChannels',
  CanAccessCallRecordings: 'CanAccessCallRecordings',

  // Customer Service
  CanReadCustomerTickets: 'CanReadCustomerTickets',
  CanCreateCustomerTickets: 'CanCreateCustomerTickets',
  CanReplyCustomerTickets: 'CanReplyCustomerTickets',
  CanEscalateCustomerTickets: 'CanEscalateCustomerTickets',
  CanResolveCustomerTickets: 'CanResolveCustomerTickets',
  CanCloseCustomerTickets: 'CanCloseCustomerTickets',
  CanManageSlaPolicies: 'CanManageSlaPolicies',
  CanReadCustomerFeedback: 'CanReadCustomerFeedback',

  // Audit
  CanReadCommunicationAudit: 'CanReadCommunicationAudit',
  CanExportCommunicationLogs: 'CanExportCommunicationLogs',
  CanReadDeletedCommunicationRecords: 'CanReadDeletedCommunicationRecords',
} as const;
```

### 2.1 Sidebar permission mapping suggestions

1. Internal chat inbox page: `CanReadCommunicationThreads`
2. Channel management page: `CanCreateLocationChannels`, `CanCreateBranchChannels`, `CanCreateCrossBranchChannels`
3. Engagement requests inbox: `CanApproveEngagementRequests`
4. Customer tickets page: `CanReadCustomerTickets`
5. SLA policy setup page: `CanManageSlaPolicies`

## 3. Backend Route Scaffold Plan

Add these route modules under `src/server/features`.

### 3.1 Internal communication feature modules

1. `src/server/features/communication/threads/`
2. `src/server/features/communication/messages/`
3. `src/server/features/communication/channels/`
4. `src/server/features/communication/groups/`
5. `src/server/features/communication/engagement-requests/`
6. `src/server/features/communication/presence/`
7. `src/server/features/communication/calls/`

Per module file structure:

1. `schema.ts`
2. `dto.ts`
3. `repository.ts`
4. `service.ts`
5. `controller.ts`
6. `routes.ts`

### 3.2 Customer service feature modules

1. `src/server/features/customer-service/tickets/`
2. `src/server/features/customer-service/conversations/`
3. `src/server/features/customer-service/feedback/`
4. `src/server/features/customer-service/sla/`

### 3.3 API path registration

1. Register internal APIs under `/v1/communication/*`
2. Register customer APIs under `/v1/customer-service/*`

## 4. Realtime Event Bus Contract

Define typed event payloads in one shared server file:

1. `message.created`
2. `message.updated`
3. `message.deleted`
4. `thread.read`
5. `engagement-request.created`
6. `engagement-request.approved`
7. `engagement-request.declined`
8. `call.session.started`
9. `call.session.ended`
10. `ticket.created`
11. `ticket.escalated`
12. `ticket.resolved`

Recommended location:

1. `src/server/features/communication/realtime/events.ts`
2. `src/server/features/customer-service/realtime/events.ts`

## 5. Frontend Build Sequence (Web/Desktop First)

1. Build internal inbox shell page and thread page
2. Add websocket hook and RTK Query cache invalidation wiring
3. Add engagement request UX (request, approve, decline)
4. Add channel and group CRUD pages
5. Add LiveKit call controls in thread header
6. Build customer ticket inbox and detail page
7. Add SLA indicators and escalation actions

## 6. Mobile Build Sequence

1. Internal inbox list + thread reply
2. Engagement request notifications
3. One-tap call join with LiveKit
4. Customer ticket queue for support agents

## 7. Definition of Done (Phase 1)

1. User can create direct chat with allowed peers instantly
2. User can request upward engagement; target can approve/decline
3. Approved request opens direct chat access
4. Group and channel creation respects location/branch/head-office scope
5. Messages are real-time across two active clients
6. All key actions are permission-guarded and audit-logged
