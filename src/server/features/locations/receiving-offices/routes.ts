import { Elysia, t } from 'elysia';
import {
  authPlugin,
  requireAnyPermissions,
  requireAuth,
  requirePermissions,
  type AuthUser,
} from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  deleteReceivingOffice,
  getLocationOffices,
  getReceivingOfficeOptions,
  saveReceivingOffice,
} from './service';

const canReceive = requireAnyPermissions(
  PermissionKeys.CanReadParcelIncoming,
  PermissionKeys.CanReadParcelScan,
);
const canManage = requirePermissions(PermissionKeys.CanUpdateLocations);
const officeBody = t.Object({ name: t.String({ minLength: 1, maxLength: 255 }) });

export const receivingOfficeRoutes = new Elysia({ name: 'receiving-offices' })
  .use(authPlugin)
  .get(
    '/receiving-offices/options',
    ({ user }) => {
      const actor = user as AuthUser;
      return getReceivingOfficeOptions(actor.companyId, actor.branchId);
    },
    { beforeHandle: [requireAuth(), canReceive] },
  )
  .get(
    '/:id/receiving-offices',
    ({ params, user }) => getLocationOffices((user as AuthUser).companyId ?? '', params.id),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [requireAuth(), canManage],
    },
  )
  .post(
    '/:id/receiving-offices',
    ({ params, user, body }) =>
      saveReceivingOffice({
        companyId: (user as AuthUser).companyId ?? '',
        locationId: params.id,
        name: body.name,
      }),
    {
      params: t.Object({ id: UUID }),
      body: officeBody,
      beforeHandle: [requireAuth(), canManage],
    },
  )
  .patch(
    '/:id/receiving-offices/:officeId',
    ({ params, user, body }) =>
      saveReceivingOffice({
        companyId: (user as AuthUser).companyId ?? '',
        locationId: params.id,
        officeId: params.officeId,
        name: body.name,
      }),
    {
      params: t.Object({ id: UUID, officeId: UUID }),
      body: officeBody,
      beforeHandle: [requireAuth(), canManage],
    },
  )
  .delete(
    '/:id/receiving-offices/:officeId',
    ({ params, user }) =>
      deleteReceivingOffice({
        companyId: (user as AuthUser).companyId ?? '',
        locationId: params.id,
        officeId: params.officeId,
      }),
    {
      params: t.Object({ id: UUID, officeId: UUID }),
      beforeHandle: [requireAuth(), canManage],
      detail: { tags: ['Locations'], summary: 'Delete an unused receiving office' },
    },
  );
