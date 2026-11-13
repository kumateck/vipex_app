import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAnyPermissions,
  requireAuth,
  type AuthUser,
} from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import { assignReceivingOffice } from './service';

export const parcelReceivingOfficeRoutes = new Elysia({ name: 'parcel-receiving-office' })
  .use(authPlugin)
  .patch(
    '/:id/receiving-office',
    ({ params, body, user }) => {
      const actor = user as AuthUser;
      return assignReceivingOffice({
        parcelId: params.id,
        officeId: body.receivingOfficeId,
        expectedReceivingOfficeId: body.expectedReceivingOfficeId,
        companyId: actor.companyId,
        branchId: actor.branchId,
        actorUserId: actor.sub,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        receivingOfficeId: UUID,
        expectedReceivingOfficeId: t.Optional(t.Union([UUID, t.Null()])),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadParcelIncoming,
          PermissionKeys.CanReadParcelScan,
        ),
      ],
    },
  );
