import { t } from 'elysia';

export const CommunicationEngagementRequestsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationEngagementRequestsListQuerySchema = t.Object({
  view: t.Optional(t.Union([t.Literal('incoming'), t.Literal('outgoing'), t.Literal('all')])),
  status: t.Optional(t.Union([t.Literal('pending'), t.Literal('approved'), t.Literal('declined')])),
});

export const CommunicationEngagementRequestsCreateBodySchema = t.Object({
  targetUserId: t.String({ minLength: 1 }),
  reasonCode: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 80 }), t.Null()])),
  reasonNote: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  linkedEntityType: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 50 }), t.Null()])),
  linkedEntityId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  scope: t.Optional(t.Union([t.Literal('temporary'), t.Literal('persistent')])),
  expiresAt: t.Optional(t.Union([t.String({ format: 'date-time' }), t.Null()])),
});

export const CommunicationEngagementRequestsDecideBodySchema = t.Object({});
