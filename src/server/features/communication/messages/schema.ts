import { t } from 'elysia';

export const CommunicationMessagesIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationMessagesListQuerySchema = t.Object({
  threadId: t.String({ minLength: 1 }),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
});

export const CommunicationMessagesCreateBodySchema = t.Object({
  threadId: t.String({ minLength: 1 }),
  body: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  messageType: t.Optional(t.String({ minLength: 1 })),
  metadataJson: t.Optional(t.Any()),
});
