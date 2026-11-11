import { Elysia, t } from 'elysia';
import { authPlugin, requireAnyPermissions, requireAuth } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { UUID } from '@/server/schemas/common';
import { getReceiverOtpSession } from './session.service';

export const receiverOtpSessionRoutes = new Elysia({ name: 'receiver-otp-session' })
  .use(authPlugin)
  .get(
    '/receiver-otp/session',
    async ({ query, user }) => {
      const session = await getReceiverOtpSession({
        ...query,
        companyId: user!.companyId ?? '',
        branchId: user!.branchId ?? '',
        actorUserId: user!.sub,
      });
      return Response.json(session, { headers: { 'cache-control': 'no-store, private' } });
    },
    {
      query: t.Object({
        parcelId: UUID,
        targetReceiver: t.Union([t.Literal('main'), t.Literal('second')]),
      }),
      beforeHandle: [
        requireAuth(),
        requireAnyPermissions(
          PermissionKeys.CanCreateReceiverPayments,
          PermissionKeys.CanCompleteOfficePickup,
        ),
      ],
      detail: {
        tags: ['Payments'],
        summary: 'Restore an active receiver OTP session when reopening a parcel',
      },
    },
  );
