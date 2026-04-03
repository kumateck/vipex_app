import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { branches, companies, locations, users } from './core';
import { customers } from './customers';
import { parcels } from './shipments';

// Internal communication
export const commThreads = pgTable(
  'comm_threads',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    threadType: varchar('thread_type', { length: 32 }).notNull(), // direct | group | channel | customer
    title: varchar('title', { length: 255 }),
    isPrivate: boolean('is_private').notNull().default(true),
    lastMessageAt: timestamp('last_message_at', { withTimezone: false }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    deletedBy: varchar('deleted_by', { length: 25 }).references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    deleteReason: text('delete_reason'),
  },
  (t) => ({
    byCompanyLastMessage: index('comm_threads_company_last_message_idx').on(
      t.companyId,
      t.lastMessageAt,
    ),
  }),
);

export const commThreadParticipants = pgTable(
  'comm_thread_participants',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    threadId: varchar('thread_id', { length: 25 })
      .notNull()
      .references(() => commThreads.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    roleInThread: varchar('role_in_thread', { length: 20 }), // owner | admin | member
    joinedAt: timestamp('joined_at', { withTimezone: false }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: false }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byThread: index('comm_thread_participants_thread_idx').on(t.threadId),
    byUser: index('comm_thread_participants_user_idx').on(t.userId),
    uqThreadUser: uniqueIndex('comm_thread_participants_thread_user_uq').on(t.threadId, t.userId),
  }),
);

export const commMessages = pgTable(
  'comm_messages',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    threadId: varchar('thread_id', { length: 25 })
      .notNull()
      .references(() => commThreads.id),
    senderUserId: varchar('sender_user_id', { length: 25 }).references(() => users.id),
    messageType: varchar('message_type', { length: 20 }).notNull().default('text'),
    body: text('body'),
    metadataJson: jsonb('metadata_json'),
    replyToMessageId: varchar('reply_to_message_id', { length: 25 }),
    editedAt: timestamp('edited_at', { withTimezone: false }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    deletedBy: varchar('deleted_by', { length: 25 }).references(() => users.id),
    deletedAt: timestamp('deleted_at', { withTimezone: false }),
    deleteReason: text('delete_reason'),
  },
  (t) => ({
    byThreadCreatedAt: index('comm_messages_thread_created_idx').on(t.threadId, t.createdAt),
    bySender: index('comm_messages_sender_idx').on(t.senderUserId),
  }),
);

export const commMessageAttachments = pgTable(
  'comm_message_attachments',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    messageId: varchar('message_id', { length: 25 })
      .notNull()
      .references(() => commMessages.id),
    fileKey: varchar('file_key', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    sizeBytes: integer('size_bytes'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byMessage: index('comm_message_attachments_message_idx').on(t.messageId),
  }),
);

export const commReadReceipts = pgTable(
  'comm_read_receipts',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    messageId: varchar('message_id', { length: 25 })
      .notNull()
      .references(() => commMessages.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    readAt: timestamp('read_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byMessage: index('comm_read_receipts_message_idx').on(t.messageId),
    byUser: index('comm_read_receipts_user_idx').on(t.userId),
    uqMessageUser: uniqueIndex('comm_read_receipts_message_user_uq').on(t.messageId, t.userId),
  }),
);

export const commEngagementRequests = pgTable(
  'comm_engagement_requests',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    requesterUserId: varchar('requester_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    targetUserId: varchar('target_user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    reasonCode: varchar('reason_code', { length: 80 }),
    reasonNote: text('reason_note'),
    linkedEntityType: varchar('linked_entity_type', { length: 50 }),
    linkedEntityId: varchar('linked_entity_id', { length: 25 }),
    scope: varchar('scope', { length: 20 }).notNull().default('temporary'),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    declinedBy: varchar('declined_by', { length: 25 }).references(() => users.id),
    declinedAt: timestamp('declined_at', { withTimezone: false }),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTargetStatus: index('comm_engagement_requests_target_status_idx').on(
      t.targetUserId,
      t.status,
    ),
    byRequester: index('comm_engagement_requests_requester_idx').on(t.requesterUserId),
  }),
);

export const commGroups = pgTable(
  'comm_groups',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    isDeleted: boolean('is_deleted').notNull().default(false),
  },
  (t) => ({
    byCompany: index('comm_groups_company_idx').on(t.companyId),
  }),
);

export const commGroupMembers = pgTable(
  'comm_group_members',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    groupId: varchar('group_id', { length: 25 })
      .notNull()
      .references(() => commGroups.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    memberRole: varchar('member_role', { length: 20 }).default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byGroup: index('comm_group_members_group_idx').on(t.groupId),
    byUser: index('comm_group_members_user_idx').on(t.userId),
    uqGroupUser: uniqueIndex('comm_group_members_group_user_uq').on(t.groupId, t.userId),
  }),
);

export const commChannels = pgTable(
  'comm_channels',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    channelType: varchar('channel_type', { length: 20 }).notNull().default('text'), // text | voice
    visibility: varchar('visibility', { length: 20 }).notNull().default('public'), // public | private
    isCallEnabled: boolean('is_call_enabled').notNull().default(false),
    isAnnouncementOnly: boolean('is_announcement_only').notNull().default(false),
    threadId: varchar('thread_id', { length: 25 }).references(() => commThreads.id),
    maxParticipants: integer('max_participants'),
    isArchived: boolean('is_archived').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
    isDeleted: boolean('is_deleted').notNull().default(false),
  },
  (t) => ({
    byCompany: index('comm_channels_company_idx').on(t.companyId),
    byCompanyType: index('comm_channels_company_type_idx').on(t.companyId, t.channelType),
    byCompanyVisibility: index('comm_channels_company_visibility_idx').on(
      t.companyId,
      t.visibility,
    ),
  }),
);

export const commChannelMembers = pgTable(
  'comm_channel_members',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    channelId: varchar('channel_id', { length: 25 })
      .notNull()
      .references(() => commChannels.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    memberRole: varchar('member_role', { length: 20 }).default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byChannel: index('comm_channel_members_channel_idx').on(t.channelId),
    byUser: index('comm_channel_members_user_idx').on(t.userId),
    uqChannelUser: uniqueIndex('comm_channel_members_channel_user_uq').on(t.channelId, t.userId),
  }),
);

export const commChannelReadState = pgTable(
  'comm_channel_read_state',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    channelId: varchar('channel_id', { length: 25 })
      .notNull()
      .references(() => commChannels.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    lastReadAt: timestamp('last_read_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byChannel: index('comm_channel_read_state_channel_idx').on(t.channelId),
    byUser: index('comm_channel_read_state_user_idx').on(t.userId),
    uqChannelUser: uniqueIndex('comm_channel_read_state_channel_user_uq').on(t.channelId, t.userId),
  }),
);

export const commPushTokens = pgTable(
  'comm_push_tokens',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    token: varchar('token', { length: 255 }).notNull(),
    platform: varchar('platform', { length: 20 }).notNull().default('unknown'),
    isActive: boolean('is_active').notNull().default(true),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: false }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyUser: index('comm_push_tokens_company_user_idx').on(t.companyId, t.userId),
    byToken: uniqueIndex('comm_push_tokens_token_uq').on(t.token),
  }),
);

export const commPresence = pgTable(
  'comm_presence',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 25 })
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('offline'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uqUser: uniqueIndex('comm_presence_user_uq').on(t.userId),
  }),
);

// Calls
export const commCallSessions = pgTable(
  'comm_call_sessions',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    threadId: varchar('thread_id', { length: 25 }).references(() => commThreads.id),
    channelId: varchar('channel_id', { length: 25 }).references(() => commChannels.id),
    initiatorUserId: varchar('initiator_user_id', { length: 25 }).references(() => users.id),
    callType: varchar('call_type', { length: 20 }).notNull().default('audio'),
    status: varchar('status', { length: 20 }).notNull().default('ringing'),
    livekitRoomName: varchar('livekit_room_name', { length: 255 }),
    startedAt: timestamp('started_at', { withTimezone: false }),
    endedAt: timestamp('ended_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyCreatedAt: index('comm_call_sessions_company_created_idx').on(
      t.companyId,
      t.createdAt,
    ),
  }),
);

export const commCallParticipants = pgTable(
  'comm_call_participants',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    callSessionId: varchar('call_session_id', { length: 25 })
      .notNull()
      .references(() => commCallSessions.id),
    userId: varchar('user_id', { length: 25 }).references(() => users.id),
    joinedAt: timestamp('joined_at', { withTimezone: false }),
    leftAt: timestamp('left_at', { withTimezone: false }),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCallSession: index('comm_call_participants_call_idx').on(t.callSessionId),
  }),
);

export const commCallRecordings = pgTable(
  'comm_call_recordings',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    callSessionId: varchar('call_session_id', { length: 25 })
      .notNull()
      .references(() => commCallSessions.id),
    recordingKey: varchar('recording_key', { length: 500 }).notNull(),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    bySession: index('comm_call_recordings_session_idx').on(t.callSessionId),
  }),
);

// Customer service
export const csConversations = pgTable(
  'cs_conversations',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    customerId: varchar('customer_id', { length: 25 }).references(() => customers.id),
    ticketId: varchar('ticket_id', { length: 25 }),
    channel: varchar('channel', { length: 30 }).notNull().default('portal_chat'),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('cs_conversations_company_idx').on(t.companyId),
    byCustomer: index('cs_conversations_customer_idx').on(t.customerId),
  }),
);

export const csConversationMessages = pgTable(
  'cs_conversation_messages',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: varchar('conversation_id', { length: 25 })
      .notNull()
      .references(() => csConversations.id),
    senderType: varchar('sender_type', { length: 20 }).notNull(), // customer | agent | system
    senderUserId: varchar('sender_user_id', { length: 25 }).references(() => users.id),
    body: text('body'),
    metadataJson: jsonb('metadata_json'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byConversation: index('cs_conversation_messages_conversation_idx').on(t.conversationId),
  }),
);

export const csTickets = pgTable(
  'cs_tickets',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    conversationId: varchar('conversation_id', { length: 25 }).references(() => csConversations.id),
    status: varchar('status', { length: 30 }).notNull().default('new'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    channel: varchar('channel', { length: 30 }).notNull().default('portal_chat'),
    subject: varchar('subject', { length: 255 }),
    description: text('description'),
    trackingCode: varchar('tracking_code', { length: 50 }),
    bookingCode: varchar('booking_code', { length: 50 }),
    parcelId: varchar('parcel_id', { length: 25 }).references(() => parcels.id),
    ownerUserId: varchar('owner_user_id', { length: 25 }).references(() => users.id),
    ownerQueue: varchar('owner_queue', { length: 100 }),
    branchId: varchar('branch_id', { length: 25 }).references(() => branches.id),
    locationId: varchar('location_id', { length: 25 }).references(() => locations.id),
    firstResponseDueAt: timestamp('first_response_due_at', { withTimezone: false }),
    resolutionDueAt: timestamp('resolution_due_at', { withTimezone: false }),
    escalationDueAt: timestamp('escalation_due_at', { withTimezone: false }),
    resolvedAt: timestamp('resolved_at', { withTimezone: false }),
    closedAt: timestamp('closed_at', { withTimezone: false }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatusPriority: index('cs_tickets_company_status_priority_idx').on(
      t.companyId,
      t.status,
      t.priority,
    ),
    byOwnerStatus: index('cs_tickets_owner_status_idx').on(t.ownerUserId, t.status),
    byTrackingCode: index('cs_tickets_tracking_idx').on(t.trackingCode),
  }),
);

export const csTicketEvents = pgTable(
  'cs_ticket_events',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    ticketId: varchar('ticket_id', { length: 25 })
      .notNull()
      .references(() => csTickets.id),
    eventType: varchar('event_type', { length: 60 }).notNull(),
    eventNote: text('event_note'),
    fromStatus: varchar('from_status', { length: 30 }),
    toStatus: varchar('to_status', { length: 30 }),
    performedBy: varchar('performed_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byTicket: index('cs_ticket_events_ticket_idx').on(t.ticketId),
  }),
);

export const csSlaPolicies = pgTable(
  'cs_sla_policies',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    firstResponseMinutes: integer('first_response_minutes').notNull().default(30),
    resolutionMinutes: integer('resolution_minutes').notNull().default(240),
    escalationMinutes: integer('escalation_minutes').notNull().default(120),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('cs_sla_policies_company_idx').on(t.companyId),
  }),
);

export const csFeedback = pgTable(
  'cs_feedback',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    ticketId: varchar('ticket_id', { length: 25 })
      .notNull()
      .references(() => csTickets.id),
    customerId: varchar('customer_id', { length: 25 }).references(() => customers.id),
    score: integer('score').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompany: index('cs_feedback_company_idx').on(t.companyId),
    byTicket: index('cs_feedback_ticket_idx').on(t.ticketId),
  }),
);
