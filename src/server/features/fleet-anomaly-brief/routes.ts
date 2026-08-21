import { Elysia } from 'elysia';
import { authPlugin, requireAuth, requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { generateFleetAnomalyBriefCtrl, getLatestFleetAnomalyBriefCtrl } from './controller';
import { fleetAnomalyBriefRateLimit } from './rate-limit';
import { FleetAnomalyBriefGenerateBodySchema } from './schema';

export const fleetAnomalyBriefRoutes = new Elysia({ name: 'fleet-anomaly-brief' })
  .use(authPlugin)
  .get(
    '/latest',
    async ({ user }) => getLatestFleetAnomalyBriefCtrl({ companyId: user!.companyId! }),
    {
      beforeHandle: [requireAuth(), requirePermissions(PermissionKeys.CanReadFleetAnomalyBrief)],
    },
  )
  .post(
    '/generate',
    async ({ body, user }) =>
      generateFleetAnomalyBriefCtrl({
        companyId: user!.companyId!,
        userId: user!.sub,
        branchId: body.branchId ?? null,
        from: body.from,
        to: body.to,
      }),
    {
      body: FleetAnomalyBriefGenerateBodySchema,
      beforeHandle: [
        requireAuth(),
        requirePermissions(PermissionKeys.CanReadFleetAnomalyBrief),
        fleetAnomalyBriefRateLimit(),
      ],
    },
  );
