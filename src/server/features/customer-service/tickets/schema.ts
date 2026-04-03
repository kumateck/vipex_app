import { t } from 'elysia';

export const CustomerServiceTicketsIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CustomerServiceTicketsListQuerySchema = t.Object({
  status: t.Optional(t.String({ minLength: 1 })),
  priority: t.Optional(t.String({ minLength: 1 })),
});

export const CustomerServiceTicketsCreateBodySchema = t.Object({
  conversationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  channel: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 30 }), t.Null()])),
  priority: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 20 }), t.Null()])),
  subject: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 255 }), t.Null()])),
  description: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  trackingCode: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 50 }), t.Null()])),
  bookingCode: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 50 }), t.Null()])),
  parcelId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  locationId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
