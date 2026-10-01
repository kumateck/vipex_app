import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { getReceiptReprintTaxSvc } from './receipt-reprint.service';

export const receiptReprintRoutes = new Elysia({ name: 'receipt-reprint' })
  .use(authPlugin)
  .get(
    '/v1/shipments/parcels/:id/receipt-reprint-tax',
    ({ params, user }) => getReceiptReprintTaxSvc(params.id, user as AuthUser),
    {
      params: t.Object({ id: UUID }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanReadConsignments,
          PermissionKeys.CanReadParcelOutgoing,
          PermissionKeys.CanReadParcels,
        ),
      ],
      detail: { tags: ['Shipments'], summary: 'Get recorded sender tax for receipt reprint' },
    },
  );
