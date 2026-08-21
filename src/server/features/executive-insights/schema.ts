import { t } from 'elysia';

export const ExecutiveInsightsGenerateBodySchema = t.Object({
  from: t.String({ minLength: 1 }),
  to: t.String({ minLength: 1 }),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});

export const ExecutiveInsightsLatestQuerySchema = t.Object({
  branchId: t.Optional(t.String({ minLength: 1 })),
});
