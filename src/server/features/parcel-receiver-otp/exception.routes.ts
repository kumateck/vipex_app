import { Elysia, t } from 'elysia';
import { authPlugin, requireAuth } from '@/server/plugins/auth';
import { UUID } from '@/server/schemas/common';
import { Forbidden } from '@/server/utils/http-error';
import { PermissionKeys } from '@/shared/permissions/constants';
import { MAX_OTP_EXCEPTION_REASON_LENGTH } from '@/shared/shipments/receiver-otp-exception';
import { authorizeParcelWithoutOtp, readParcelOtpAuthorization } from './exception.service';

const workflow = t.Union([t.Literal('office_pickup'), t.Literal('receiver_cashier')]);
const handoverTarget = t.Union([t.Literal('main'), t.Literal('second')]);
const params = t.Object({ id: UUID });

export const receiverOtpExceptionRoutes = new Elysia({ name: 'receiver-otp-exception' })
  .use(authPlugin)
  .post(
    '/:id/otp-authorization',
    ({ params, body, user }) =>
      authorizeParcelWithoutOtp({
        ...body,
        parcelId: params.id,
        companyId: user!.companyId ?? '',
        branchId: user!.branchId ?? '',
        actorUserId: user!.sub,
      }),
    {
      params,
      body: t.Object({
        workflow,
        handoverTarget,
        expectedReceiverId: UUID,
        expectedCollectorId: UUID,
        reason: t.String({ maxLength: MAX_OTP_EXCEPTION_REASON_LENGTH }),
      }),
      beforeHandle: [requireAuth()],
      detail: { tags: ['Shipments'], summary: 'Approve one parcel handover without OTP' },
    },
  )
  .get(
    '/:id/otp-authorization',
    async ({ params, query, user }) => {
      const permission =
        query.workflow === 'office_pickup'
          ? PermissionKeys.CanCompleteOfficePickup
          : PermissionKeys.CanCreateReceiverPayments;
      if (!user?.permissions?.includes(permission)) throw Forbidden('Missing handover permission');
      const approval = await readParcelOtpAuthorization({
        ...query,
        parcelId: params.id,
        companyId: user.companyId ?? '',
        branchId: user.branchId ?? '',
      });
      return Response.json({ approval }, { headers: { 'cache-control': 'no-store, private' } });
    },
    {
      params,
      query: t.Object({ workflow, handoverTarget }),
      beforeHandle: [requireAuth()],
      detail: {
        tags: ['Shipments'],
        summary: 'Check for active approval to hand over without OTP',
      },
    },
  );
