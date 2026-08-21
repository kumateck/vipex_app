import { t } from 'elysia';

export const OperationsExceptionsBriefGenerateBodySchema = t.Object({
  from: t.String({ minLength: 1 }),
  to: t.String({ minLength: 1 }),
  branchId: t.Optional(t.Union([t.String({ minLength: 1 }), t.Null()])),
});

export const OperationsExceptionsBriefLatestQuerySchema = t.Object({
  branchId: t.Optional(t.String({ minLength: 1 })),
});
