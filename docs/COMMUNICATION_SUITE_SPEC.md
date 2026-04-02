# Communication Suite Specification (Internal + Customer Service)

Date: 2026-03-31
Owner: Vipex ERP
Status: Draft for implementation
Status detail:

- Phase 1 backend foundation implemented in `src/server/features/communication/*` and `src/server/features/customer-service/*`
- Module-gating and dependency wiring implemented
- Realtime bus and frontend UX remain planned

## 1. Purpose

This module provides one communication platform for:

1. Internal staff communication (1:1, group chat, channels, calls)
2. Customer service communication (inquiry, complaint, feedback)
3. Controlled hierarchy-aware engagement and auditable collaboration

The goal is to replace fragmented communication (e.g., WhatsApp-only coordination) with role-aware, branch-aware, and location-aware communication integrated into ERP workflows.

## 2. Business Scope

### 2.1 Internal communication outcomes

1. Reduce parcel-operation delays between location, branch, and head office
2. Standardize escalation to higher-level officers
3. Enable persistent team channels and management call channels
4. Link conversations to operational entities (parcel, consignment, payment)

### 2.2 Customer communication outcomes

1. Centralize customer inquiries in structured tickets
2. Improve visibility of SLA performance
3. Enable branch/location ownership and escalation workflow
4. Capture feedback and quality metrics per branch/location/team

## 3. Organization Model

Communication permission and visibility derive from company structure:

1. Company
2. Branch (main branch)
3. Location (sub-branch under branch)
4. Head office (administrative/global)

Each user profile must expose:

1. `companyId`
2. `branchId` (nullable)
3. `locationId` (nullable)
4. `roleId`
5. `jobTitleId`
6. `isHeadOffice` (boolean)
7. `communicationTier` (derived, integer/string rank)

## 4. Internal Communication Rules

### 4.1 1:1 direct messaging policy

1. Same location peers: instant chat allowed
2. Same branch (different locations): allowed by branch policy
3. Lower tier to higher tier: requires Engagement Request approval
4. Higher tier to lower tier: allowed unless blocked by policy
5. Head office to branch/location: allowed by policy

### 4.2 Engagement Request flow (mandatory for upward communication)

1. Requester selects target user
2. Request reason required (enum)
3. Optional linked entity (`parcelId`, `bookingCode`, `paymentId`, etc.)
4. Approver can `approve` or `decline`
5. On approve: direct thread is created/unlocked
6. Access can be permanent or expiry-based (e.g., 7 days)
7. All actions written to audit log

### 4.3 Group and channel creation scope

Creator can create communication spaces only within governed scope:

1. Location-level user:
   1. Location supervisors
   2. Location junior officers
   3. Entire location members
2. Branch-level manager:
   1. Entire branch
   2. All locations in branch
   3. Selected locations in branch
3. Head office:
   1. Cross-branch channels
   2. Company-wide announcements
   3. Executive channels

## 5. Real-Time and Call Architecture

### 5.1 Text and presence

1. Transport: WebSocket (Bun server + horizontal scale via Redis pub/sub)
2. Persistence: Postgres
3. Realtime events:
   1. message.created
   2. message.updated
   3. message.deleted (soft)
   4. participant.typing
   5. participant.presence
   6. read.receipt.updated

### 5.2 Calls (LiveKit)

1. LiveKit handles audio/video/screen-share
2. Backend mints short-lived LiveKit tokens
3. Room access authorized by thread/group/channel membership + RBAC
4. Call session metadata persisted in ERP DB
5. Optional recording policy for management channels

## 6. Customer Communication Model

### 6.1 Product boundary

Customer communication is ticket-first, chat-enabled:

1. Conversation (message stream)
2. Ticket (workflow state + SLA)
3. Feedback (CSAT/NPS/comment)

### 6.2 Intake channels

1. Call center logged interactions
2. Web customer portal chat
3. WhatsApp integration (future phase)
4. Email integration (future phase)

### 6.3 Ticket ownership and routing

Each ticket must have:

1. `ownerUserId`
2. `ownerTeam` / `ownerQueue`
3. `branchId` and optional `locationId`
4. Linked parcel/booking/tracking when available

### 6.4 Core ticket statuses

1. new
2. open
3. pending-customer
4. pending-internal
5. escalated
6. resolved
7. closed

## 7. SLA and Escalation

### 7.1 SLA dimensions

1. First response SLA
2. Resolution SLA
3. Escalation SLA

### 7.2 Escalation chain

1. Agent -> Supervisor
2. Supervisor -> Branch manager
3. Branch manager -> Head office operations / customer service lead

### 7.3 SLA triggers

1. warning before breach
2. breach events and dashboard counters
3. optional auto-reassign after timeout

## 8. Data Model (Draft)

## 8.1 Internal chat tables

1. `comm_threads`
2. `comm_thread_participants`
3. `comm_messages`
4. `comm_message_attachments`
5. `comm_read_receipts`
6. `comm_engagement_requests`
7. `comm_groups`
8. `comm_group_members`
9. `comm_channels`
10. `comm_channel_members`
11. `comm_presence`

## 8.2 Call tables

1. `comm_call_sessions`
2. `comm_call_participants`
3. `comm_call_recordings` (optional)

## 8.3 Customer service tables

1. `cs_conversations`
2. `cs_conversation_messages`
3. `cs_tickets`
4. `cs_ticket_events`
5. `cs_sla_policies`
6. `cs_feedback`

## 8.4 Common column standards

Every table should include where relevant:

1. `id` (varchar(25))
2. `company_id`
3. `branch_id` (nullable)
4. `location_id` (nullable)
5. `created_by`
6. `created_at`
7. `updated_at`
8. `is_deleted` (soft delete)
9. `deleted_by`, `deleted_at`, `delete_reason` (for soft-delete auditability)

## 9. API Contract (Draft)

## 9. API Contract (Current + Planned)

## 9.1 Internal communication APIs (current implementation)

1. `POST /v1/communication/engagement-requests`
2. `POST /v1/communication/engagement-requests/:id/approve`
3. `POST /v1/communication/engagement-requests/:id/decline`
4. `GET /v1/communication/threads`
5. `POST /v1/communication/threads`
6. `GET /v1/communication/messages`
7. `POST /v1/communication/messages`
8. `GET /v1/communication/channels`
9. `POST /v1/communication/channels`
10. `GET /v1/communication/groups`
11. `POST /v1/communication/groups`
12. `GET /v1/communication/presence`
13. `POST /v1/communication/presence`

## 9.2 LiveKit APIs (current implementation)

1. `GET /v1/communication/calls`
2. `POST /v1/communication/calls`
3. `POST /v1/communication/calls/token` (planned)
4. `POST /v1/communication/calls/sessions` (planned refinement)
5. `PATCH /v1/communication/calls/sessions/:id/end` (planned refinement)
6. `GET /v1/communication/calls/sessions/:id` (planned refinement)

## 9.3 Customer service APIs (current implementation)

1. `GET /v1/customer-service/conversations`
2. `POST /v1/customer-service/conversations`
3. `GET /v1/customer-service/tickets`
4. `POST /v1/customer-service/tickets`
5. `GET /v1/customer-service/sla`
6. `POST /v1/customer-service/sla`
7. `GET /v1/customer-service/feedback`
8. `POST /v1/customer-service/feedback`

## 10. Permission Catalog (RBAC)

Define unique permission keys for each action.

## 10.1 Internal messaging

1. `CanReadCommunicationThreads`
2. `CanCreateDirectChats`
3. `CanCreateGroupChats`
4. `CanCreateLocationChannels`
5. `CanCreateBranchChannels`
6. `CanCreateCrossBranchChannels`
7. `CanSendMessages`
8. `CanEditOwnMessages`
9. `CanDeleteOwnMessages`
10. `CanModerateChannelMessages`
11. `CanManageChannelMembers`

## 10.2 Engagement requests

1. `CanCreateEngagementRequests`
2. `CanApproveEngagementRequests`
3. `CanDeclineEngagementRequests`
4. `CanOverrideEngagementRestrictions`

## 10.3 Calls

1. `CanStartAudioCalls`
2. `CanStartVideoCalls`
3. `CanShareScreen`
4. `CanJoinManagementCallChannels`
5. `CanAccessCallRecordings`

## 10.4 Customer service

1. `CanReadCustomerTickets`
2. `CanCreateCustomerTickets`
3. `CanReplyCustomerTickets`
4. `CanEscalateCustomerTickets`
5. `CanResolveCustomerTickets`
6. `CanCloseCustomerTickets`
7. `CanManageSlaPolicies`
8. `CanReadCustomerFeedback`

## 10.5 Audit and governance

1. `CanReadCommunicationAudit`
2. `CanExportCommunicationLogs`
3. `CanReadDeletedCommunicationRecords`

## 11. UX Flows

## 11.1 Web/Desktop internal UX

1. Left panel: channels/groups/direct messages
2. Middle panel: conversation timeline + linked ERP entities
3. Right panel: participants, permissions, call actions
4. Header actions:
   1. Start audio call
   2. Start video call
   3. Share screen
   4. Link parcel/consignment

## 11.2 Mobile internal UX

1. Inbox list with unread counters
2. Thread screen optimized for quick response and attachment capture
3. One-tap call join for location supervisors and riders
4. Low-bandwidth mode (voice-first fallback)

## 11.3 Customer service UX

1. Unified inbox by queue/team
2. Ticket details with timeline and SLA clock
3. Quick actions: assign, escalate, request customer info, resolve
4. Feedback capture panel on closure

## 12. Analytics and KPIs

Track by branch/location/team:

1. Internal median first reply time
2. Engagement request approval time
3. Open channel unresolved mentions
4. Customer first response SLA compliance
5. Ticket resolution SLA compliance
6. Escalation rate
7. Reopen rate
8. CSAT score

## 13. Security and Compliance

1. Tokenized access only; no static credentials in clients
2. Message retention policy configurable by company
3. Attachment virus scanning and MIME restriction
4. Edit/delete policy with immutable audit trail
5. Rate limiting for spam prevention
6. Access revocation immediate on user deactivation

## 14. Implementation Roadmap

### Phase 1: Internal chat core

1. Threads (direct/group)
2. Engagement requests
3. Scope-based group creation
4. Basic real-time and read receipts
5. Permission guards and audit logs

### Phase 2: LiveKit calls

1. Audio/video/screen-share
2. Call channel creation and membership control
3. Session logging and optional recordings

### Phase 3: Customer service suite

1. Ticket + conversation model
2. SLA policy and escalation engine
3. Feedback workflow

### Phase 4: Omnichannel expansion

1. WhatsApp integration
2. Email integration
3. Advanced analytics dashboard

## 15. Immediate Build Tasks (Recommended next sprint)

1. Add module flags:
   1. `communication_internal`
   2. `communication_customer_service`
   3. `communication_calls_livekit`
2. Add permission keys listed in section 10
3. Create migrations for section 8 core tables
4. Implement engagement-request API and UI first
5. Implement direct/group realtime messaging second
6. Integrate LiveKit token endpoint and start/join flow third
7. Add customer ticket MVP fourth

## 16. Decision Notes

1. LiveKit is selected for meeting/call capability
2. Internal text communication remains ERP-native for control and audit
3. Customer communication is ticket-centered, not free-form only
4. Upward communication requires approval unless explicit override permission exists
