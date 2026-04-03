import { t } from 'elysia';

export const CustomerServiceSlaIdParamSchema = t.Object({
  id: t.String({ minLength: 1 }),
});

export const CustomerServiceSlaListQuerySchema = t.Object({
  // reserved for future filtering
});

export const CustomerServiceSlaCreateBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  firstResponseMinutes: t.Optional(t.Numeric({ minimum: 1 })),
  resolutionMinutes: t.Optional(t.Numeric({ minimum: 1 })),
  escalationMinutes: t.Optional(t.Numeric({ minimum: 1 })),
  isActive: t.Optional(t.Boolean()),
});
