import { t } from 'elysia';

export const CommunicationMessagesIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationMessagesListQuerySchema = t.Object({
  threadId: t.String({ minLength: 1 }),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
});

export const CommunicationMeetingsListQuerySchema = t.Object({
  threadId: t.Optional(t.String({ minLength: 1 })),
  from: t.Optional(t.String({ format: 'date-time' })),
  to: t.Optional(t.String({ format: 'date-time' })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })),
});

export const CommunicationMessagesCreateBodySchema = t.Object({
  threadId: t.String({ minLength: 1 }),
  body: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  messageType: t.Optional(t.String({ minLength: 1 })),
  metadataJson: t.Optional(t.Any()),
  replyToMessageId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});

export const CommunicationMessagesUpdateBodySchema = t.Object({
  body: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  metadataJson: t.Optional(t.Any()),
});

export const CommunicationMessagesToggleFlagBodySchema = t.Object({
  flag: t.Union([t.Literal('pinnedByUserIds'), t.Literal('starredByUserIds')]),
  enabled: t.Boolean(),
});
