import { t } from 'elysia';

export const CommunicationCallsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationVoiceJoinParamSchema = t.Object({
  channelId: t.String({ minLength: 1 }),
});

export const CommunicationCallsListQuerySchema = t.Object({
  threadId: t.Optional(t.String({ minLength: 1 })),
  channelId: t.Optional(t.String({ minLength: 1 })),
  status: t.Optional(t.String({ minLength: 1 })),
});

export const CommunicationCallsCreateBodySchema = t.Object({
  threadId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  channelId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  callType: t.Optional(t.Union([t.Literal('audio'), t.Literal('video')])),
  livekitRoomName: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
});

export const CommunicationCallsUpdateStatusBodySchema = t.Object({
  status: t.Union([
    t.Literal('pending'),
    t.Literal('ringing'),
    t.Literal('active'),
    t.Literal('ended'),
    t.Literal('cancelled'),
  ]),
});
