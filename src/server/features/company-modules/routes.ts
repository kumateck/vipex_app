import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAuth,
  requireHeadOffice,
  requirePermissions,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { listCompanyModulesSvc, setCompanyModuleStateSvc } from './service';
import { HttpStatus } from '@/server/utils/http-status';

export const companyModulesRoutes = new Elysia({ name: 'company-modules' })
  .use(authPlugin)
  .get(
    '/',
    async ({ user }) => {
      return listCompanyModulesSvc(user!.companyId!);
    },
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompanyModules),
        requireHeadOffice(),
      ],
      detail: {
        tags: ['Company Modules'],
        summary: 'List company module states',
        operationId: 'listCompanyModules',
      },
    },
  )
  .put(
    '/:moduleCode',
    async ({ params, body, user, set }) => {
      const result = await setCompanyModuleStateSvc({
        companyId: user!.companyId!,
        moduleCode: params.moduleCode,
        isEnabled: body.isEnabled,
        settings: body.settings ?? null,
        configuredBy: user!.sub,
      });
      set.status = HttpStatus.OK;
      return result;
    },
    {
      params: t.Object({ moduleCode: t.String({ minLength: 1, maxLength: 50 }) }),
      body: t.Object({
        isEnabled: t.Boolean(),
        settings: t.Optional(t.Any()),
        companyId: t.Optional(UUID),
      }),
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanManageCompanyModules),
        requireHeadOffice(),
      ],
      detail: {
        tags: ['Company Modules'],
        summary: 'Enable or disable a company module',
        operationId: 'setCompanyModuleState',
      },
    },
  );
