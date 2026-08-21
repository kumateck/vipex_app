import { t } from 'elysia';

export const FleetAnomalyBriefGenerateBodySchema = t.Object({
  from: t.String({ minLength: 1 }),
  to: t.String({ minLength: 1 }),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});
