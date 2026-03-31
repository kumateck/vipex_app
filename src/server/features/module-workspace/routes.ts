import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { getModuleWorkspaceOverviewSvc } from './service';

export const moduleWorkspaceRoutes = new Elysia({ name: 'module-workspace' }).use(authPlugin).get(
  '/:moduleCode/overview',
  async ({ params, user }) =>
    getModuleWorkspaceOverviewSvc({
      companyId: user!.companyId!,
      moduleCode: params.moduleCode,
    }),
  {
    params: t.Object({ moduleCode: t.String({ minLength: 1, maxLength: 50 }) }),
    beforeHandle: [requireAuth()],
    detail: {
      tags: ['Module Workspace'],
      summary: 'Get module workspace overview for an enabled company module',
      operationId: 'getModuleWorkspaceOverview',
    },
  },
);
