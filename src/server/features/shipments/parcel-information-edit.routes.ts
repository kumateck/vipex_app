import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
  type AuthUser,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '../../schemas/common';
import { editParcelInformationSvc } from './parcel-information-edit.service';

export function assertParcelInformationEditAccess({
  user,
  body,
}: {
  user: AuthUser | null;
  body: unknown;
}) {
  requireAuth()({ user });
  requireAnyPermissions(
    PermissionKeys.CanUpdateParcels,
    PermissionKeys.CanReadParcelIncoming,
    PermissionKeys.CanCompleteOfficePickup,
    PermissionKeys.CanCreateReceiverPayments,
    PermissionKeys.CanReadParcelScan,
    PermissionKeys.CanReadShelfPickerUpdate,
  )({ user });
  if (body && typeof body === 'object' && 'receiver' in body && body.receiver) {
    requirePermissions(PermissionKeys.CanUpdateCustomers)({ user });
  }
}

export const parcelInformationEditRoutes = new Elysia({ name: 'parcel-information-edit' })
  .use(authPlugin)
  .post(
    '/:id/edit-information',
    ({ params, body, user }) => {
      return editParcelInformationSvc({
        ...body,
        id: params.id,
        companyId: user!.companyId ?? '',
        branchId: user!.branchId ?? '',
        actorUserId: user!.sub,
      });
    },
    {
      params: t.Object({ id: UUID }),
      body: t.Object({
        parcelDetails: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        parcelContent: t.Optional(t.String({ maxLength: 255 })),
        receiver: t.Optional(
          t.Object({
            id: UUID,
            fullname: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
            telephone: t.Optional(t.Union([t.String({ pattern: '^\\d{10}$' }), t.Null()])),
          }),
        ),
      }),
      beforeHandle: [assertParcelInformationEditAccess],
      detail: {
        tags: ['Shipments'],
        summary: 'Edit selected parcel information and its receiver customer atomically',
      },
    },
  );
