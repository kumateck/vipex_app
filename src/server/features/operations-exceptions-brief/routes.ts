import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  generateOperationsExceptionsBriefCtrl,
  getLatestOperationsExceptionsBriefCtrl,
} from './controller';
import { operationsExceptionsBriefRateLimit } from './rate-limit';
import {
  OperationsExceptionsBriefGenerateBodySchema,
  OperationsExceptionsBriefLatestQuerySchema,
} from './schema';

export const operationsExceptionsBriefRoutes = new Elysia({ name: 'operations-exceptions-brief' })
  .use(authPlugin)
  .get(
    '/latest',
    async ({ query, user }) =>
      getLatestOperationsExceptionsBriefCtrl({
        companyId: user!.companyId!,
        branchId: query.branchId ?? null,
      }),
    {
      query: OperationsExceptionsBriefLatestQuerySchema,
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadOperationsExceptionsBrief),
      ],
    },
  )
  .post(
    '/generate',
    async ({ body, user }) =>
      generateOperationsExceptionsBriefCtrl({
        companyId: user!.companyId!,
        userId: user!.sub,
        branchId: body.branchId ?? null,
        from: body.from,
        to: body.to,
      }),
    {
      body: OperationsExceptionsBriefGenerateBodySchema,
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadOperationsExceptionsBrief),
        operationsExceptionsBriefRateLimit(),
      ],
    },
  );
