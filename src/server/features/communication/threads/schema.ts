import { t } from 'elysia';

export const CommunicationThreadsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationThreadsListQuerySchema = t.Object({
  threadType: t.Optional(t.Union([t.Literal('direct'), t.Literal('group'), t.Literal('channel')])),
});

export const CommunicationThreadsCreateBodySchema = t.Object({
  threadType: t.Union([t.Literal('direct'), t.Literal('group'), t.Literal('channel')]),
  title: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
  participantUserIds: t.Array(t.String({ minLength: 1 })),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
