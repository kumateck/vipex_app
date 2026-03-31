import { t } from 'elysia';

export const CommunicationGroupsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CommunicationGroupsListQuerySchema = t.Object({
  // reserved for future filtering
});

export const CommunicationGroupsCreateBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
