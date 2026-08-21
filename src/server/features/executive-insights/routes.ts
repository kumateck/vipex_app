import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { generateExecutiveInsightsCtrl, getLatestExecutiveInsightsCtrl } from './controller';
import { executiveInsightsRateLimit } from './rate-limit';
import { ExecutiveInsightsGenerateBodySchema, ExecutiveInsightsLatestQuerySchema } from './schema';

export const executiveInsightsRoutes = new Elysia({ name: 'executive-insights' })
  .use(authPlugin)
  .get(
    '/latest',
    async ({ query, user }) =>
      getLatestExecutiveInsightsCtrl({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
      }),
    {
      query: ExecutiveInsightsLatestQuerySchema,
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadExecutiveInsights)],
    },
  )
  .post(
    '/generate',
    async ({ body, user }) =>
      generateExecutiveInsightsCtrl({
        companyId: user!.companyId!,
        userId: user!.sub,
        branchId: body.branchId ?? null,
        from: body.from,
        to: body.to,
      }),
    {
      body: ExecutiveInsightsGenerateBodySchema,
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadExecutiveInsights),
        executiveInsightsRateLimit(),
      ],
    },
  );
