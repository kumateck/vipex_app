import { t } from 'elysia';

export const CommunicationChannelsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationChannelsListQuerySchema = t.Object({});

export const CommunicationChannelsCreateBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  isCallEnabled: t.Optional(t.Boolean()),
  isAnnouncementOnly: t.Optional(t.Boolean()),
});
