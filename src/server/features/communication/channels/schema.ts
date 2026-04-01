import { t } from 'elysia';

export const CommunicationChannelsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationChannelsParticipantParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
  userId: t.String({ minLength: 1 }),
});

export const CommunicationChannelsListQuerySchema = t.Object({
  channelType: t.Optional(t.Union([t.Literal('text'), t.Literal('voice')])),
  includeArchived: t.Optional(t.Boolean()),
});

export const CommunicationChannelsUnreadCountsQuerySchema = t.Object({
  channelType: t.Optional(t.Union([t.Literal('text'), t.Literal('voice')])),
});

export const CommunicationChannelsCreateBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  channelType: t.Optional(t.Union([t.Literal('text'), t.Literal('voice')])),
  visibility: t.Optional(t.Union([t.Literal('public'), t.Literal('private')])),
  participantUserIds: t.Optional(t.Array(t.String({ minLength: 1 }))),
  isCallEnabled: t.Optional(t.Boolean()),
  isAnnouncementOnly: t.Optional(t.Boolean()),
  maxParticipants: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
});

export const CommunicationChannelsUpdateBodySchema = t.Object({
  name: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  isArchived: t.Optional(t.Boolean()),
  isCallEnabled: t.Optional(t.Boolean()),
  isAnnouncementOnly: t.Optional(t.Boolean()),
  maxParticipants: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
});

export const CommunicationChannelsParticipantsBodySchema = t.Object({
  participantUserIds: t.Array(t.String({ minLength: 1 })),
});
