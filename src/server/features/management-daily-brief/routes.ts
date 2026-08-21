import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { generateManagementDailyBriefCtrl, getLatestManagementDailyBriefCtrl } from './controller';
import { managementDailyBriefRateLimit } from './rate-limit';

export const managementDailyBriefRoutes = new Elysia({ name: 'management-daily-brief' })
  .use(authPlugin)
  .get(
    '/latest',
    async ({ user }) => getLatestManagementDailyBriefCtrl({ companyId: user!.companyId! }),
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadManagementDailyBrief)],
    },
  )
  .post(
    '/generate',
    async ({ user }) =>
      generateManagementDailyBriefCtrl({ companyId: user!.companyId!, userId: user!.sub }),
    {
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadManagementDailyBrief),
        managementDailyBriefRateLimit(),
      ],
    },
  );
