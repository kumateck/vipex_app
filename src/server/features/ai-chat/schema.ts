import { t } from 'elysia';

export const AiChatSendMessageBodySchema = t.Object({
  conversationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  message: t.String({ minLength: 1, maxLength: 1000 }),
});
