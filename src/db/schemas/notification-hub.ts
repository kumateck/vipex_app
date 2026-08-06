import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { companies, users } from './core';

export const NotificationChannel = {
  SMS: 'sms',
  EMAIL: 'email',
} as const;

export const NotificationCampaignStatus = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  REJECTED: 3,
  SENT: 4,
} as const;

export const notificationProviders = pgTable(
  'notification_providers',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    channel: varchar('channel', { length: 16 }).notNull(),
    providerKey: varchar('provider_key', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    configJson: jsonb('config_json'),
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyChannel: index('notification_providers_company_channel_idx').on(
      t.companyId,
      t.channel,
    ),
    byCompanyDefault: index('notification_providers_company_default_idx').on(
      t.companyId,
      t.channel,
      t.isDefault,
    ),
    uqCompanyChannelProvider: uniqueIndex('notification_providers_company_channel_provider_uq').on(
      t.companyId,
      t.channel,
      sql`lower(${t.providerKey})`,
    ),
  }),
);

export const notificationTemplates = pgTable(
  'notification_templates',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    channel: varchar('channel', { length: 16 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body').notNull(),
    variablesJson: jsonb('variables_json'),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyChannel: index('notification_templates_company_channel_idx').on(
      t.companyId,
      t.channel,
    ),
    uqCompanyChannelCode: uniqueIndex('notification_templates_company_channel_code_uq').on(
      t.companyId,
      t.channel,
      sql`lower(${t.code})`,
    ),
  }),
);

export const notificationCampaigns = pgTable(
  'notification_campaigns',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    name: varchar('name', { length: 255 }).notNull(),
    eventCode: varchar('event_code', { length: 80 }),
    channel: varchar('channel', { length: 16 }).notNull(),
    templateId: varchar('template_id', { length: 25 }).references(() => notificationTemplates.id),
    subjectOverride: varchar('subject_override', { length: 255 }),
    bodyOverride: text('body_override'),
    audienceType: varchar('audience_type', { length: 64 }).notNull(),
    status: smallint('status').notNull().default(NotificationCampaignStatus.DRAFT),
    scheduledAt: timestamp('scheduled_at', { withTimezone: false }),
    submittedBy: varchar('submitted_by', { length: 25 }).references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: false }),
    approvedBy: varchar('approved_by', { length: 25 }).references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: false }),
    rejectedBy: varchar('rejected_by', { length: 25 }).references(() => users.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: false }),
    approvalNote: text('approval_note'),
    sentBy: varchar('sent_by', { length: 25 }).references(() => users.id),
    sentAt: timestamp('sent_at', { withTimezone: false }),
    createdBy: varchar('created_by', { length: 25 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyStatus: index('notification_campaigns_company_status_idx').on(t.companyId, t.status),
    byCompanyCreated: index('notification_campaigns_company_created_idx').on(
      t.companyId,
      t.createdAt,
    ),
  }),
);

export const notificationDispatches = pgTable(
  'notification_dispatches',
  {
    id: varchar('id', { length: 25 })
      .primaryKey()
      .$defaultFn(() => createId()),
    companyId: varchar('company_id', { length: 25 })
      .notNull()
      .references(() => companies.id),
    campaignId: varchar('campaign_id', { length: 25 }).references(() => notificationCampaigns.id),
    channel: varchar('channel', { length: 16 }).notNull(),
    providerId: varchar('provider_id', { length: 25 }).references(() => notificationProviders.id),
    providerKey: varchar('provider_key', { length: 64 }),
    recipientType: varchar('recipient_type', { length: 32 }).notNull(),
    recipientId: varchar('recipient_id', { length: 25 }),
    recipientName: varchar('recipient_name', { length: 255 }),
    recipientAddress: varchar('recipient_address', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body').notNull(),
    status: varchar('status', { length: 24 }).notNull().default('pending'),
    attemptCount: integer('attempt_count').notNull().default(0),
    providerMessageId: varchar('provider_message_id', { length: 255 }),
    errorMessage: text('error_message'),
    metadataJson: jsonb('metadata_json'),
    createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byCompanyCreated: index('notification_dispatches_company_created_idx').on(
      t.companyId,
      t.createdAt,
    ),
    byCampaign: index('notification_dispatches_campaign_idx').on(t.campaignId),
    byCompanyStatus: index('notification_dispatches_company_status_idx').on(
      t.companyId,
      t.status,
      t.channel,
    ),
  }),
);
