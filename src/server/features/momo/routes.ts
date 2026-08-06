import { Elysia, t } from 'elysia';
import { UUID } from '@/server/schemas/common';
import {
  authPlugin,
  type AuthUser,
  requireAnyPermissions,
  requireAuth,
} from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  getMomoTransactionStatusSvc,
  handleMomoCallbackSvc,
  initiateMomoRequestToPaySvc,
} from './service';

export const momoRoutes = new Elysia({ name: 'momo' })
  .use(authPlugin)
  .post(
    '/requesttopay',
    async ({ body, user }) => {
      const authUser = user as AuthUser;
      return initiateMomoRequestToPaySvc({
        ...(body as {
          parcelId: string;
          flow: 'sender' | 'receiver';
          momoNumber: string;
          amountCedis: number;
        }),
        companyId: authUser.companyId ?? '',
        branchId: authUser.branchId ?? '',
        requestedBy: authUser.sub,
      });
    },
    {
      body: t.Object({
        parcelId: UUID,
        flow: t.Union([t.Literal('sender'), t.Literal('receiver')]),
        momoNumber: t.String({ minLength: 9, maxLength: 15 }),
        amountCedis: t.Number({ minimum: 0.01 }),
      }),
      detail: {
        tags: ['MoMo'],
        summary: 'Initiate an MTN MoMo Request-to-Pay for a parcel payment',
      },
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanCreateSenderPayments,
          PermissionKeys.CanCreateReceiverPayments,
        ),
      ],
    },
  )
  .get(
    '/requesttopay/:id/status',
    async ({ params, user }) => {
      const authUser = user as AuthUser;
      return getMomoTransactionStatusSvc({ id: params.id, companyId: authUser.companyId ?? '' });
    },
    {
      params: t.Object({ id: UUID }),
      detail: {
        tags: ['MoMo'],
        summary: 'Get the current status of an MTN MoMo Request-to-Pay',
      },
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanCreateSenderPayments,
          PermissionKeys.CanCreateReceiverPayments,
        ),
      ],
    },
  )
  .post(
    '/callback',
    async ({ body }) => {
      await handleMomoCallbackSvc(
        body as {
          externalId?: string;
          status?: string;
          financialTransactionId?: string;
          reason?: string;
        },
      );
      return { ok: true };
    },
    {
      body: t.Record(t.String(), t.Unknown()),
      detail: {
        tags: ['MoMo'],
        summary: 'MTN MoMo async payment status callback (called by MTN, not authenticated)',
      },
    },
  );
