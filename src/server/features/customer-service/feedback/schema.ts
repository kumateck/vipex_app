import { t } from 'elysia';

export const CustomerServiceFeedbackIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CustomerServiceFeedbackListQuerySchema = t.Object({
  ticketId: t.Optional(t.String({ minLength: 1 })),
});

export const CustomerServiceFeedbackCreateBodySchema = t.Object({
  ticketId: t.String({ minLength: 1 }),
  customerId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
  score: t.Numeric({ minimum: 1, maximum: 5 }),
  comment: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
