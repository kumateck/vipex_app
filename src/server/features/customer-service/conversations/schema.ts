import { t } from 'elysia';

export const CustomerServiceConversationsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CustomerServiceConversationsListQuerySchema = t.Object({
  // reserved for future filtering
});

export const CustomerServiceConversationsCreateBodySchema = t.Object({
  customerId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  channel: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 30 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
